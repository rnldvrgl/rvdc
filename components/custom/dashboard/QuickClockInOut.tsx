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
  Loader2,
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
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
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
            <AlertDescription suppressHydrationWarning>
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
        <CardContent className="space-y-4 sm:space-y-6">
          <div className="text-center py-3 sm:py-4">
            <p
              className="text-2xl sm:text-3xl font-bold"
              suppressHydrationWarning
            >
              {formatTime(currentTime)}
            </p>
            <p
              className="text-xs sm:text-sm text-muted-foreground mt-1"
              suppressHydrationWarning
            >
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
              Clock in/out is available from 7:00 AM to 11:00 PM. Standard
              shift: 8:00 AM - 6:00 PM (flexibility may apply for full-day
              credit).
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
            <AlertDescription suppressHydrationWarning>
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
      <CardContent className="space-y-4 sm:space-y-6">
        <div className="text-center py-3 sm:py-4">
          <p
            className="text-2xl sm:text-3xl font-bold"
            suppressHydrationWarning
          >
            {formatTime(currentTime)}
          </p>
          <p
            className="text-xs sm:text-sm text-muted-foreground mt-1"
            suppressHydrationWarning
          >
            {currentTime.toLocaleDateString("en-US", {
              weekday: "long",
              month: "long",
              day: "numeric",
            })}
          </p>
        </div>
        {yesterdayAttendance?.auto_closed &&
          yesterdayAttendance.auto_close_warning_count > 0 && (
            <div className="flex items-center justify-center p-3 sm:p-4 rounded-lg bg-yellow-50 dark:bg-yellow-950/20 border-2 border-yellow-200 dark:border-yellow-800">
              <AutoCloseWarningBadge
                autoCloseWarningCount={
                  yesterdayAttendance.auto_close_warning_count
                }
                size="md"
              />
            </div>
          )}
        {/* Holiday Alert */}
        {todayHoliday && (
          <Alert variant="info">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Holiday</AlertTitle>
            <AlertDescription suppressHydrationWarning>
              Today is {todayHoliday.title}. Enjoy your day off!
            </AlertDescription>
          </Alert>
        )}

        {/* Half Day Leave Alert */}
        {isHalfDay && (
          <Alert variant="info">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription suppressHydrationWarning>
              You have {shiftPeriod === "AM" ? "morning" : "afternoon"} leave
              today.
            </AlertDescription>
          </Alert>
        )}

        <div className="space-y-3">
          {attendance ? (
            <div className="grid gap-3">
              {/* Clock Times */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="flex items-center gap-2 sm:gap-3 px-3 sm:px-4 py-2 sm:py-3 rounded-lg bg-muted/50">
                  <LogIn className="h-4 w-4 text-green-600 dark:text-green-400 shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-muted-foreground">Clock In</p>
                    <p className="text-sm font-medium">
                      {attendanceStatus?.attendance?.clock_in
                        ? formatTime(
                            new Date(attendanceStatus.attendance.clock_in),
                          )
                        : "—"}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 sm:gap-3 px-3 sm:px-4 py-2 sm:py-3 rounded-lg bg-muted/50">
                  <LogOut className="h-4 w-4 text-red-600 dark:text-red-400 shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-muted-foreground">Clock Out</p>
                    <p className="text-sm font-medium">
                      {attendanceStatus?.attendance?.clock_out
                        ? formatTime(
                            new Date(attendanceStatus.attendance.clock_out),
                          )
                        : "—"}
                    </p>
                  </div>
                </div>
              </div>

              {/* Total Hours */}
              {attendance.paid_hours && (
                <div className="flex items-center gap-2 sm:gap-3 px-3 sm:px-4 py-2 sm:py-3 rounded-lg bg-muted/50">
                  <Clock className="h-4 w-4 text-muted-foreground shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-muted-foreground">Paid Hours</p>
                    <p className="text-sm font-medium">
                      {attendance.paid_hours}h
                    </p>
                  </div>
                </div>
              )}
            </div>
          ) : null}
          {/* Late Status */}
          {attendanceStatus?.attendance?.is_late && (
            <div className="flex items-center gap-2 sm:gap-3 px-3 sm:px-4 py-2 sm:py-3 rounded-lg bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900">
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
              <div className="flex items-center gap-2 sm:gap-3 px-3 sm:px-4 py-2 sm:py-3 rounded-lg bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900">
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
            <Alert variant="success">
              <CheckCircle className="h-5 w-5 text-green-600 dark:text-green-400 shrink-0 mt-0.5" />
              <AlertTitle className="font-medium">
                Attendance Recorded
              </AlertTitle>
              <AlertDescription>
                Your attendance for today has been recorded successfully.
              </AlertDescription>
            </Alert>
          )}

          {/* Error Messages */}
          {clockIn.isError && (
            <Alert variant="destructive">
              <XCircle className="h-4 w-4" />
              <AlertTitle>Clock In Failed</AlertTitle>
              <AlertDescription>
                Please try again or contact support if the issue persists
              </AlertDescription>
            </Alert>
          )}

          {clockOut.isError && (
            <Alert variant="destructive">
              <XCircle className="h-4 w-4" />
              <AlertTitle>Clock Out Failed</AlertTitle>
              <AlertDescription>
                Please try again or contact support if the issue persists
              </AlertDescription>
            </Alert>
          )}
          {showActions && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Button
                onClick={handleClockIn}
                disabled={hasClockedIn || clockIn.isPending}
                className="h-10 sm:h-11"
                size="lg"
                variant="success"
              >
                {clockIn.isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <>
                    <LogIn className="mr-2 h-4 w-4" />
                    Clock In
                  </>
                )}
              </Button>
              <Button
                onClick={handleClockOut}
                disabled={!hasClockedIn || hasClockedOut || clockOut.isPending}
                variant="destructive"
                className="h-10 sm:h-11"
                size="lg"
              >
                {clockOut.isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <>
                    <LogOut className="mr-2 h-4 w-4" />
                    Clock Out
                  </>
                )}
              </Button>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
