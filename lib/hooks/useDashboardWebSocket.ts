"use client"

import { getValidAccessToken, refreshAccessToken } from "@/lib/utils/tokens"
import { useQueryClient } from "@tanstack/react-query"
import { useCallback, useEffect, useRef } from "react"

type DashboardWSData = {
  event:
    | "service_created"
    | "service_updated"
    | "service_payment_created"
    | "sales_transaction_created"
    | "sales_transaction_updated"
    | "sales_payment_created"
    | "stock_updated"
    | "stockroom_updated"
    | "stock_request_created"
    | "stock_request_updated"
    | "jo_template_printed"
  [key: string]: unknown
}

type Options = {
  onEvent?: (data: DashboardWSData) => void
}

const MAX_RETRY_BEFORE_COOLDOWN = 3
const RETRY_COOLDOWN_MS = 120000

export function useDashboardWebSocket({ onEvent }: Options = {}) {
  const queryClient = useQueryClient()
  const wsRef = useRef<WebSocket | null>(null)
  const reconnectTimer = useRef<ReturnType<typeof setTimeout>>(undefined)
  const reconnectAttemptRef = useRef(0)
  const reconnectPauseUntilRef = useRef(0)
  const callbackRef = useRef(onEvent)
  callbackRef.current = onEvent

  const scheduleReconnect = useCallback((delayMs: number) => {
    clearTimeout(reconnectTimer.current)
    reconnectTimer.current = setTimeout(connect, delayMs)
  }, [])

  const canAttemptConnection = useCallback(() => {
    if (typeof window === "undefined") return false
    if (!navigator.onLine) return false
    if (document.visibilityState === "hidden") return false
    return Date.now() >= reconnectPauseUntilRef.current
  }, [])

  const connect = useCallback(async () => {
    if (!canAttemptConnection()) {
      const retryIn = Math.max(
        5000,
        reconnectPauseUntilRef.current - Date.now(),
      )
      scheduleReconnect(retryIn)
      return
    }

    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:8000"
    const wsProtocol = baseUrl.startsWith("https") ? "wss" : "ws"
    const host = baseUrl.replace(/^https?:\/\//, "")
    const token = await getValidAccessToken()

    if (!token) {
      scheduleReconnect(5000)
      return
    }

    if (wsRef.current) {
      wsRef.current.close()
    }

    const ws = new WebSocket(
      `${wsProtocol}://${host}/ws/dashboard/?token=${token}`,
    )
    wsRef.current = ws

    ws.onopen = () => {
      reconnectAttemptRef.current = 0
      reconnectPauseUntilRef.current = 0
    }

    ws.onmessage = (event) => {
      try {
        const data: DashboardWSData = JSON.parse(event.data)
        const e = data.event

        // --- Service events ---
        if (
          e === "service_created" ||
          e === "service_updated" ||
          e === "service_payment_created"
        ) {
          queryClient.invalidateQueries({ queryKey: ["services"] })
          queryClient.invalidateQueries({ queryKey: ["pending-items-stats"] })
          queryClient.invalidateQueries({ queryKey: ["service-filters"] })
        }

        // --- Sales events ---
        if (
          e === "sales_transaction_created" ||
          e === "sales_transaction_updated" ||
          e === "sales_payment_created"
        ) {
          queryClient.invalidateQueries({
            queryKey: ["sales-transactions"],
          })
          queryClient.invalidateQueries({
            queryKey: ["sales-transaction-filters"],
          })
        }

        // --- Inventory events ---
        if (e === "stock_updated") {
          queryClient.invalidateQueries({ queryKey: ["stall-stocks"] })
          queryClient.invalidateQueries({
            queryKey: ["stall-stock-status-counts"],
          })
          queryClient.invalidateQueries({ queryKey: ["stock-filters"] })
        }

        if (e === "stockroom_updated") {
          queryClient.invalidateQueries({ queryKey: ["stock-room-stocks"] })
          queryClient.invalidateQueries({
            queryKey: ["stockroom-stock-status-counts"],
          })
          queryClient.invalidateQueries({ queryKey: ["stock-room-filters"] })
        }

        if (e === "stock_request_created" || e === "stock_request_updated") {
          queryClient.invalidateQueries({ queryKey: ["stock-requests"] })
        }

        // --- Job Order Template events ---
        if (e === "jo_template_printed") {
          queryClient.invalidateQueries({ queryKey: ["jo-template-prints"] })
          queryClient.invalidateQueries({ queryKey: ["jo-next-number"] })
        }

        // Sales and stock changes affect dashboard analytics
        if (
          e === "sales_transaction_created" ||
          e === "sales_payment_created" ||
          e === "stock_updated" ||
          e === "stockroom_updated" ||
          e === "service_payment_created"
        ) {
          queryClient.invalidateQueries({ queryKey: ["analytics"] })
        }

        callbackRef.current?.(data)
      } catch {
        // Ignore malformed messages
      }
    }

    ws.onclose = (event) => {
      if (event.code === 4001) {
        refreshAccessToken().then((ok) => {
          if (ok) {
            reconnectAttemptRef.current = 0
            reconnectPauseUntilRef.current = 0
            scheduleReconnect(1000)
          }
        })
        return
      }

      if (!canAttemptConnection()) {
        scheduleReconnect(5000)
        return
      }

      const delay = Math.min(
        5000 * Math.pow(2, reconnectAttemptRef.current),
        60000,
      )
      reconnectAttemptRef.current += 1

      if (reconnectAttemptRef.current >= MAX_RETRY_BEFORE_COOLDOWN) {
        reconnectPauseUntilRef.current = Date.now() + RETRY_COOLDOWN_MS
        scheduleReconnect(RETRY_COOLDOWN_MS)
        return
      }

      scheduleReconnect(delay)
    }

    ws.onerror = () => {
      ws.close()
    }
  }, [canAttemptConnection, queryClient, scheduleReconnect])

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
