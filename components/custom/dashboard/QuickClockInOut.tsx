"use client"

import { AutoCloseWarningBadge } from "@/components/custom/attendance/AttendanceBadges"
import RedirectRoute from "@/components/custom/navigation/RedirectRoute"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useClockInOut } from "@/lib/hooks/useClockInOut"
import { useCurrentUser } from "@/lib/hooks/useCurrentUser"
import { useCalendarEvents } from "@/lib/queries/calendar/useCalendarEvents"
import { useDailyAttendances } from "@/lib/queries/useAttendance"
import { useUserProfile } from "@/lib/queries/useUserProfile"
import { formatDateToYMD, formatMinutesToHours } from "@/lib/utils/helpers"
import {
  AlertCircle,
  CheckCircle,
  Clock,
  LogIn,
  LogOut,
  PhilippinePeso,
  XCircle,
} from "lucide-react"

export function QuickClockInOut() {
  const { user_id } = useCurrentUser()
  const timetableRoute = "/attendance/timetable"
  const { data: profile } = useUserProfile()
  const { data: attendanceData } = useDailyAttendances({
    filter: { employee_id: user_id },
  })

  const {
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
  } = useClockInOut()

  const yesterdayAttendance = attendanceData?.results[1] || null

  const today = new Date()
  const todayStr = formatDateToYMD(today)
  const { data: events } = useCalendarEvents({
    start: todayStr,
    end: todayStr,
  })

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

  // Determine if actions should be shown
  const showActions =
    canClockInOutToday && (!todayLeave || (isHalfDay && canClockInHalfDay()))

  const handleClockIn = () => {
    if (!profile?.id) return
    const now = new Date()
    clockIn.mutate({
      employee_id: profile.id,
      date: formatDateToYMD(now),
      clock_in: now.toISOString(),
    })
  }

  const handleClockOut = () => {
    if (attendance?.id) {
      const now = new Date()
      clockOut.mutate({
        attendance_id: attendance.id,
        clock_out: now.toISOString(),
      })
    }
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
          <Alert variant="info">
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
          <Alert variant="info">
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
          <Alert variant="info">
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
        {yesterdayAttendance?.auto_closed &&
          yesterdayAttendance.auto_close_warning_count > 0 && (
            <div className="flex items-center justify-center p-4 rounded-lg bg-yellow-50 dark:bg-yellow-950/20 border-2 border-yellow-200 dark:border-yellow-800">
              <AutoCloseWarningBadge
                autoCloseWarningCount={
                  yesterdayAttendance.auto_close_warning_count
                }
                size="md"
              />
            </div>
          )}
        {todayHoliday && (
          <Alert variant="info">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Today is {todayHoliday.title} (Holiday). Work today is voluntary
              and will be compensated accordingly.
            </AlertDescription>
          </Alert>
        )}

        {isHalfDay && (
          <Alert variant="info">
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
                  <span className="font-medium">
                    {" "}
                    {attendanceStatus?.attendance?.clock_in
                      ? formatTime(
                          new Date(attendanceStatus.attendance.clock_in),
                        )
                      : "—"}
                  </span>
                </div>
              )}
              {attendance.clock_out && (
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Clocked Out:</span>
                  <span className="font-medium">
                    {" "}
                    {attendanceStatus?.attendance?.clock_out
                      ? formatTime(
                          new Date(attendanceStatus.attendance.clock_out),
                        )
                      : "—"}
                  </span>
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
          {/* Late Status */}
          {attendanceStatus?.attendance?.is_late && (
            <div className="flex items-center gap-3 px-4 py-3 rounded-lg bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900">
              <AlertCircle className="h-4 w-4 text-amber-600 dark:text-amber-400 shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-xs text-amber-600 dark:text-amber-400">
                  Late Status
                </p>
                <p className="text-sm font-medium text-amber-900 dark:text-amber-200">
                  Late by{" "}
                  {formatMinutesToHours(
                    attendanceStatus.attendance.late_minutes,
                  )}
                </p>
              </div>
            </div>
          )}
          {/* Late Penalty */}
          {attendanceStatus?.attendance?.late_penalty_amount &&
            parseFloat(attendanceStatus.attendance.late_penalty_amount) > 0 && (
              <div className="flex items-center gap-3 px-4 py-3 rounded-lg bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900">
                <PhilippinePeso className="h-4 w-4 text-red-600 dark:text-red-400 shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-red-600 dark:text-red-400">
                    Late Penalty
                  </p>
                  <p className="text-sm font-medium text-red-900 dark:text-red-200">
                    {parseFloat(
                      attendanceStatus.attendance.late_penalty_amount,
                    ).toFixed(0)}
                  </p>
                </div>
              </div>
            )}
          {/* Completed Message */}
          {hasClockedOut && (
            <Alert
              variant="success"
              className="col-span-full"
            >
              <CheckCircle className="h-4 w-4" />
              <AlertTitle>Attendance Recorded</AlertTitle>
              <AlertDescription>
                Your attendance for today has been recorded successfully.
              </AlertDescription>
            </Alert>
          )}

          {/* Error Messages */}
          {clockIn.isError && (
            <Alert
              variant="destructive"
              className="col-span-full"
            >
              <XCircle className="h-4 w-4" />
              <AlertTitle>Clock In Failed</AlertTitle>
              <AlertDescription>
                Please try again or contact support if the issue persists
              </AlertDescription>
            </Alert>
          )}

          {clockOut.isError && (
            <Alert
              variant="destructive"
              className="col-span-full"
            >
              <XCircle className="h-4 w-4" />
              <AlertTitle>Clock Out Failed</AlertTitle>
              <AlertDescription>
                Please try again or contact support if the issue persists
              </AlertDescription>
            </Alert>
          )}
          {showActions && (
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
          )}
        </div>
      </CardContent>
    </Card>
  )
}
