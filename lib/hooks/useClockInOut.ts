"use client"

import { useAttendanceMutations } from "@/lib/mutations/useAttendanceMutations"
import { useCurrentAttendanceStatus } from "@/lib/queries/useAttendance"
import { usePayrollSettings } from "@/lib/queries/usePayroll"
import { useEffect, useState } from "react"

export function useClockInOut() {
  const [currentTime, setCurrentTime] = useState(new Date())
  const { data: attendanceStatus, isLoading } = useCurrentAttendanceStatus()
  const { data: settings } = usePayrollSettings()
  const { clockIn, clockOut } = useAttendanceMutations()

  // Update time every minute
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date())
    }, 60000)
    return () => clearInterval(timer)
  }, [])

  // Get shift times from settings or use defaults
  const getHourFromTime = (timeStr?: string): number => {
    if (!timeStr) return 0
    const [hours] = timeStr.split(":")
    return parseInt(hours, 10)
  }
  const isMarkedAbsent =
    attendanceStatus?.attendance?.attendance_type === "ABSENT"
  const BUSINESS_START_HOUR = settings?.shift_start
    ? getHourFromTime(settings.shift_start)
    : 8
  const BUSINESS_END_HOUR = settings?.shift_end
    ? getHourFromTime(settings.shift_end)
    : 18

  // Clock-in allowance from settings (minutes before shift_start)
  // Converts to hours for window calculation
  const CLOCK_IN_ALLOWANCE_HOURS = settings?.clock_in_allowance_minutes
    ? Math.floor(settings.clock_in_allowance_minutes / 60)
    : 1

  // Additional tolerance for late clock out (e.g., travel time after work)
  // This allows employees to clock out several hours after business hours end
  const LATE_CLOCK_OUT_TOLERANCE_HOURS = 5

  const currentHour = currentTime.getHours()

  // Clock in window: from (shift_start - allowance) until shift_end
  // Example: 7 AM - 6 PM with 60-min allowance
  const canClockInNow =
    currentHour >= BUSINESS_START_HOUR - CLOCK_IN_ALLOWANCE_HOURS &&
    currentHour < BUSINESS_END_HOUR

  // Clock out window: from (shift_start - allowance) until late evening
  // Example: 7 AM - 11 PM
  const canClockOutNow =
    currentHour >= BUSINESS_START_HOUR - CLOCK_IN_ALLOWANCE_HOURS &&
    currentHour <= BUSINESS_END_HOUR + LATE_CLOCK_OUT_TOLERANCE_HOURS

  // For backward compatibility, isWithinBusinessHours checks clock out window
  const isWithinBusinessHours = canClockOutNow

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
    canClockInNow,
    canClockOutNow,
    hasClockedIn,
    hasClockedOut,
    canClockInOutToday,
    formatTime,
    isMarkedAbsent,
  }
}
