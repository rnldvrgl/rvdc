"use client"

import { useAttendanceWebSocket } from "@/lib/hooks/useAttendanceWebSocket"

export default function AttendanceLayout({
  children,
}: {
  children: React.ReactNode
}) {
  useAttendanceWebSocket()

  return <>{children}</>
}
