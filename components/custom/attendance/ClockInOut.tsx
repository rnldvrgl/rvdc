"use client"

import {
  AttendanceStatusBadge,
  AttendanceTypeBadge,
  AutoCloseWarningBadge,
} from "@/components/custom/attendance/AttendanceBadges"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"
import { useClockInOut } from "@/lib/hooks/useClockInOut"
import { useCurrentUser } from "@/lib/hooks/useCurrentUser"
import useCalendarEvents from "@/lib/queries/calendar/useCalendarEvents"
import {
  useDailyAttendance,
  useLeaveRequests,
} from "@/lib/queries/useAttendance"
import { usePayrollSettings } from "@/lib/queries/usePayroll"
import { canClockInOut, formatAttendanceTime } from "@/lib/utils/attendance"
import { formatDateToYMD, formatMinutesToHours } from "@/lib/utils/helpers"
import { formatDate } from "@/lib/utils/helpers/date"
import {
  AlertCircle,
  CheckCircle,
  Clock,
  FileText,
  Loader2,
  LogIn,
  LogOut,
  PhilippinePeso,
  User,
  XCircle,
} from "lucide-react"
import { useState } from "react"
type ClockInOutProps = {
  date?: string
  yesterdayAttendance: ReturnType<typeof useDailyAttendance>["data"]
  onSuccess?: () => void
}

export function ClockInOut({
  date,
  yesterdayAttendance,
  onSuccess,
}: ClockInOutProps) {
  const { user_id, role } = useCurrentUser()
  const [notes, setNotes] = useState("")
  const [showNotes, setShowNotes] = useState(false)

  // Get today's date first
  const today = date || formatDate(new Date(), "yyyy-MM-dd")
  const todayStr = formatDateToYMD(new Date(today))

  // Fetch payroll settings for half-day cutoff calculation
  const { data: settings } = usePayrollSettings()

  // Fetch calendar events for today
  const { data: events } = useCalendarEvents({
    start: todayStr,
    end: todayStr,
  })

  // Check if today is a holiday
  const todayHoliday = events?.find(
    (event) => event.extendedProps.type === "holiday",
  )

  const {
    currentTime,
    attendanceStatus: currentStatus,
    isLoading: statusLoading,
    clockIn,
    clockOut,
    canClockInNow,
    hasClockedIn: isClockedIn,
    hasClockedOut: isClockedOut,
    canClockInOutToday,
    isMarkedAbsent,
    isShopClosed,
  } = useClockInOut()

  const canClock = canClockInOut(role || "")

  // Check if user has approved leave for today
  const { data: todayLeave } = useLeaveRequests({
    filter: {
      employee_id: user_id,
      date: today,
      status: "APPROVED",
    },
  })

  const approvedLeave = todayLeave?.results?.[0]

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

  const handleClockIn = async () => {
    if (!user_id) return
    try {
      await clockIn.mutateAsync({
        employee_id: user_id,
        date: today,
        clock_in: new Date().toISOString(),
        notes,
      })
      setNotes("")
      setShowNotes(false)
      onSuccess?.()
    } catch {
      // Error is handled by useApiMutation
    }
  }

  const handleClockOut = async () => {
    if (!currentStatus?.attendance?.id) return
    try {
      await clockOut.mutateAsync({
        attendance_id: currentStatus.attendance.id,
        clock_out: new Date().toISOString(),
        notes,
      })
      setNotes("")
      setShowNotes(false)
      onSuccess?.()
    } catch {
      // Error is handled by useApiMutation
    }
  }

  // Check if today is shop closed
  const shopClosedEvent = events?.find(
    (event) => event.extendedProps.type === "shop_closed",
  )

  const isLoading = clockIn.isPending || clockOut.isPending

  // Determine if clock buttons should be disabled based on leave
  const getCurrentHour = () => {
    return currentTime.getHours()
  }

  const isClockDisabledByLeave = () => {
    if (!approvedLeave) return false

    // Full day leave - disable all day
    if (approvedLeave.shift_period === "FULL") {
      return true
    }

    // Half day morning (on leave AM) - disable after cutoff
    if (approvedLeave.shift_period === "AM") {
      return getCurrentHour() >= halfDayCutoff
    }

    // Half day afternoon (on leave PM) - disable before cutoff
    if (approvedLeave.shift_period === "PM") {
      return getCurrentHour() < halfDayCutoff
    }

    return false
  }

  const getLeaveMessage = () => {
    if (!approvedLeave) return null

    if (approvedLeave.shift_period === "FULL") {
      return `You are on ${approvedLeave.leave_type_display.toLowerCase()} today (Full Day). Clock in/out is not available.`
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

    if (approvedLeave.shift_period === "AM") {
      // On leave in the morning, works afternoon shift
      if (getCurrentHour() >= halfDayCutoff) {
        return `You are on ${approvedLeave.leave_type_display.toLowerCase()} (Half Day - Morning). You can clock in/out for your afternoon shift (${cutoffTime} - ${shiftEndTime}).`
      }
      return `You are on ${approvedLeave.leave_type_display.toLowerCase()} (Half Day - Morning). Your afternoon shift starts at ${cutoffTime}.`
    }

    if (approvedLeave.shift_period === "PM") {
      // On leave in the afternoon, works morning shift
      const shiftStartTime = settings?.shift_start
        ? settings.shift_start.slice(0, 5)
        : "8:00 AM"
      if (getCurrentHour() >= halfDayCutoff) {
        return `You are on ${approvedLeave.leave_type_display.toLowerCase()} (Half Day - Afternoon). Your morning shift has ended at ${cutoffTime}.`
      }
      return `You are on ${approvedLeave.leave_type_display.toLowerCase()} (Half Day - Afternoon). You can clock in/out for your morning shift (${shiftStartTime} - ${cutoffTime}).`
    }

    return null
  }

  const leaveMessage = getLeaveMessage()
  const clockDisabled = isClockDisabledByLeave()

  // Show actions only if can clock in/out today, not disabled by leave, not marked as absent, and not shop closed
  const showActions =
    canClockInOutToday && !clockDisabled && !isMarkedAbsent && !isShopClosed

  if (!canClock || !user_id) {
    return (
      <Card className="border-0 shadow-sm">
        <CardContent className="pt-6 text-center text-sm text-muted-foreground">
          Please log in to clock in/out
        </CardContent>
      </Card>
    )
  }

  if (statusLoading) {
    return (
      <Card className="border-0 shadow-sm">
        <CardContent className="flex items-center justify-center py-12">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    )
  }

  // Outside clock in window - only prevent if haven't clocked in yet
  if (!canClockInNow && !isClockedIn) {
    return (
      <Card className="border-0 shadow-sm">
        <CardContent className="space-y-4 sm:space-y-6">
          <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-3 items-center justify-between">
            <div className="flex flex-col sm:flex-row items-center gap-2 sm:gap-3">
              <div className="p-2 sm:p-2.5 rounded-xl bg-gray-100 dark:bg-gray-900">
                <Clock className="h-4 w-4 sm:h-5 sm:w-5 text-gray-600 dark:text-gray-400" />
              </div>
              <div className="text-center sm:text-left">
                <h3 className="font-semibold text-sm sm:text-base">
                  Attendance Clock
                </h3>
                <p
                  className="text-xs text-muted-foreground"
                  suppressHydrationWarning
                >
                  {formatDate(new Date(), "EEEE, MMMM dd, yyyy")}
                </p>
              </div>
            </div>
          </div>
          <div className="text-center py-3 sm:py-4">
            <p
              className="text-2xl sm:text-3xl font-bold"
              suppressHydrationWarning
            >
              {currentTime.toLocaleTimeString("en-US", {
                hour: "2-digit",
                minute: "2-digit",
              })}
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
              shift: 8:00 AM - 6:00 PM (
              {settings?.clock_in_allowance_minutes || 60}-minute early clock-in
              allowed, paid hours count from shift start).
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="border-0 shadow-sm">
      <CardContent className="space-y-4 sm:space-y-6">
        {/* Auto-Close Warning Badge */}
        {yesterdayAttendance?.auto_closed &&
          yesterdayAttendance.auto_close_warning_count > 0 && (
            <div className="flex items-center justify-center p-3 sm:p-4 rounded-lg bg-yellow-50 dark:bg-yellow-950/20 border-2 border-yellow-200 dark:border-yellow-800">
              <AutoCloseWarningBadge
                autoCloseWarningCount={
                  yesterdayAttendance.auto_close_warning_count
                }
                size="lg"
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

        {/* Shop Closed Alert */}
        {(shopClosedEvent || isShopClosed) && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Shop Closed</AlertTitle>
            <AlertDescription>
              The shop is closed today
              {shopClosedEvent?.extendedProps.reason &&
              shopClosedEvent.extendedProps.reason.toLowerCase() !==
                "shop closed"
                ? ` — ${shopClosedEvent.extendedProps.reason}`
                : ""}
              . Clock in/out is not available. For emergency services, contact
              your manager to override.
            </AlertDescription>
          </Alert>
        )}

        {/* Header */}
        <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-3 items-center justify-between">
          <div className="flex flex-col sm:flex-row items-center gap-2 sm:gap-3">
            <div
              className={`p-2 sm:p-2.5 rounded-xl ${isClockedOut ? "bg-green-100 dark:bg-green-950" : isClockedIn ? "bg-blue-100 dark:bg-blue-950" : "bg-gray-100 dark:bg-gray-900"}`}
            >
              <Clock
                className={`h-4 w-4 sm:h-5 sm:w-5 ${isClockedOut ? "text-green-600 dark:text-green-400" : isClockedIn ? "text-blue-600 dark:text-blue-400" : "text-gray-600 dark:text-gray-400"}`}
              />
            </div>
            <div className="text-center sm:text-left">
              <h3 className="font-semibold text-sm sm:text-base">
                Attendance Clock
              </h3>
              <p
                className="text-xs text-muted-foreground"
                suppressHydrationWarning
              >
                {formatDate(new Date(), "EEEE, MMMM dd, yyyy")}
              </p>
            </div>
          </div>
          <div className="flex flex-wrap gap-2 justify-center">
            <AttendanceStatusBadge
              status={
                !currentStatus?.attendance?.status
                  ? "NONE"
                  : currentStatus.attendance.status
              }
            />
            {currentStatus?.attendance?.attendance_type !== "PENDING" &&
              currentStatus?.attendance?.status !== "PENDING" && (
                <AttendanceTypeBadge
                  type={
                    !currentStatus?.attendance?.attendance_type
                      ? "INVALID"
                      : currentStatus.attendance.attendance_type
                  }
                />
              )}
          </div>
        </div>

        {/* Attendance Details */}
        {currentStatus?.attendance ? (
          <div className="space-y-3">
            <div className="grid gap-3">
              {/* Employee */}
              <div className="flex items-center gap-2 sm:gap-3 px-3 sm:px-4 py-2 sm:py-3 rounded-lg bg-muted/50">
                <User className="h-4 w-4 text-muted-foreground shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-muted-foreground">Employee</p>
                  <p className="text-sm font-medium truncate">
                    {currentStatus.attendance.employee_name}
                  </p>
                </div>
              </div>

              {/* Clock Times */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="flex items-center gap-2 sm:gap-3 px-3 sm:px-4 py-2 sm:py-3 rounded-lg bg-muted/50">
                  <LogIn className="h-4 w-4 text-green-600 dark:text-green-400 shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-muted-foreground">Clock In</p>
                    <p className="text-sm font-medium">
                      {currentStatus.attendance.clock_in
                        ? formatAttendanceTime(
                            currentStatus.attendance.clock_in,
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
                      {currentStatus.attendance.clock_out
                        ? formatAttendanceTime(
                            currentStatus.attendance.clock_out,
                          )
                        : "—"}
                    </p>
                  </div>
                </div>
              </div>

              {/* Late Status */}
              {currentStatus.attendance.is_late && (
                <div className="flex items-center gap-2 sm:gap-3 px-3 sm:px-4 py-2 sm:py-3 rounded-lg bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900">
                  <AlertCircle className="h-4 w-4 text-amber-600 dark:text-amber-400 shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-amber-600 dark:text-amber-400">
                      Late Status
                    </p>
                    <p className="text-sm font-medium text-amber-900 dark:text-amber-200">
                      Late by{" "}
                      {formatMinutesToHours(
                        currentStatus.attendance.late_minutes,
                      )}
                    </p>
                  </div>
                </div>
              )}

              {/* Paid Hours */}
              {currentStatus.attendance.paid_hours && (
                <div className="flex items-center gap-2 sm:gap-3 px-3 sm:px-4 py-2 sm:py-3 rounded-lg bg-muted/50">
                  <Clock className="h-4 w-4 text-muted-foreground shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-muted-foreground">Paid Hours</p>
                    <p className="text-sm font-medium">
                      {currentStatus.attendance.paid_hours} hrs
                    </p>
                  </div>
                </div>
              )}

              {/* Late Penalty */}
              {currentStatus.attendance.late_penalty_amount &&
                parseFloat(currentStatus.attendance.late_penalty_amount) >
                  0 && (
                  <div className="flex items-center gap-2 sm:gap-3 px-3 sm:px-4 py-2 sm:py-3 rounded-lg bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900">
                    <PhilippinePeso className="h-4 w-4 text-red-600 dark:text-red-400 shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-red-600 dark:text-red-400">
                        Late Penalty
                      </p>
                      <p className="text-sm font-medium text-red-900 dark:text-red-200">
                        {parseFloat(
                          currentStatus.attendance.late_penalty_amount,
                        ).toFixed(0)}
                      </p>
                    </div>
                  </div>
                )}

              {/* Notes */}
              {currentStatus.attendance.notes && (
                <div className="flex items-start gap-2 sm:gap-3 px-3 sm:px-4 py-2 sm:py-3 rounded-lg bg-muted/50">
                  <FileText className="h-4 w-4 text-muted-foreground shrink-0 mt-0.5" />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-muted-foreground mb-1">Notes</p>
                    <p className="text-sm">{currentStatus.attendance.notes}</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="text-center py-6 sm:py-8">
            <div className="inline-flex items-center justify-center w-12 h-12 sm:w-16 sm:h-16 rounded-full bg-muted mb-3">
              <Clock className="h-6 w-6 sm:h-8 sm:w-8 text-muted-foreground" />
            </div>
            <p className="text-sm text-muted-foreground">
              No attendance record for today
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              Click `Clock In` to start
            </p>
          </div>
        )}

        {/* Notes Input */}
        {(!isClockedOut || !currentStatus) && (
          <div className="space-y-2">
            {showNotes ? (
              <>
                <div className="flex items-center justify-between">
                  <label className="text-sm font-medium">
                    Notes (optional)
                  </label>
                  <Button
                    variant="link"
                    onClick={() => {
                      setShowNotes(false)
                      setNotes("")
                    }}
                    className="text-xs text-muted-foreground hover:text-foreground"
                  >
                    Cancel
                  </Button>
                </div>
                <Textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Add any notes about this clock in/out..."
                  disabled={isLoading}
                  rows={3}
                  className="text-sm"
                />
              </>
            ) : (
              <Button
                onClick={() => setShowNotes(true)}
                variant="link"
                className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                <FileText className="h-4 w-4" />
                Add notes
              </Button>
            )}
          </div>
        )}

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

        {/* Absent Message */}
        {isMarkedAbsent && (
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
            <Button
              onClick={handleClockIn}
              disabled={!!currentStatus?.attendance || isLoading}
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
              disabled={!isClockedIn || isLoading}
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

        {/* Completed Message */}
        {isClockedOut && (
          <Alert variant="success">
            <CheckCircle className="h-5 w-5 text-green-600 dark:text-green-400 shrink-0 mt-0.5" />
            <AlertTitle className="font-medium">Attendance Recorded</AlertTitle>
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
      </CardContent>
    </Card>
  )
}
