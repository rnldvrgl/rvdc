// AttendanceRecordItem.tsx
"use client"

import {
    AttendanceStatusBadge,
    AttendanceTypeBadge,
} from "@/components/custom/attendance/AttendanceBadges"
import { AnimatedNumber } from "@/components/custom/shared/AnimatedNumber"
import { DailyAttendance } from "@/lib/constants/types"
import { formatAttendanceTime } from "@/lib/utils/attendance"
import { motion } from "framer-motion"
import { AlertTriangle, Clock } from "lucide-react"

interface AttendanceRecordItemProps {
    record: DailyAttendance
    isFirst?: boolean
    isLast?: boolean
    index?: number
}

const PENALTY_CURRENCY_FORMAT = {
    style: "currency" as const,
    currency: "PHP",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
}

// Must match the DOT_OFFSET constant in RecentActivitySection's skeleton
const DOT_OFFSET = "14px"

const getDotClasses = (record: DailyAttendance) => {
    if (record.attendance_type === "LEAVE") return "bg-violet-500"
    if (record.attendance_type === "ABSENT") return "bg-muted-foreground/40"
    if (record.is_late) return "bg-warning"
    return "bg-primary"
}

export const AttendanceRecordItem = ({
    record,
    isFirst = false,
    isLast = false,
    index = 0,
}: AttendanceRecordItemProps) => {
    const isLeave = record.attendance_type === "LEAVE"
    const hasNotes = record.notes && record.notes.trim().length > 0

    const latePenalty = record.late_penalty_amount
        ? parseFloat(record.late_penalty_amount)
        : 0
    const uniformPenalty = record.uniform_penalty_amount
        ? parseFloat(record.uniform_penalty_amount)
        : 0
    const hasPenalties = latePenalty > 0 || uniformPenalty > 0

    return (
        <motion.div
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ type: "spring", stiffness: 400, damping: 30, delay: index * 0.03 }}
            className="flex gap-2.5 px-3 md:gap-3 md:px-5"
        >
            {/* Dot + full-height connecting line — no padding offset,
                so consecutive rows' line segments touch exactly */}
            <div className="relative flex w-2.5 shrink-0 justify-center">
                {!isFirst && (
                    <span
                        className="absolute top-0 w-px bg-border"
                        style={{ height: DOT_OFFSET }}
                    />
                )}
                {!isLast && (
                    <span
                        className="absolute bottom-0 w-px bg-border"
                        style={{ top: DOT_OFFSET }}
                    />
                )}
                <span
                    className={`absolute size-2.5 rounded-full ring-4 ring-background ${getDotClasses(record)}`}
                    style={{ top: `calc(${DOT_OFFSET} - 5px)` }}
                />
            </div>

            {/* Content */}
            <div className="min-w-0 flex-1 py-2 md:py-2.5">
                <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-0.5">
                    <div className="flex min-w-0 items-baseline gap-1.5 md:gap-2">
                        <span className="truncate text-sm font-semibold text-foreground">
                            {record.employee_name}
                        </span>
                        <span className="shrink-0 text-[11px] text-muted-foreground md:text-xs">
                            {new Date(record.date).toLocaleDateString("en-US", {
                                weekday: "short",
                                month: "short",
                                day: "numeric",
                            })}
                        </span>
                    </div>
                    <div className="flex shrink-0 items-center gap-1.5">
                        {record.status == "APPROVED" &&
                            record.attendance_type != "ABSENT" && (
                                <AttendanceStatusBadge status={record.status} />
                            )}
                        <AttendanceTypeBadge type={record.attendance_type} />
                    </div>
                </div>

                <div className="mt-0.5 flex flex-wrap items-center gap-x-2.5 gap-y-0.5 text-xs">
                    {!isLeave && record.clock_in ? (
                        <span className="flex items-center gap-1 font-mono text-muted-foreground">
                            <Clock className="size-3" />
                            {formatAttendanceTime(record.clock_in)} →{" "}
                            {record.clock_out ? formatAttendanceTime(record.clock_out) : "Pending"}
                        </span>
                    ) : isLeave ? (
                        <span className="flex items-center gap-1 text-violet-600 dark:text-violet-400">
                            <Clock className="size-3" />
                            On Leave
                        </span>
                    ) : null}

                    {record.is_late && (
                        <span className="font-medium text-warning">
                            +{record.late_minutes}m late
                        </span>
                    )}

                    {record.paid_hours && (
                        <span className="text-muted-foreground">
                            <AnimatedNumber
                                value={Number(record.paid_hours)}
                                className="font-mono tabular-nums"
                                format={{ maximumFractionDigits: 1, minimumFractionDigits: 1 }}
                            />{" "}
                            hrs paid
                        </span>
                    )}
                </div>

                {hasPenalties && (
                    <div className="mt-0.5 flex flex-wrap items-center gap-x-2.5 gap-y-0.5 text-xs">
                        {latePenalty > 0 && (
                            <span className="flex items-center gap-1 font-medium text-destructive">
                                <AlertTriangle className="size-3" />
                                Late deduction{" "}
                                <AnimatedNumber
                                    value={latePenalty}
                                    className="font-mono tabular-nums"
                                    format={PENALTY_CURRENCY_FORMAT}
                                />
                            </span>
                        )}
                        {uniformPenalty > 0 && (
                            <span className="flex items-center gap-1 font-medium text-warning">
                                <AlertTriangle className="size-3" />
                                Uniform{" "}
                                <AnimatedNumber
                                    value={uniformPenalty}
                                    className="font-mono tabular-nums"
                                    format={PENALTY_CURRENCY_FORMAT}
                                />
                            </span>
                        )}
                    </div>
                )}

                {hasNotes && (
                    <div className="mt-0.5 line-clamp-2 text-xs text-primary">
                        {record.notes}
                    </div>
                )}
            </div>
        </motion.div>
    )
}
