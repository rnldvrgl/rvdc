"use client"

import { getValidAccessToken, refreshAccessToken } from "@/lib/utils/tokens"
import { useQueryClient } from "@tanstack/react-query"
import { useCallback, useEffect, useRef } from "react"

type AttendanceWSData = {
  event:
    | "clock_in"
    | "clock_out"
    | "attendance_approved"
    | "attendance_rejected"
    | "leave_request_created"
    | "leave_request_approved"
    | "leave_request_rejected"
    | "leave_request_cancelled"
    | "overtime_request_created"
    | "overtime_request_approved"
    | "work_request_created"
    | "work_request_approved"
    | "work_request_declined"
  employee_id: number
  [key: string]: unknown
}

type Options = {
  onEvent?: (data: AttendanceWSData) => void
}

export function useAttendanceWebSocket({ onEvent }: Options = {}) {
  const queryClient = useQueryClient()
  const wsRef = useRef<WebSocket | null>(null)
  const reconnectTimer = useRef<ReturnType<typeof setTimeout>>(undefined)
  const reconnectAttemptRef = useRef(0)
  const callbackRef = useRef(onEvent)
  callbackRef.current = onEvent

  const connect = useCallback(async () => {
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:8000"
    const wsProtocol = baseUrl.startsWith("https") ? "wss" : "ws"
    const host = baseUrl.replace(/^https?:\/\//, "")
    const token = await getValidAccessToken()

    if (!token) return

    if (wsRef.current) {
      wsRef.current.close()
    }

    const ws = new WebSocket(
      `${wsProtocol}://${host}/ws/attendance/?token=${token}`,
    )
    wsRef.current = ws

    ws.onopen = () => {
      reconnectAttemptRef.current = 0
    }

    ws.onmessage = (event) => {
      try {
        const data: AttendanceWSData = JSON.parse(event.data)

        // Invalidate relevant query caches based on event type
        const e = data.event

        if (
          e === "clock_in" ||
          e === "clock_out" ||
          e === "attendance_approved" ||
          e === "attendance_rejected"
        ) {
          queryClient.invalidateQueries({ queryKey: ["daily-attendances"] })
          queryClient.invalidateQueries({
            queryKey: ["pending-attendance-approvals"],
          })
          queryClient.invalidateQueries({
            queryKey: ["current-attendance-status"],
          })
        }

        if (
          e === "leave_request_created" ||
          e === "leave_request_approved" ||
          e === "leave_request_rejected" ||
          e === "leave_request_cancelled"
        ) {
          queryClient.invalidateQueries({ queryKey: ["leave-requests"] })
          queryClient.invalidateQueries({
            queryKey: ["pending-leave-approvals"],
          })
          queryClient.invalidateQueries({ queryKey: ["leave-balances"] })
          queryClient.invalidateQueries({ queryKey: ["my-leave-balance"] })
        }

        if (
          e === "overtime_request_created" ||
          e === "overtime_request_approved"
        ) {
          queryClient.invalidateQueries({
            queryKey: ["attendance", "overtime-requests"],
          })
        }

        if (
          e === "work_request_created" ||
          e === "work_request_approved" ||
          e === "work_request_declined"
        ) {
          queryClient.invalidateQueries({
            queryKey: ["attendance", "work-requests"],
          })
          queryClient.invalidateQueries({
            queryKey: ["current-attendance-status"],
          })
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
            reconnectTimer.current = setTimeout(connect, 1000)
          }
        })
        return
      }
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
