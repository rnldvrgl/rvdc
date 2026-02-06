"use client"

import { useAttendanceMutations } from "@/lib/mutations/useAttendanceMutations"
import { useCurrentAttendanceStatus } from "@/lib/queries/useAttendance"
import { useEffect, useState } from "react"

export function useClockInOut() {
  const [currentTime, setCurrentTime] = useState(new Date())
  const { data: attendanceStatus, isLoading } = useCurrentAttendanceStatus()
  const { clockIn, clockOut } = useAttendanceMutations()

  // Update time every minute
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date())
    }, 60000)
    return () => clearInterval(timer)
  }, [])

  // Business hours: 8 AM to 10 PM with 1 hour allowance
  const BUSINESS_START_HOUR = 8
  const BUSINESS_END_HOUR = 22
  const ALLOWANCE_HOURS = 1

  const currentHour = currentTime.getHours()
  const isWithinBusinessHours =
    currentHour >= BUSINESS_START_HOUR - ALLOWANCE_HOURS &&
    currentHour < BUSINESS_END_HOUR + ALLOWANCE_HOURS

  const attendance = attendanceStatus?.attendance
  const hasClockedIn = !!attendance?.clock_in
  const hasClockedOut = !!attendance?.clock_out

  // Can only clock in/out if haven't completed attendance for the day
  const canClockInOutToday = !hasClockedOut

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  return {
    currentTime,
    attendanceStatus,
    attendance,
    isLoading,
    clockIn,
    clockOut,
    isWithinBusinessHours,
    hasClockedIn,
    hasClockedOut,
    canClockInOutToday,
    formatTime,
  }
}
