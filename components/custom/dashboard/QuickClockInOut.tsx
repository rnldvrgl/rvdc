"use client"

import { AutoCloseWarningBadge } from "@/components/custom/attendance/AttendanceBadges"
import RedirectRoute from "@/components/custom/navigation/RedirectRoute"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useClockInOut } from "@/lib/hooks/useClockInOut"
import { useCurrentUser } from "@/lib/hooks/useCurrentUser"
import { useCreateWorkRequest } from "@/lib/mutations/useWorkRequestMutations"
import { useCalendarEvents } from "@/lib/queries/calendar/useCalendarEvents"
import { useDailyAttendances } from "@/lib/queries/useAttendance"
import { usePayrollSettings } from "@/lib/queries/usePayroll"
import { useUserProfile } from "@/lib/queries/useUserProfile"
import { formatDateToYMD, formatMinutesToHours } from "@/lib/utils/helpers"
import { AnimatePresence, motion } from "framer-motion"
import {
  AlertCircle,
  CheckCircle,
  Clock,
  Hand,
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
  const { data: settings } = usePayrollSettings()

  const {
    currentTime,
    attendanceStatus,
    attendance,
    isLoading,
    clockIn,
    clockOut,
    canClockInNow,
    hasClockedIn,
    hasClockedOut,
    canClockInOutToday,
    formatTime,
    isMarkedAbsent,
    isShopClosed,
    workRequest,
    hasApprovedWorkRequest,
    hasPendingWorkRequest,
    hasDeclinedWorkRequest,
  } = useClockInOut()

  const createWorkRequest = useCreateWorkRequest()

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
    (event) =>
      event.extendedProps.type === "leave" &&
      event.extendedProps.employee_id === user_id,
  )

  const isHalfDay = todayLeave?.extendedProps.is_half_day
  const shiftPeriod = todayLeave?.extendedProps.shift_period

  // Calculate half-day cutoff time (midpoint between shift start and end)
  const getHalfDayCutoffHour = () => {
    if (!settings?.shift_start || !settings?.shift_end) return 13 // Default 1 PM

    const parseHour = (timeStr: string) => {
      const [hours] = timeStr.split(":")
      return parseInt(hours, 10)
    }

    const startHour = parseHour(settings.shift_start)
    const endHour = parseHour(settings.shift_end)
    return Math.floor((startHour + endHour) / 2)
  }

  const halfDayCutoff = getHalfDayCutoffHour()

  // For half day leave, check if it's their working period
  const canClockInHalfDay = () => {
    if (!isHalfDay) return true
    const currentHour = currentTime.getHours()
    if (shiftPeriod === "AM") {
      // Can work in PM (after cutoff)
      return currentHour >= halfDayCutoff
    } else if (shiftPeriod === "PM") {
      // Can work in AM (before cutoff)
      return currentHour < halfDayCutoff
    }
    return false
  }

  const getLeaveMessage = () => {
    if (!todayLeave) return null

    const leaveType =
      todayLeave.extendedProps?.leave_type_display?.toLowerCase() ?? "leave"

    if (!isHalfDay) {
      // Full day leave
      return `You are on ${leaveType} today (Full Day). Clock in/out is not available.`
    }

    const formatCutoffTime = (hour: number) => {
      return hour === 12
        ? "12:00 PM"
        : `${hour > 12 ? hour - 12 : hour}:00 ${hour >= 12 ? "PM" : "AM"}`
    }

    const shiftEndTime = settings?.shift_end
      ? settings.shift_end.slice(0, 5)
      : "6:00 PM"
    const cutoffTime = formatCutoffTime(halfDayCutoff)

    if (shiftPeriod === "AM") {
      // On leave in the morning, works afternoon shift
      const currentHour = currentTime.getHours()
      if (currentHour >= halfDayCutoff) {
        return `You are on ${leaveType} (Half Day - Morning). You can clock in/out for your afternoon shift (${cutoffTime} - ${shiftEndTime}).`
      }
      return `You are on ${leaveType} (Half Day - Morning). Your afternoon shift starts at ${cutoffTime}.`
    }

    if (shiftPeriod === "PM") {
      // On leave in the afternoon, works morning shift
      const shiftStartTime = settings?.shift_start
        ? settings.shift_start.slice(0, 5)
        : "8:00 AM"
      const currentHour = currentTime.getHours()
      if (currentHour >= halfDayCutoff) {
        return `You are on ${leaveType} (Half Day - Afternoon). Your morning shift has ended at ${cutoffTime}.`
      }
      return `You are on ${leaveType} (Half Day - Afternoon). You can clock in/out for your morning shift (${shiftStartTime} - ${cutoffTime}).`
    }

    return null
  }

  // Check if today is shop closed
  const shopClosedEvent = events?.find(
    (event) => event.extendedProps.type === "shop_closed",
  )

  const isClockDisabledByLeave =
    todayLeave && (!isHalfDay || !canClockInHalfDay())

  // Determine if actions should be shown
  const isShopClosedToday = isShopClosed || !!shopClosedEvent
  const showActions =
    canClockInOutToday &&
    !isClockDisabledByLeave &&
    (!isMarkedAbsent || hasApprovedWorkRequest) &&
    (!isShopClosedToday || hasApprovedWorkRequest)

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
  const leaveMessage = getLeaveMessage()

  if (isLoading) {
    return (
      <Card className="h-full">
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

  // Outside clock in window - only prevent if haven't clocked in yet
  if (!canClockInNow && !hasClockedIn) {
    return (
      <Card className="relative h-full">
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

  return (
    <Card className="relative h-full">
      <CardHeader>
        <CardTitle className="text-base flex items-center gap-2">
          <Clock className="size-5" />
          Clock In/Out
          <RedirectRoute href={timetableRoute} />
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4 sm:space-y-6">
        <div className="text-center py-3 sm:py-4">
          <motion.p
            className="text-2xl sm:text-3xl font-bold tabular-nums"
            suppressHydrationWarning
            key={formatTime(currentTime)}
            initial={{ opacity: 0.7, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.3 }}
          >
            {formatTime(currentTime)}
          </motion.p>
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
              Today is {todayHoliday.title}.
            </AlertDescription>
          </Alert>
        )}

        {/* Shop Closed */}
        {(shopClosedEvent || isShopClosed) && (
          <div
            className={`rounded-lg p-4 space-y-3 ${
              hasApprovedWorkRequest
                ? "border border-green-200 dark:border-green-900 bg-green-50/50 dark:bg-green-950/20"
                : hasPendingWorkRequest
                  ? "border border-amber-200 dark:border-amber-900 bg-amber-50/50 dark:bg-amber-950/20"
                  : hasDeclinedWorkRequest
                    ? "border border-red-200 dark:border-red-900 bg-red-50/50 dark:bg-red-950/20"
                    : "border border-border bg-muted/50"
            }`}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-sm font-medium">
                <AlertCircle
                  className={`h-4 w-4 ${
                    hasApprovedWorkRequest
                      ? "text-success"
                      : hasPendingWorkRequest
                        ? "text-warning"
                        : hasDeclinedWorkRequest
                          ? "text-destructive"
                          : "text-muted-foreground"
                  }`}
                />
                <span>Shop Closed</span>
              </div>
              {hasApprovedWorkRequest && (
                <Badge variant="success">
                  <CheckCircle className="h-3 w-3" />
                  Approved
                </Badge>
              )}
              {hasPendingWorkRequest && (
                <Badge variant="warning">
                  <Clock className="h-3 w-3" />
                  Pending
                </Badge>
              )}
              {hasDeclinedWorkRequest && (
                <Badge variant="destructive">
                  <XCircle className="h-3 w-3" />
                  Declined
                </Badge>
              )}
            </div>
            <p className="text-sm text-muted-foreground">
              {hasApprovedWorkRequest
                ? "Your work request has been approved. You can clock in/out."
                : hasPendingWorkRequest
                  ? "Your work request is pending admin approval."
                  : hasDeclinedWorkRequest
                    ? `Your work request has been declined.${workRequest?.decline_reason ? ` Reason: ${workRequest.decline_reason}` : ""}`
                    : `The shop is closed today${
                        shopClosedEvent?.extendedProps.reason &&
                        shopClosedEvent.extendedProps.reason.toLowerCase() !==
                          "shop closed"
                          ? ` \u2014 ${shopClosedEvent.extendedProps.reason}`
                          : ""
                      }.`}
            </p>
            {!hasApprovedWorkRequest &&
              !hasPendingWorkRequest &&
              !hasDeclinedWorkRequest && (
                <Button
                  size="sm"
                  className="w-full"
                  disabled={createWorkRequest.isPending}
                  onClick={() => {
                    createWorkRequest.mutate({ date: todayStr })
                  }}
                >
                  {createWorkRequest.isPending ? (
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  ) : (
                    <Hand className="h-4 w-4 mr-2" />
                  )}
                  Request to Work
                </Button>
              )}
          </div>
        )}

        <div className="space-y-3">
          <AnimatePresence mode="wait">
            {attendance && attendance.clock_in ? (
              <motion.div
                className="grid gap-3"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, ease: "easeOut" }}
              >
                {/* Clock Times */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="flex items-center gap-2 sm:gap-3 px-3 sm:px-4 py-2 sm:py-3 rounded-lg bg-muted/50">
                    <LogIn className="h-4 w-4 text-success shrink-0" />
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
                    <LogOut className="h-4 w-4 text-destructive shrink-0" />
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
                      <p className="text-xs text-muted-foreground">
                        Paid Hours
                      </p>
                      <p className="text-sm font-medium">
                        {attendance.paid_hours}h
                      </p>
                    </div>
                  </div>
                )}
              </motion.div>
            ) : null}
          </AnimatePresence>
          {/* Late Status */}
          {attendanceStatus?.attendance?.is_late && (
            <div className="flex items-center gap-2 sm:gap-3 px-3 sm:px-4 py-2 sm:py-3 rounded-lg bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900">
              <AlertCircle className="h-4 w-4 text-warning shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-xs text-warning">Late Status</p>
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
                <PhilippinePeso className="h-4 w-4 text-destructive shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-destructive">Late Penalty</p>
                  <p className="text-sm font-medium text-red-900 dark:text-red-200">
                    {parseFloat(
                      attendanceStatus.attendance.late_penalty_amount,
                    ).toFixed(0)}
                  </p>
                </div>
              </div>
            )}
          {/* Completed Message */}
          <AnimatePresence>
            {hasClockedOut && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 8 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                transition={{ duration: 0.4, ease: [0.25, 0.46, 0.45, 0.94] }}
              >
                <Alert variant="success">
                  <CheckCircle className="h-5 w-5 text-success shrink-0 mt-0.5" />
                  <AlertTitle className="font-medium">
                    Attendance Recorded
                  </AlertTitle>
                  <AlertDescription>
                    Your attendance for today has been recorded successfully.
                  </AlertDescription>
                </Alert>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Leave Message */}
          {leaveMessage && (
            <Alert variant="info">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>On Leave</AlertTitle>
              <AlertDescription suppressHydrationWarning>
                {leaveMessage}
              </AlertDescription>
            </Alert>
          )}

          {/* Absent Message - only show when NOT shop closed day */}
          {isMarkedAbsent && !isShopClosedToday && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Marked as Absent</AlertTitle>
              <AlertDescription>
                You have been marked as absent for today. Clock in/out is not
                available. Please contact your supervisor if you believe this is
                an error.
              </AlertDescription>
            </Alert>
          )}

          {/* Action Buttons */}
          {showActions && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <motion.div whileTap={{ scale: 0.97 }}>
                <Button
                  onClick={handleClockIn}
                  disabled={hasClockedIn || clockIn.isPending}
                  className="h-10 sm:h-11 w-full"
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
              </motion.div>
              <motion.div whileTap={{ scale: 0.97 }}>
                <Button
                  onClick={handleClockOut}
                  disabled={
                    !hasClockedIn || hasClockedOut || clockOut.isPending
                  }
                  variant="destructive"
                  className="h-10 sm:h-11 w-full"
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
              </motion.div>
            </div>
          )}

          {/* Error Messages */}
          <AnimatePresence>
            {clockIn.isError && (
              <motion.div
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 8 }}
                transition={{ duration: 0.3 }}
              >
                <Alert variant="destructive">
                  <XCircle className="h-4 w-4" />
                  <AlertTitle>Clock In Failed</AlertTitle>
                  <AlertDescription>
                    Please try again or contact support if the issue persists
                  </AlertDescription>
                </Alert>
              </motion.div>
            )}
          </AnimatePresence>

          <AnimatePresence>
            {clockOut.isError && (
              <motion.div
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 8 }}
                transition={{ duration: 0.3 }}
              >
                <Alert variant="destructive">
                  <XCircle className="h-4 w-4" />
                  <AlertTitle>Clock Out Failed</AlertTitle>
                  <AlertDescription>
                    Please try again or contact support if the issue persists
                  </AlertDescription>
                </Alert>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </CardContent>
    </Card>
  )
}
