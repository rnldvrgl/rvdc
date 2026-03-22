"use client"

import { getToken } from "@/lib/utils/tokens"
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

type Options = {
  onNotification?: (data: NotificationWSData) => void
}

export function useNotificationWebSocket({ onNotification }: Options = {}) {
  const queryClient = useQueryClient()
  const wsRef = useRef<WebSocket | null>(null)
  const reconnectTimer = useRef<ReturnType<typeof setTimeout>>(undefined)
  const callbackRef = useRef(onNotification)
  callbackRef.current = onNotification

  const connect = useCallback(() => {
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:8000"
    const wsProtocol = baseUrl.startsWith("https") ? "wss" : "ws"
    const host = baseUrl.replace(/^https?:\/\//, "")
    const token = getToken("access")

    if (!token) return

    // Clean up existing connection
    if (wsRef.current) {
      wsRef.current.close()
    }

    const ws = new WebSocket(
      `${wsProtocol}://${host}/ws/notifications/?token=${token}`,
    )
    wsRef.current = ws

    ws.onmessage = (event) => {
      try {
        const data: NotificationWSData = JSON.parse(event.data)

        // Invalidate notification queries so UI updates instantly
        queryClient.invalidateQueries({ queryKey: ["notifications"] })
        queryClient.invalidateQueries({
          queryKey: ["unread-notification-count"],
        })

        callbackRef.current?.(data)
      } catch {
        // Ignore malformed messages
      }
    }

    ws.onclose = () => {
      // Reconnect after 5 seconds
      reconnectTimer.current = setTimeout(connect, 5000)
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
