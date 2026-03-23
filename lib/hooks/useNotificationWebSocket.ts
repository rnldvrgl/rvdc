"use client"

import { getValidAccessToken, refreshAccessToken } from "@/lib/utils/tokens"
import { useQueryClient } from "@tanstack/react-query"
import { useCallback, useEffect, useRef } from "react"

type NotificationWSData = {
  event: "new_notification"
  notification: {
    id: number
    type: string
    title: string
    message: string
  }
  unread_count: number
}

type MaintenanceWSData = {
  event: "maintenance_result"
  success: boolean
  action: string
  title: string
  message: string
  results: Array<{
    task: string
    success: boolean
    output?: string
    error?: string
  }>
}

type WSData = NotificationWSData | MaintenanceWSData

type Options = {
  onNotification?: (data: NotificationWSData) => void
  onMaintenanceResult?: (data: MaintenanceWSData) => void
}

export function useNotificationWebSocket({ onNotification, onMaintenanceResult }: Options = {}) {
  const queryClient = useQueryClient()
  const wsRef = useRef<WebSocket | null>(null)
  const reconnectTimer = useRef<ReturnType<typeof setTimeout>>(undefined)
  const reconnectAttemptRef = useRef(0)
  const callbackRef = useRef(onNotification)
  callbackRef.current = onNotification
  const maintenanceCallbackRef = useRef(onMaintenanceResult)
  maintenanceCallbackRef.current = onMaintenanceResult

  const connect = useCallback(async () => {
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:8000"
    const wsProtocol = baseUrl.startsWith("https") ? "wss" : "ws"
    const host = baseUrl.replace(/^https?:\/\//, "")
    const token = await getValidAccessToken()

    if (!token) return

    // Clean up existing connection
    if (wsRef.current) {
      wsRef.current.close()
    }

    const ws = new WebSocket(
      `${wsProtocol}://${host}/ws/notifications/?token=${token}`,
    )
    wsRef.current = ws

    ws.onopen = () => {
      reconnectAttemptRef.current = 0
    }

    ws.onmessage = (event) => {
      try {
        const data: WSData = JSON.parse(event.data)

        if (data.event === "maintenance_result") {
          // Maintenance results — refresh stats, call handler
          queryClient.invalidateQueries({ queryKey: ["server-maintenance"] })
          maintenanceCallbackRef.current?.(data)
        } else {
          // Regular notifications
          queryClient.invalidateQueries({ queryKey: ["notifications"] })
          queryClient.invalidateQueries({
            queryKey: ["unread-notification-count"],
          })
          callbackRef.current?.(data as NotificationWSData)
        }
      } catch {
        // Ignore malformed messages
      }
    }

    ws.onclose = (event) => {
      if (event.code === 4001) {
        // Auth failure — try to refresh token, then reconnect once
        refreshAccessToken().then((ok) => {
          if (ok) {
            reconnectAttemptRef.current = 0
            reconnectTimer.current = setTimeout(connect, 1000)
          }
        })
        return
      }
      // Exponential backoff: 5s, 10s, 20s, 40s, max 60s
      const delay = Math.min(
        5000 * Math.pow(2, reconnectAttemptRef.current),
        60000,
      )
      reconnectAttemptRef.current += 1
      reconnectTimer.current = setTimeout(connect, delay)
    }

    ws.onerror = () => {
      ws.close()
    }
  }, [queryClient])

  useEffect(() => {
    connect()

    return () => {
      clearTimeout(reconnectTimer.current)
      if (wsRef.current) {
        wsRef.current.close()
        wsRef.current = null
      }
    }
  }, [connect])
}
