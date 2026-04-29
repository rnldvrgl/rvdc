"use client"

import usePendingActionsStore from "@/lib/store/usePendingActionsStore"
import { getValidAccessToken, refreshAccessToken } from "@/lib/utils/tokens"
import { QueryClient, useQueryClient } from "@tanstack/react-query"
import { useEffect, useRef } from "react"

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

export type ExportWSData = {
  event: "export_ready" | "export_failed"
  export_type: string
  title: string
  message: string
  token?: string
  filename?: string
  result?: {
    updated: number
    skipped: number
    errors: { row: number; sku?: string; error: string }[]
    detail: string
  }
}

type WSData = NotificationWSData | MaintenanceWSData | ExportWSData

type Options = {
  onNotification?: (data: NotificationWSData) => void
  onMaintenanceResult?: (data: MaintenanceWSData) => void
  onExportReady?: (data: ExportWSData) => void
}

type Listener = {
  queryClient: QueryClient
  onNotification?: (data: NotificationWSData) => void
  onMaintenanceResult?: (data: MaintenanceWSData) => void
  onExportReady?: (data: ExportWSData) => void
}

const listeners = new Set<Listener>()
let sharedSocket: WebSocket | null = null
let reconnectTimer: ReturnType<typeof setTimeout> | undefined
let reconnectAttempt = 0
let shouldReconnect = true

function hasListeners() {
  return listeners.size > 0
}

function clearReconnectTimer() {
  if (reconnectTimer) {
    clearTimeout(reconnectTimer)
    reconnectTimer = undefined
  }
}

function dispatchMessage(data: WSData) {
  for (const listener of listeners) {
    if (data.event === "maintenance_result") {
      listener.queryClient.invalidateQueries({ queryKey: ["server-maintenance"] })
      usePendingActionsStore.getState().clearByType("maintenance")
      listener.onMaintenanceResult?.(data)
      continue
    }

    if (data.event === "export_ready" || data.event === "export_failed") {
      listener.onExportReady?.(data)
      continue
    }

    listener.queryClient.invalidateQueries({ queryKey: ["notifications"] })
    listener.queryClient.invalidateQueries({ queryKey: ["unread-notification-count"] })
    listener.onNotification?.(data as NotificationWSData)
  }
}

async function connectSocket() {
  if (!hasListeners()) return
  if (
    sharedSocket &&
    (sharedSocket.readyState === WebSocket.OPEN ||
      sharedSocket.readyState === WebSocket.CONNECTING)
  ) {
    return
  }

  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:8000"
  const wsProtocol = baseUrl.startsWith("https") ? "wss" : "ws"
  const host = baseUrl.replace(/^https?:\/\//, "")
  const token = await getValidAccessToken()

  if (!token || !hasListeners()) return

  shouldReconnect = true
  clearReconnectTimer()

  const ws = new WebSocket(`${wsProtocol}://${host}/ws/notifications/?token=${token}`)
  sharedSocket = ws

  ws.onopen = () => {
    if (reconnectAttempt > 0) {
      usePendingActionsStore.getState().clearByType("maintenance")
    }
    reconnectAttempt = 0
  }

  ws.onmessage = (event) => {
    try {
      const data: WSData = JSON.parse(event.data)
      dispatchMessage(data)
    } catch {
      // Ignore malformed messages
    }
  }

  ws.onclose = (event) => {
    if (sharedSocket === ws) {
      sharedSocket = null
    }

    if (!shouldReconnect || !hasListeners()) {
      shouldReconnect = true
      reconnectAttempt = 0
      return
    }

    if (event.code === 4001) {
      refreshAccessToken().then((ok) => {
        if (ok && hasListeners()) {
          reconnectAttempt = 0
          reconnectTimer = setTimeout(connectSocket, 1000)
        }
      })
      return
    }

    const delay = Math.min(
      5000 * Math.pow(2, reconnectAttempt),
      60000,
    )
    reconnectAttempt += 1
    reconnectTimer = setTimeout(connectSocket, delay)
  }

  ws.onerror = () => {
    // Allow the close handler to decide whether to reconnect.
  }
}

function registerListener(listener: Listener) {
  listeners.add(listener)
  void connectSocket()

  return () => {
    listeners.delete(listener)
    if (!hasListeners()) {
      shouldReconnect = false
      clearReconnectTimer()
      if (sharedSocket) {
        sharedSocket.close()
        sharedSocket = null
      }
      reconnectAttempt = 0
      shouldReconnect = true
    }
  }
}

export function useNotificationWebSocket({
  onNotification,
  onMaintenanceResult,
  onExportReady,
}: Options = {}) {
  const queryClient = useQueryClient()
  const listenerRef = useRef<Listener>({
    queryClient,
    onNotification,
    onMaintenanceResult,
    onExportReady,
  })

  listenerRef.current.queryClient = queryClient
  listenerRef.current.onNotification = onNotification
  listenerRef.current.onMaintenanceResult = onMaintenanceResult
  listenerRef.current.onExportReady = onExportReady

  useEffect(() => {
    const unregister = registerListener(listenerRef.current)
    return unregister
  }, [queryClient])
}
