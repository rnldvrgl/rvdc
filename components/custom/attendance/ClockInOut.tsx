"use client"

import {
    AttendanceStatusBadge,
    AttendanceTypeBadge,
    AutoCloseWarningBadge,
} from "@/components/custom/attendance/AttendanceBadges"
import { AttendanceMetricRow } from "@/components/custom/attendance/AttendanceMetricRow"
import { ClockActionButtons } from "@/components/custom/attendance/ClockActionButtons"
import { ClockFace } from "@/components/custom/attendance/ClockFace"
import { ShopClosedNotice } from "@/components/custom/attendance/ShopClosedNotice"
import RedirectRoute from "@/components/custom/navigation/RedirectRoute"
import { AnimatedNumber } from "@/components/custom/shared/AnimatedNumber"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"
import { useClockInOut } from "@/lib/hooks/useClockInOut"
import { useCurrentUser } from "@/lib/hooks/useCurrentUser"
import { useLeaveGate, type NormalizedLeave } from "@/lib/hooks/useLeaveGate"
import { useCreateWorkRequest } from "@/lib/mutations/useWorkRequestMutations"
import useCalendarEvents from "@/lib/queries/calendar/useCalendarEvents"
import { useDailyAttendance, useDailyAttendances } from "@/lib/queries/useAttendance"
import { usePayrollSettings } from "@/lib/queries/usePayroll"
import { canClockInOut, formatAttendanceTime } from "@/lib/utils/attendance"
import { formatDateToYMD, formatMinutesToHours, tint } from "@/lib/utils/helpers"
import { formatDate } from "@/lib/utils/helpers/date"
import { AnimatePresence, motion } from "framer-motion"
import {
    AlertCircle,
    CheckCircle,
    Clock,
    FileText,
    Loader2,
    PhilippinePeso,
    User,
    XCircle,
} from "lucide-react"
import type { ReactNode } from "react"
import { useState } from "react"

function StatusStrip({ items }: { items: { label: string; value: ReactNode }[] }) {
    return (
        <div className="flex items-stretch rounded-lg border divide-x divide-border">
            {items.map((item) => (
                <div key={item.label} className="flex-1 px-3 py-2 text-center min-w-0">
                    <p className="text-[11px] text-muted-foreground truncate">{item.label}</p>
                    <p className="text-sm font-medium mt-0.5 truncate">{item.value}</p>
                </div>
            ))}
        </div>
    )
}

type ClockInOutProps = {
    /** "full" = attendance page card with all detail rows & notes.
     *  "compact" = small dashboard widget with header, redirect link, and a status strip. */
    variant?: "full" | "compact"
    date?: string
    /** Optional — if omitted (compact/dashboard usage), the component self-fetches recent attendance. */
    yesterdayAttendance?: ReturnType<typeof useDailyAttendance>["data"]
    onSuccess?: () => void
}

function ClockCardShell({
    isCompact,
    children,
}: {
    isCompact: boolean
    children: ReactNode
}) {
    return (
        <Card className={isCompact ? "relative h-full" : "border-0 shadow-sm"}>
            {isCompact && (
                <CardHeader>
                    <CardTitle className="text-base flex items-center gap-2">
                        <Clock className="size-4 text-primary" />
                        Clock In/Out
                        <RedirectRoute href="/attendance/timetable" />
                    </CardTitle>
                </CardHeader>
            )}
            <CardContent className="space-y-4 sm:space-y-6">{children}</CardContent>
        </Card>
    )
}
export function ClockInOut({
    variant = "full",
    date,
    yesterdayAttendance: yesterdayAttendanceProp,
    onSuccess,
}: ClockInOutProps) {
    const isCompact = variant === "compact"
    const { user_id, role } = useCurrentUser()
    const [notes, setNotes] = useState("")
    const [showNotes, setShowNotes] = useState(false)

    const today = date || formatDate(new Date(), "yyyy-MM-dd")
    const todayStr = formatDateToYMD(new Date(today))

    const { data: settings } = usePayrollSettings()
    const { data: events } = useCalendarEvents({ start: todayStr, end: todayStr })

    // Compact (dashboard) variant has no parent query to share, so it fetches
    // its own recent attendance to derive "yesterday". Full variant (attendance
    // page) receives it as a prop from the page's shared query.
    const { data: selfFetchedAttendances } = useDailyAttendances(
        { filter: { employee_id: user_id } },
    )
    const yesterdayAttendance =
        yesterdayAttendanceProp ?? selfFetchedAttendances?.results?.[1] ?? null

    const todayHoliday = events?.find((event) => event.extendedProps.type === "holiday")

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
        formatTime,
        isMarkedAbsent,
        isShopClosed,
        hasApprovedWorkRequest,
        hasPendingWorkRequest,
        hasDeclinedWorkRequest,
        workRequest,
    } = useClockInOut()

    const createWorkRequest = useCreateWorkRequest()
    const canClock = canClockInOut(role || "")
    const attendance = currentStatus?.attendance

    // Leave detection from the calendar events already fetched above (both
    // variants need events for holiday/shop-closed checks anyway).
    const todayLeaveEvent = events?.find(
        (event) =>
            event.extendedProps.type === "leave" &&
            event.extendedProps.employee_id === user_id,
    )

    const normalizedLeave: NormalizedLeave = todayLeaveEvent
        ? {
            typeLabel: todayLeaveEvent.extendedProps?.leave_type_display ?? "leave",
            shiftPeriod: todayLeaveEvent.extendedProps.is_half_day
                ? (todayLeaveEvent.extendedProps.shift_period as "AM" | "PM")
                : "FULL",
        }
        : null

    const { isDisabled: clockDisabled, message: leaveMessage } = useLeaveGate(
        normalizedLeave,
        settings,
        currentTime?.getHours() ?? 0,
    )

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
        if (!attendance?.id) return
        try {
            await clockOut.mutateAsync({
                attendance_id: attendance.id,
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

    const shopClosedEvent = events?.find((event) => event.extendedProps.type === "shop_closed")
    const isMutating = clockIn.isPending || clockOut.isPending
    const isShopClosedToday = isShopClosed || !!shopClosedEvent
    const showActions =
        canClockInOutToday &&
        !clockDisabled &&
        (!isMarkedAbsent || hasApprovedWorkRequest) &&
        (!isShopClosedToday || hasApprovedWorkRequest)

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
            <Card className={isCompact ? "h-full" : "border-0 shadow-sm"}>
                {isCompact && (
                    <CardHeader>
                        <CardTitle className="text-base flex items-center gap-2">
                            <Clock className="size-4 text-primary" />
                            Clock In/Out
                        </CardTitle>
                    </CardHeader>
                )}
                <CardContent className="flex items-center justify-center py-12">
                    <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                </CardContent>
            </Card>
        )
    }

    // Status-tinted avatar: at-a-glance state instead of reading the badge text.
    const statusToneVar = isClockedOut ? "--success" : isClockedIn ? "--info" : null
    const StatusAvatar = (
        <div
            className="p-2 sm:p-2.5 rounded-xl"
            style={{ backgroundColor: statusToneVar ? tint(statusToneVar, 12) : "var(--muted)" }}
        >
            <Clock
                className="h-4 w-4 sm:h-5 sm:w-5"
                style={{ color: statusToneVar ? `var(${statusToneVar})` : "var(--muted-foreground)" }}
            />
        </div>
    )

    const outsideWindow = !canClockInNow && !isClockedIn

    if (outsideWindow) {
        return (
            <ClockCardShell isCompact={isCompact}>
                {!isCompact && (
                    <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-3 items-center justify-between">
                        <div className="flex flex-col sm:flex-row items-center gap-2 sm:gap-3">
                            {StatusAvatar}
                            <div className="text-center sm:text-left">
                                <h3 className="font-semibold text-sm sm:text-base">Attendance Clock</h3>
                                <p className="text-xs text-muted-foreground" suppressHydrationWarning>
                                    {formatDate(new Date(), "EEEE, MMMM dd, yyyy")}
                                </p>
                            </div>
                        </div>
                    </div>
                )}
                <ClockFace time={currentTime} size="lg" className={isCompact ? "py-2" : undefined} />
                <Alert>
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>
                        Clock in/out is available from 7:00 AM to 11:00 PM. Standard
                        shift: 8:00 AM - 6:00 PM ({settings?.clock_in_allowance_minutes || 60}-minute
                        early clock-in allowed, paid hours count from shift start).
                    </AlertDescription>
                </Alert>
            </ClockCardShell>
        )
    }

    return (
        <ClockCardShell isCompact={isCompact}>
            {yesterdayAttendance?.auto_closed && yesterdayAttendance.auto_close_warning_count > 0 && (
                <div className="flex items-center justify-center p-3 sm:p-4 rounded-lg bg-yellow-50 dark:bg-yellow-950/20 border-2 border-yellow-200 dark:border-yellow-800">
                    <AutoCloseWarningBadge
                        autoCloseWarningCount={yesterdayAttendance.auto_close_warning_count}
                        size={isCompact ? "md" : "lg"}
                    />
                </div>
            )}

            {todayHoliday && (
                <Alert variant="info">
                    <AlertCircle className="h-4 w-4" />
                    <AlertTitle>Holiday</AlertTitle>
                    <AlertDescription suppressHydrationWarning>
                        Today is {todayHoliday.title}
                        {!isCompact ? ". Enjoy your day off!" : "."}
                    </AlertDescription>
                </Alert>
            )}

            {(shopClosedEvent || isShopClosed) && (
                <ShopClosedNotice
                    reason={shopClosedEvent?.extendedProps.reason}
                    state={{
                        hasApprovedWorkRequest,
                        hasPendingWorkRequest,
                        hasDeclinedWorkRequest,
                        declineReason: workRequest?.decline_reason,
                    }}
                    isRequesting={createWorkRequest.isPending}
                    onRequestWork={() => createWorkRequest.mutate({ date: today })}
                />
            )}

            {!isCompact && (
                <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-3 items-center justify-between">
                    <div className="flex flex-col sm:flex-row items-center gap-2 sm:gap-3">
                        {StatusAvatar}
                        <div className="text-center sm:text-left">
                            <h3 className="font-semibold text-sm sm:text-base">Attendance Clock</h3>
                            <p className="text-xs text-muted-foreground" suppressHydrationWarning>
                                {formatDate(new Date(), "EEEE, MMMM dd, yyyy")}
                            </p>
                        </div>
                    </div>
                    <div className="flex flex-wrap gap-2 justify-center">
                        <AttendanceStatusBadge status={!attendance?.status ? "NONE" : attendance.status} />
                        {attendance?.attendance_type !== "PENDING" && attendance?.status !== "PENDING" && (
                            <AttendanceTypeBadge
                                type={!attendance?.attendance_type ? "INVALID" : attendance.attendance_type}
                            />
                        )}
                    </div>
                </div>
            )}

            <ClockFace time={currentTime} size="lg" className={isCompact ? "py-2" : undefined} />

            {isCompact ? (
                <AnimatePresence mode="wait">
                    {attendance && attendance.clock_in && (
                        <motion.div
                            initial={{ opacity: 0, y: 8 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.4, ease: "easeOut" }}
                        >
                            <StatusStrip
                                items={[
                                    {
                                        label: "Clock In",
                                        value: attendance.clock_in ? formatTime(new Date(attendance.clock_in)) : "—",
                                    },
                                    {
                                        label: "Clock Out",
                                        value: attendance.clock_out ? formatTime(new Date(attendance.clock_out)) : "—",
                                    },
                                    {
                                        label: "Paid Hours",
                                        value: attendance.paid_hours ? `${attendance.paid_hours}h` : "—",
                                    },
                                ]}
                            />
                        </motion.div>
                    )}
                </AnimatePresence>
            ) : attendance ? (
                <div className="grid gap-3">
                    <AttendanceMetricRow icon={User} label="Employee" value={attendance.employee_name} />

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <AttendanceMetricRow
                            icon={Clock}
                            label="Clock In"
                            value={attendance.clock_in ? formatAttendanceTime(attendance.clock_in) : "—"}
                        />
                        <AttendanceMetricRow
                            icon={Clock}
                            label="Clock Out"
                            value={attendance.clock_out ? formatAttendanceTime(attendance.clock_out) : "—"}
                        />
                    </div>

                    {attendance.is_late && (
                        <AttendanceMetricRow
                            icon={AlertCircle}
                            label="Late Status"
                            tone="warning"
                            value={`Late by ${formatMinutesToHours(attendance.late_minutes)}`}
                        />
                    )}

                    {attendance.paid_hours && (
                        <AttendanceMetricRow
                            icon={Clock}
                            label="Paid Hours"
                            value={
                                <>
                                    <AnimatedNumber
                                        value={Number(attendance.paid_hours)}
                                        className="font-mono tabular-nums"
                                        format={{ maximumFractionDigits: 1, minimumFractionDigits: 1 }}
                                    />{" "}
                                    hrs
                                </>
                            }
                        />
                    )}

                    {attendance.late_penalty_amount && parseFloat(attendance.late_penalty_amount) > 0 && (
                        <AttendanceMetricRow
                            icon={PhilippinePeso}
                            label="Late Penalty"
                            tone="destructive"
                            value={
                                <AnimatedNumber
                                    value={parseFloat(attendance.late_penalty_amount)}
                                    className="font-mono tabular-nums"
                                    format={{
                                        style: "currency",
                                        currency: "PHP",
                                        minimumFractionDigits: 0,
                                        maximumFractionDigits: 0,
                                    }}
                                />
                            }
                        />
                    )}

                    {attendance.notes && (
                        <AttendanceMetricRow icon={FileText} label="Notes" wrap value={attendance.notes} />
                    )}
                </div>
            ) : (
                <div className="text-center py-6 sm:py-8">
                    <div className="inline-flex items-center justify-center w-12 h-12 sm:w-16 sm:h-16 rounded-full bg-muted mb-3">
                        <Clock className="h-6 w-6 sm:h-8 sm:w-8 text-muted-foreground" />
                    </div>
                    <p className="text-sm text-muted-foreground">No attendance record for today</p>
                    <p className="text-xs text-muted-foreground mt-1">Click `Clock In` to start</p>
                </div>
            )}

            {isCompact && attendance?.is_late && (
                <AttendanceMetricRow
                    icon={AlertCircle}
                    label="Late Status"
                    tone="warning"
                    value={`Late by ${formatMinutesToHours(attendance.late_minutes)}`}
                />
            )}

            {isCompact && attendance?.late_penalty_amount && parseFloat(attendance.late_penalty_amount) > 0 && (
                <AttendanceMetricRow
                    icon={PhilippinePeso}
                    label="Late Penalty"
                    tone="destructive"
                    value={parseFloat(attendance.late_penalty_amount).toFixed(0)}
                />
            )}

            {!isCompact && (!isClockedOut || !currentStatus) && (
                <div className="space-y-2">
                    {showNotes ? (
                        <>
                            <div className="flex items-center justify-between">
                                <label className="text-sm font-medium">Notes (optional)</label>
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
                                disabled={isMutating}
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

            {leaveMessage && (
                <Alert variant="info">
                    <AlertCircle className="h-4 w-4" />
                    <AlertTitle>On Leave</AlertTitle>
                    <AlertDescription suppressHydrationWarning>{leaveMessage}</AlertDescription>
                </Alert>
            )}

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

            {showActions && (
                <ClockActionButtons
                    onClockIn={handleClockIn}
                    onClockOut={handleClockOut}
                    clockInDisabled={isCompact ? isClockedIn : !!attendance}
                    clockOutDisabled={isCompact ? !isClockedIn || isClockedOut : !isClockedIn}
                    isClockingIn={clockIn.isPending}
                    isClockingOut={clockOut.isPending}
                />
            )}

            {isClockedOut && (
                isCompact ? (
                    <AnimatePresence>
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: 8 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            transition={{ duration: 0.4, ease: [0.25, 0.46, 0.45, 0.94] }}
                        >
                            <Alert variant="success">
                                <CheckCircle className="h-5 w-5 text-success shrink-0 mt-0.5" />
                                <AlertTitle className="font-medium">Attendance Recorded</AlertTitle>
                                <AlertDescription>
                                    Your attendance for today has been recorded successfully.
                                </AlertDescription>
                            </Alert>
                        </motion.div>
                    </AnimatePresence>
                ) : (
                    <Alert variant="success">
                        <CheckCircle className="h-5 w-5 text-success shrink-0 mt-0.5" />
                        <AlertTitle className="font-medium">Attendance Recorded</AlertTitle>
                        <AlertDescription>
                            Your attendance for today has been recorded successfully.
                        </AlertDescription>
                    </Alert>
                )
            )}

            {clockIn.isError && (
                isCompact ? (
                    <AnimatePresence>
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
                    </AnimatePresence>
                ) : (
                    <Alert variant="destructive">
                        <XCircle className="h-4 w-4" />
                        <AlertTitle>Clock In Failed</AlertTitle>
                        <AlertDescription>
                            Please try again or contact support if the issue persists
                        </AlertDescription>
                    </Alert>
                )
            )}

            {clockOut.isError && (
                isCompact ? (
                    <AnimatePresence>
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
                    </AnimatePresence>
                ) : (
                    <Alert variant="destructive">
                        <XCircle className="h-4 w-4" />
                        <AlertTitle>Clock Out Failed</AlertTitle>
                        <AlertDescription>
                            Please try again or contact support if the issue persists
                        </AlertDescription>
                    </Alert>
                )
            )}
        </ClockCardShell>
    )
}
