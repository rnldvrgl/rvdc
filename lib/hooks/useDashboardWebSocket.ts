"use client"

import { getToken } from "@/lib/utils/tokens"
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
  [key: string]: unknown
}

type Options = {
  onEvent?: (data: DashboardWSData) => void
}

export function useDashboardWebSocket({ onEvent }: Options = {}) {
  const queryClient = useQueryClient()
  const wsRef = useRef<WebSocket | null>(null)
  const reconnectTimer = useRef<ReturnType<typeof setTimeout>>(undefined)
  const callbackRef = useRef(onEvent)
  callbackRef.current = onEvent

  const connect = useCallback(() => {
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:8000"
    const wsProtocol = baseUrl.startsWith("https") ? "wss" : "ws"
    const host = baseUrl.replace(/^https?:\/\//, "")
    const token = getToken("access")

    if (!token) return

    if (wsRef.current) {
      wsRef.current.close()
    }

    const ws = new WebSocket(
      `${wsProtocol}://${host}/ws/dashboard/?token=${token}`,
    )
    wsRef.current = ws

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

    ws.onclose = () => {
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
