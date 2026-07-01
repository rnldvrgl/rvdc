"use client"

import { AnimatedNumber } from "@/components/custom/shared/AnimatedNumber"
import { Clock } from "lucide-react"

interface TimeSummaryProps {
    regularHours: number
    approvedOtHours: number
    holidayHours: number
    nightDiffHours: number
    totalDays?: number
    hoursPerDay?: number
}

export function TimeSummary({
    regularHours,
    approvedOtHours,
    holidayHours,
    nightDiffHours,
    totalDays,
    hoursPerDay,
}: TimeSummaryProps) {
    return (
        <div className="rounded-xl border bg-muted/20 p-4">
            <div className="mb-3 flex items-center gap-2">
                <Clock className="h-4 w-4 text-primary" />
                <h3 className="text-sm font-semibold tracking-tight">Time Summary</h3>
                {typeof totalDays === "number" && typeof hoursPerDay === "number" ? (
                    <span className="ml-auto text-xs text-muted-foreground">
                        <AnimatedNumber
                            value={totalDays}
                            className="font-mono font-semibold text-foreground"
                            format={{ maximumFractionDigits: 2, minimumFractionDigits: 2 }}
                        />{" "}
                        days &nbsp;
                        <span className="opacity-60">({hoursPerDay}h/day)</span>
                    </span>
                ) : null}
            </div>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                <TimeCard label="Regular" hours={regularHours} color="blue" />
                <TimeCard label="Overtime" hours={approvedOtHours} color="orange" />
                <TimeCard label="Holiday" hours={holidayHours} color="green" />
                <TimeCard label="Night Diff" hours={nightDiffHours} color="purple" />
            </div>
        </div>
    )
}

interface TimeCardProps {
    label: string
    hours: number
    color: "blue" | "orange" | "green" | "purple"
}

function TimeCard({ label, hours, color }: TimeCardProps) {
    const styles = {
        blue: {
            bg: "bg-blue-50 dark:bg-blue-950/30",
            border: "border-blue-200/60 dark:border-blue-800/40",
            value: "text-blue-700 dark:text-blue-400",
        },
        orange: {
            bg: "bg-orange-50 dark:bg-orange-950/30",
            border: "border-orange-200/60 dark:border-orange-800/40",
            value: "text-orange-700 dark:text-orange-400",
        },
        green: {
            bg: "bg-green-50 dark:bg-green-950/30",
            border: "border-green-200/60 dark:border-green-800/40",
            value: "text-success",
        },
        purple: {
            bg: "bg-purple-50 dark:bg-purple-950/30",
            border: "border-purple-200/60 dark:border-purple-800/40",
            value: "text-purple-700 dark:text-purple-400",
        },
    }

    const s = styles[color]

    return (
        <div className={`rounded-lg border ${s.bg} ${s.border} px-3 py-2.5 text-center`}>
            <div className={`flex items-baseline justify-center gap-0.5 ${s.value}`}>
                <AnimatedNumber
                    value={hours}
                    className="text-xl font-bold font-mono tabular-nums"
                    format={{ maximumFractionDigits: 1, minimumFractionDigits: 1 }}
                />
                <span className="text-xs font-medium opacity-70">h</span>
            </div>
            <p className="mt-0.5 text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
                {label}
            </p>
        </div>
    )
}
