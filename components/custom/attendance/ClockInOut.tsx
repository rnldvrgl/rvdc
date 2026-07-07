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
import { EmptyState } from "@/components/custom/EmptyState"
import { ErrorState } from "@/components/custom/ErrorState"
import RedirectRoute from "@/components/custom/navigation/RedirectRoute"
import { AnimatedNumber } from "@/components/custom/shared/AnimatedNumber"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { Textarea } from "@/components/ui/textarea"
import { useClockInOut } from "@/lib/hooks/useClockInOut"
import { useCurrentUser } from "@/lib/hooks/useCurrentUser"
import { useLeaveGate, type NormalizedLeave } from "@/lib/hooks/useLeaveGate"
import { useCreateWorkRequest } from "@/lib/mutations/useWorkRequestMutations"
import useCalendarEvents from "@/lib/queries/calendar/useCalendarEvents"
import { useDailyAttendance, useDailyAttendances } from "@/lib/queries/useAttendance"
import { usePayrollSettings } from "@/lib/queries/usePayroll"
import { canClockInOut, formatAttendanceTime } from "@/lib/utils/attendance"
import { cn, formatDateToYMD, formatMinutesToHours, tint } from "@/lib/utils/helpers"
import { formatDate } from "@/lib/utils/helpers/date"
import { AnimatePresence, motion } from "framer-motion"
import {
    AlertCircle,
    CheckCircle,
    Clock,
    FileText,
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
                <div key={item.label} className="flex-1 px-3 py-2.5 text-center min-w-0">
                    <p className="text-[11px] text-muted-foreground truncate">{item.label}</p>
                    <p className="text-sm font-medium mt-0.5 truncate font-mono">{item.value}</p>
                </div>
            ))}
        </div>
    )
}

// Skeleton twin of StatusStrip — same 3-column bordered/divided shape.
function StatusStripSkeleton() {
    return (
        <div className="flex items-stretch rounded-lg border divide-x divide-border">
            {[0, 1, 2].map((i) => (
                <div key={i} className="flex-1 px-3 py-2.5 flex flex-col items-center gap-1.5">
                    <Skeleton className="h-2.5 w-10" />
                    <Skeleton className="h-3.5 w-14" />
                </div>
            ))}
        </div>
    )
}

// Skeleton twin of a bordered AttendanceMetricRow (icon + label/value stack).
function MetricRowSkeleton({ className }: { className?: string }) {
    return (
        <div className={cn("flex items-center gap-3 rounded-lg border p-3", className)}>
            <Skeleton className="h-8 w-8 rounded-md shrink-0" />
            <div className="space-y-1.5 flex-1">
                <Skeleton className="h-2.5 w-16" />
                <Skeleton className="h-3.5 w-24" />
            </div>
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
    statusAvatar,
    children,
}: {
    isCompact: boolean
    statusAvatar: ReactNode
    children: ReactNode
}) {
    return (
        <Card className={isCompact ? "relative h-full" : "border-0 shadow-sm"}>
            <CardHeader className={isCompact ? undefined : "pb-0"}>
                <CardTitle className="text-base flex items-center gap-2.5">
                    {isCompact ? (
                        <Clock className="size-4 text-primary" />
                    ) : (
                        statusAvatar
                    )}
                    Clock In/Out
                    {isCompact && <RedirectRoute href="/attendance/timetable" />}
                </CardTitle>
            </CardHeader>
            <CardContent className="space-y-5">{children}</CardContent>
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
            <Card className="grid place-content-center p-0">
                <CardContent>
                    <ErrorState
                        title="Access Denied"
                        description="You do not have permission to clock in/out. Please contact your administrator if you believe this is an error."
                        withoutAction
                    />
                </CardContent>
            </Card>
        )
    }

    if (statusLoading) {
        return (
            <ClockCardShell isCompact={isCompact} statusAvatar={<Skeleton className="h-7 w-7 rounded-lg" />}>
                <div className="flex justify-center gap-2">
                    <Skeleton className="h-5 w-20 rounded-full" />
                    <Skeleton className="h-5 w-16 rounded-full" />
                </div>

                <div className="flex flex-col items-center gap-2 py-1">
                    <Skeleton className="h-9 sm:h-10 w-[168px] sm:w-[192px]" />
                    <Skeleton className="h-4 w-40" />
                </div>

                {isCompact ? (
                    <StatusStripSkeleton />
                ) : (
                    <div className="grid gap-3">
                        <MetricRowSkeleton />
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            <MetricRowSkeleton />
                            <MetricRowSkeleton />
                        </div>
                    </div>
                )}

                <Skeleton className="h-16 sm:h-17 w-full rounded-xl" />
            </ClockCardShell>
        )
    }

    // Status-tinted avatar: at-a-glance state instead of reading the badge text.
    const statusToneVar = isClockedOut ? "--success" : isClockedIn ? "--info" : null
    const StatusAvatar = (
        <div
            className="p-1.5 rounded-lg shrink-0"
            style={{ backgroundColor: statusToneVar ? tint(statusToneVar, 12) : "var(--muted)" }}
        >
            <Clock
                className="h-4 w-4"
                style={{ color: statusToneVar ? `var(${statusToneVar})` : "var(--muted-foreground)" }}
            />
        </div>
    )

    const outsideWindow = !canClockInNow && !isClockedIn

    if (outsideWindow) {
        return (
            <ClockCardShell isCompact={isCompact} statusAvatar={StatusAvatar}>
                <ClockFace time={currentTime} size="lg" />
                <AttendanceMetricRow
                    icon={AlertCircle}
                    wrap
                    label="Clock In/Out Unavailable"
                    tone="destructive"
                    value={<div className="grid space-y-1 font-mono mt-1">
                        <span>Clock in/out is available from 7:00 AM to 11:00 PM. </span>
                        <span>Standard shift: 8:00 AM - 6:00 PM.</span>
                        <span>
                            ({settings?.clock_in_allowance_minutes || 60}-minute early clock-in allowed, paid hours count from shift start)
                        </span>
                    </div>}
                />
            </ClockCardShell>
        )
    }

    const lateRow = attendance?.is_late && (
        <AttendanceMetricRow
            icon={AlertCircle}
            label="Late Status"
            tone="warning"
            value={`Late by ${formatMinutesToHours(attendance.late_minutes)}`}
        />
    )

    const penaltyRow = attendance?.late_penalty_amount && parseFloat(attendance.late_penalty_amount) > 0 && (
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
    )

    const badgeClassName = isCompact ? "text-[11px] px-2 py-0.5 gap-1" : undefined

    return (
        <ClockCardShell isCompact={isCompact} statusAvatar={StatusAvatar}>
            {yesterdayAttendance?.auto_closed && yesterdayAttendance.auto_close_warning_count > 0 && (
                <div className="flex items-center justify-center p-3 sm:p-4 rounded-lg bg-warning/10 border border-warning/30">
                    <AutoCloseWarningBadge
                        autoCloseWarningCount={yesterdayAttendance.auto_close_warning_count}
                        size={isCompact ? "md" : "lg"}
                    />
                </div>
            )}

            {todayHoliday && (
                <AttendanceMetricRow
                    icon={AlertCircle}
                    label="Holiday"
                    tone="info"
                    value={todayHoliday.title}
                />
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

            <div className="flex flex-wrap items-center justify-center gap-2">
                <AttendanceStatusBadge
                    status={!attendance?.status ? "NONE" : attendance.status}
                    className={badgeClassName}
                />
                {attendance?.attendance_type !== "PENDING" && attendance?.status !== "PENDING" && (
                    <AttendanceTypeBadge
                        type={!attendance?.attendance_type ? "INVALID" : attendance.attendance_type}
                        className={badgeClassName}
                    />
                )}
            </div>

            <ClockFace time={currentTime} size="lg" className="py-1" />

            {isCompact ? (
                <AnimatePresence mode="wait">
                    {attendance && attendance.clock_in && (
                        <motion.div
                            initial={{ opacity: 0, y: 8 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.4, ease: "easeOut" }}
                            className="space-y-3"
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
                                        value: attendance.paid_hours ? `${attendance.paid_hours} hour/s` : "—",
                                    },
                                ]}
                            />
                            {(lateRow || penaltyRow) && (
                                <div className="space-y-2">
                                    {lateRow}
                                    {penaltyRow}
                                </div>
                            )}
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
                            value={
                                <span className="font-mono">
                                    {attendance.clock_in ? formatAttendanceTime(attendance.clock_in) : "—"}
                                </span>
                            }
                        />
                        <AttendanceMetricRow
                            icon={Clock}
                            label="Clock Out"
                            value={<span className="font-mono">
                                {attendance.clock_out ? formatAttendanceTime(attendance.clock_out) : "—"}
                            </span>}
                        />
                    </div>

                    {(lateRow || penaltyRow) && (
                        <div className="grid gap-3">
                            {lateRow}
                            {penaltyRow}
                        </div>
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

                    {attendance.notes && (
                        <AttendanceMetricRow icon={FileText} label="Notes" wrap value={attendance.notes} />
                    )}
                </div>
            ) : (
                <EmptyState
                    title="No attendance record for today"
                    description="Click `Clock In` to start your attendance for today."
                    icon={Clock}
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
                <AttendanceMetricRow
                    icon={AlertCircle}
                    label="Leave Notice"
                    tone="warning"
                    value={leaveMessage}
                    wrap
                />
            )}

            {isMarkedAbsent && !isShopClosedToday && (
                <AttendanceMetricRow
                    icon={AlertCircle}
                    label="Marked as Absent"
                    tone="destructive"
                    value="You have been marked as absent for today. Clock in/out is not available. Please contact your supervisor if you believe this is an error."
                    wrap
                />
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
                <AttendanceMetricRow
                    icon={CheckCircle}
                    label="Attendance Recorded"
                    tone="success"
                    value={attendance?.clock_out ? formatAttendanceTime(attendance.clock_out) : "—"}
                />
            )}

            {clockIn.isError && (
                <AttendanceMetricRow
                    icon={XCircle}
                    label="Clock In Failed"
                    tone="destructive"
                    value="Please try again or contact support if the issue persists"
                />
            )}

            {clockOut.isError && (
                <AttendanceMetricRow
                    icon={XCircle}
                    label="Clock Out Failed"
                    tone="destructive"
                    value="Please try again or contact support if the issue persists"
                />
            )}
        </ClockCardShell>
    )
}
