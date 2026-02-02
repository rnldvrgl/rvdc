"use client"

import RedirectRoute from "@/components/custom/navigation/RedirectRoute"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useAttendanceMutations } from "@/lib/mutations/useAttendanceMutations"
import { useCalendarEvents } from "@/lib/queries/calendar/useCalendarEvents"
import { useCurrentAttendanceStatus } from "@/lib/queries/useAttendance"
import { useUserProfile } from "@/lib/queries/useUserProfile"
import { AlertCircle, Clock, LogIn, LogOut } from "lucide-react"
import { useEffect, useState } from "react"

export function QuickClockInOut() {
  const timetableRoute = "/attendance/timetable"
  const [currentTime, setCurrentTime] = useState(new Date())
  const { data: attendanceStatus, isLoading } = useCurrentAttendanceStatus()
  const attendance = attendanceStatus?.attendance
  const { data: profile } = useUserProfile()
  const { clockIn, clockOut } = useAttendanceMutations()

  const today = new Date()
  const { data: events } = useCalendarEvents({
    start: today.toISOString().split("T")[0],
    end: today.toISOString().split("T")[0],
  })

  // Update time every minute
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date())
    }, 60000)
    return () => clearInterval(timer)
  }, [])

  // Business hours: 8 AM to 5 PM
  const BUSINESS_START_HOUR = 8
  const BUSINESS_END_HOUR = 17

  const ALLOWANCE_HOURS = 1

  const currentHour = currentTime.getHours()
  const isWithinBusinessHours =
    currentHour >= BUSINESS_START_HOUR - ALLOWANCE_HOURS &&
    currentHour < BUSINESS_END_HOUR + ALLOWANCE_HOURS

  // Check if today is a holiday
  const todayHoliday = events?.find(
    (event) => event.extendedProps.type === "holiday",
  )

  // Check if user has leave today
  const todayLeave = events?.find(
    (event) => event.extendedProps.type === "leave",
  )

  const isHalfDay = todayLeave?.extendedProps.is_half_day
  const shiftPeriod = todayLeave?.extendedProps.shift_period

  // For half day leave, check if it's their working period
  const canClockInHalfDay = () => {
    if (!isHalfDay) return true
    const currentHour = currentTime.getHours()
    if (shiftPeriod === "AM") {
      // Can work in PM (after 12 PM)
      return currentHour >= 12
    } else if (shiftPeriod === "PM") {
      // Can work in AM (before 12 PM)
      return currentHour < 12
    }
    return false
  }

  const handleClockIn = () => {
    if (!profile?.id) return
    const now = new Date()
    clockIn.mutate({
      employee_id: profile.id,
      date: now.toISOString().split("T")[0],
      clock_in: now.toTimeString().split(" ")[0], // HH:MM:SS format
    })
  }

  const handleClockOut = () => {
    if (attendance?.id) {
      const now = new Date()
      clockOut.mutate({
        attendance_id: attendance.id,
        clock_out: now.toTimeString().split(" ")[0], // HH:MM:SS format
      })
    }
  }

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Clock className="size-5" />
            Clock In/Out
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-4">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary" />
          </div>
        </CardContent>
      </Card>
    )
  }

  // Full day leave - no attendance allowed
  if (todayLeave && !isHalfDay) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Clock className="size-5" />
            Clock In/Out
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              You are on {todayLeave.extendedProps.leave_type_display} leave
              today. Attendance is not required.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    )
  }

  // Outside business hours
  if (!isWithinBusinessHours) {
    return (
      <Card className="relative">
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Clock className="size-5" />
            Clock In/Out
            <RedirectRoute href={timetableRoute} />
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="text-center">
            <p className="text-3xl font-bold">{formatTime(currentTime)}</p>
            <p className="text-sm text-muted-foreground mt-1">
              {currentTime.toLocaleDateString("en-US", {
                weekday: "long",
                month: "long",
                day: "numeric",
              })}
            </p>
          </div>
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Clock in/out is not yet available. You can clock in/out from 7:00
              AM to 6:00 PM.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    )
  }

  // Half day leave - check if in working period
  if (isHalfDay && !canClockInHalfDay()) {
    return (
      <Card className="relative">
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Clock className="size-5" />
            Clock In/Out
            <RedirectRoute href={timetableRoute} />
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              You have {shiftPeriod === "AM" ? "morning" : "afternoon"} leave
              today. Clock in will be available during your working hours (
              {shiftPeriod === "AM" ? "after 12:00 PM" : "before 12:00 PM"}).
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    )
  }

  const hasClockedIn = !!attendance?.clock_in
  const hasClockedOut = !!attendance?.clock_out

  return (
    <Card>
      <CardHeader className="relative">
        <CardTitle className="text-base flex items-center gap-2">
          <Clock className="size-5" />
          Clock In/Out
          <RedirectRoute href={timetableRoute} />
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="text-center">
          <p className="text-3xl font-bold">{formatTime(currentTime)}</p>
          <p className="text-sm text-muted-foreground mt-1">
            {currentTime.toLocaleDateString("en-US", {
              weekday: "long",
              month: "long",
              day: "numeric",
            })}
          </p>
        </div>

        {todayHoliday && (
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Today is {todayHoliday.title} (Holiday). Work today is voluntary
              and will be compensated accordingly.
            </AlertDescription>
          </Alert>
        )}

        {isHalfDay && (
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              You have {shiftPeriod === "AM" ? "morning" : "afternoon"} leave
              today.
            </AlertDescription>
          </Alert>
        )}

        <div className="space-y-3">
          {attendance && (
            <div className="p-3 rounded-lg border bg-muted/50 space-y-2">
              {attendance.clock_in && (
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Clocked In:</span>
                  <span className="font-medium">{attendance.clock_in}</span>
                </div>
              )}
              {attendance.clock_out && (
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Clocked Out:</span>
                  <span className="font-medium">{attendance.clock_out}</span>
                </div>
              )}
              {attendance.total_hours && (
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Total Hours:</span>
                  <span className="font-medium">{attendance.total_hours}h</span>
                </div>
              )}
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <Button
              onClick={handleClockIn}
              disabled={hasClockedIn || clockIn.isPending}
              className="w-full"
              size="lg"
            >
              <LogIn className="size-4 mr-2" />
              {clockIn.isPending ? "Clocking In..." : "Clock In"}
            </Button>
            <Button
              onClick={handleClockOut}
              disabled={!hasClockedIn || hasClockedOut || clockOut.isPending}
              variant="outline"
              className="w-full"
              size="lg"
            >
              <LogOut className="size-4 mr-2" />
              {clockOut.isPending ? "Clocking Out..." : "Clock Out"}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
