"use client"

import { AttendanceStatusBadge } from "@/components/custom/attendance/AttendanceBadges"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"
import { useCurrentUser } from "@/lib/hooks/useCurrentUser"
import { useAttendanceMutations } from "@/lib/mutations/useAttendanceMutations"
import { useCurrentAttendanceStatus } from "@/lib/queries/useAttendance"
import { canClockInOut, formatTime } from "@/lib/utils/attendance"
import { formatMinutesToHours } from "@/lib/utils/helpers"
import { formatDate } from "@/lib/utils/helpers/date"
import { formatInTimeZone } from "date-fns-tz"
import {
  AlertCircle,
  Calendar,
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
  onSuccess?: () => void
}

export function ClockInOut({ date, onSuccess }: ClockInOutProps) {
  const { user_id, role } = useCurrentUser()
  const [notes, setNotes] = useState("")
  const [showNotes, setShowNotes] = useState(false)

  const today =
    date || formatInTimeZone(new Date(), "Asia/Manila", "yyyy-MM-dd")
  const canClock = canClockInOut(role || "")

  const { data: currentStatus, isLoading: statusLoading } =
    useCurrentAttendanceStatus()
  const { clockIn, clockOut } = useAttendanceMutations()

  const handleClockIn = async () => {
    if (!user_id) return
    await clockIn.mutateAsync(
      {
        employee_id: user_id,
        date: today,
        clock_in: new Date().toISOString(),
        notes,
      },
      {
        onSuccess: () => {
          setNotes("")
          setShowNotes(false)
          onSuccess?.()
        },
      },
    )
  }

  const handleClockOut = async () => {
    if (!currentStatus?.id) return
    await clockOut.mutateAsync(
      {
        attendance_id: currentStatus.id,
        clock_out: new Date().toISOString(),
        notes,
      },
      {
        onSuccess: () => {
          setNotes("")
          setShowNotes(false)
          onSuccess?.()
        },
      },
    )
  }

  const isLoading = clockIn.isPending || clockOut.isPending
  const isClockedIn = currentStatus && !currentStatus.clock_out
  const isClockedOut = currentStatus && currentStatus.clock_out

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

  return (
    <Card className="border-0 shadow-sm">
      <CardContent className="p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div
              className={`p-2.5 rounded-xl ${isClockedOut ? "bg-green-100 dark:bg-green-950" : isClockedIn ? "bg-blue-100 dark:bg-blue-950" : "bg-gray-100 dark:bg-gray-900"}`}
            >
              <Clock
                className={`h-5 w-5 ${isClockedOut ? "text-green-600 dark:text-green-400" : isClockedIn ? "text-blue-600 dark:text-blue-400" : "text-gray-600 dark:text-gray-400"}`}
              />
            </div>
            <div>
              <h3 className="font-semibold">Attendance Clock</h3>
              <p className="text-xs text-muted-foreground">
                {formatDate(new Date(), "EEEE, MMMM dd, yyyy")}
              </p>
            </div>
          </div>
          <AttendanceStatusBadge
            status={!currentStatus?.status ? "NONE" : currentStatus.status}
          />
        </div>

        {/* Attendance Details */}
        {currentStatus ? (
          <div className="space-y-3">
            <div className="grid gap-3">
              {/* Date */}
              <div className="flex items-center gap-3 px-4 py-3 rounded-lg bg-muted/50">
                <Calendar className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-muted-foreground">Date</p>
                  <p className="text-sm font-medium truncate">
                    {formatDate(new Date(currentStatus.date), "EEEE, dd MMMM")}
                  </p>
                </div>
              </div>

              {/* Employee */}
              <div className="flex items-center gap-3 px-4 py-3 rounded-lg bg-muted/50">
                <User className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-muted-foreground">Employee</p>
                  <p className="text-sm font-medium truncate">
                    {currentStatus.employee_name}
                  </p>
                </div>
              </div>

              {/* Clock Times */}
              <div className="grid grid-cols-2 gap-3">
                <div className="flex items-center gap-3 px-4 py-3 rounded-lg bg-muted/50">
                  <LogIn className="h-4 w-4 text-green-600 dark:text-green-400 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-muted-foreground">Clock In</p>
                    <p className="text-sm font-medium">
                      {formatTime(currentStatus.clock_in)}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3 px-4 py-3 rounded-lg bg-muted/50">
                  <LogOut className="h-4 w-4 text-red-600 dark:text-red-400 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-muted-foreground">Clock Out</p>
                    <p className="text-sm font-medium">
                      {currentStatus.clock_out
                        ? formatTime(currentStatus.clock_out)
                        : "—"}
                    </p>
                  </div>
                </div>
              </div>

              {/* Late Status */}
              {currentStatus.is_late && (
                <div className="flex items-center gap-3 px-4 py-3 rounded-lg bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900">
                  <AlertCircle className="h-4 w-4 text-amber-600 dark:text-amber-400 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-amber-600 dark:text-amber-400">
                      Late Status
                    </p>
                    <p className="text-sm font-medium text-amber-900 dark:text-amber-200">
                      Late by {formatMinutesToHours(currentStatus.late_minutes)}
                    </p>
                  </div>
                </div>
              )}

              {/* Paid Hours */}
              {currentStatus.paid_hours && (
                <div className="flex items-center gap-3 px-4 py-3 rounded-lg bg-muted/50">
                  <Clock className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-muted-foreground">Paid Hours</p>
                    <p className="text-sm font-medium">
                      {currentStatus.paid_hours}
                    </p>
                  </div>
                </div>
              )}

              {/* Late Penalty */}
              {currentStatus.late_penalty_amount &&
                parseFloat(currentStatus.late_penalty_amount) > 0 && (
                  <div className="flex items-center gap-3 px-4 py-3 rounded-lg bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900">
                    <PhilippinePeso className="h-4 w-4 text-red-600 dark:text-red-400 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-red-600 dark:text-red-400">
                        Late Penalty
                      </p>
                      <p className="text-sm font-medium text-red-900 dark:text-red-200">
                        {parseFloat(currentStatus.late_penalty_amount).toFixed(
                          0,
                        )}
                      </p>
                    </div>
                  </div>
                )}

              {/* Notes */}
              {currentStatus.notes && (
                <div className="flex items-start gap-3 px-4 py-3 rounded-lg bg-muted/50">
                  <FileText className="h-4 w-4 text-muted-foreground flex-shrink-0 mt-0.5" />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-muted-foreground mb-1">Notes</p>
                    <p className="text-sm">{currentStatus.notes}</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="text-center py-8">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-muted mb-3">
              <Clock className="h-8 w-8 text-muted-foreground" />
            </div>
            <p className="text-sm text-muted-foreground">
              No attendance record for today
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              Click "Clock In" to start
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
                  <button
                    onClick={() => {
                      setShowNotes(false)
                      setNotes("")
                    }}
                    className="text-xs text-muted-foreground hover:text-foreground"
                  >
                    Cancel
                  </button>
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
              <button
                onClick={() => setShowNotes(true)}
                className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                <FileText className="h-4 w-4" />
                Add notes
              </button>
            )}
          </div>
        )}

        {/* Action Buttons */}
        {!isClockedOut && (
          <div className="grid grid-cols-2 gap-3">
            <Button
              onClick={handleClockIn}
              disabled={!!currentStatus || isLoading}
              className="h-11"
              size="lg"
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
              variant="secondary"
              className="h-11"
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
          <div className="flex items-start gap-3 px-4 py-3 rounded-lg bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-900">
            <CheckCircle className="h-5 w-5 text-green-600 dark:text-green-400 flex-shrink-0 mt-0.5" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-green-900 dark:text-green-200">
                Attendance Recorded
              </p>
              <p className="text-xs text-green-700 dark:text-green-300 mt-0.5">
                Your attendance for today has been recorded successfully
              </p>
            </div>
          </div>
        )}

        {/* Error Messages */}
        {clockIn.isError && (
          <div className="flex items-start gap-3 px-4 py-3 rounded-lg bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900">
            <XCircle className="h-5 w-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-red-900 dark:text-red-200">
                Clock In Failed
              </p>
              <p className="text-xs text-red-700 dark:text-red-300 mt-0.5">
                Please try again or contact support if the issue persists
              </p>
            </div>
          </div>
        )}

        {clockOut.isError && (
          <div className="flex items-start gap-3 px-4 py-3 rounded-lg bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900">
            <XCircle className="h-5 w-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-red-900 dark:text-red-200">
                Clock Out Failed
              </p>
              <p className="text-xs text-red-700 dark:text-red-300 mt-0.5">
                Please try again or contact support if the issue persists
              </p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
