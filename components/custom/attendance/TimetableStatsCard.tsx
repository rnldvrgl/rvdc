"use client"

import { GradientStatCard, type StatTone } from "@/components/custom/attendance/GradientStatCard"
import { AnimatedNumber } from "@/components/custom/shared/charts/MotionWrappers"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { GRADIENT_CARD_CONFIGS } from "@/lib/constants/attendanceCards"
import { useAttendanceStats } from "@/lib/hooks/useAttendanceStats"
import { useCurrentUser } from "@/lib/hooks/useCurrentUser"
import { useDailyAttendances } from "@/lib/queries/useAttendance"
import { convertAttendanceForCalendar } from "@/lib/utils/attendance"
import { cn, formatDateToYMD } from "@/lib/utils/helpers"
import { formatDate } from "@/lib/utils/helpers/date"
import { CalendarClock, Clock3, Hourglass, Plane } from "lucide-react"
import type { LucideIcon } from "lucide-react"
import { useMemo, useState } from "react"

const toneClasses: Record<StatTone, string> = {
    success: "bg-success/15 text-success",
    destructive: "bg-destructive/15 text-destructive",
    warning: "bg-warning/15 text-warning",
    info: "bg-info/15 text-info",
    primary: "bg-primary/15 text-primary",
}

function SummaryCard({
    icon: Icon,
    tone,
    title,
    value,
    description,
}: {
    icon: LucideIcon
    tone: StatTone
    title: string
    value: number
    description: string
}) {
    return (
        <Card>
            <CardContent className="space-y-2">
                <div className="flex items-center gap-2">
                    <div className={cn("p-1.5 rounded-md", toneClasses[tone])}>
                        <Icon className="h-4 w-4" />
                    </div>
                    <p className="text-sm font-medium text-muted-foreground">{title}</p>
                </div>
                <AnimatedNumber className="text-4xl md:text-5xl font-semibold tabular-nums" value={value} />
                <p className="text-sm text-muted-foreground">{description}</p>
            </CardContent>
        </Card>
    )
}

export function TimetableStatsCard() {
    const { user_id } = useCurrentUser()

    const [dateRange] = useState({
        start_date: formatDateToYMD(
            new Date(new Date().getFullYear(), new Date().getMonth(), 1),
        ),
        end_date: formatDateToYMD(new Date()),
    })

    const { data: attendanceData, isLoading } = useDailyAttendances({
        start_date: dateRange.start_date,
        end_date: dateRange.end_date,
        filter: { employee_id: user_id },
    })

    const attendanceRecords = attendanceData?.results || []
    const calendarEvents = convertAttendanceForCalendar(attendanceRecords)
    const stats = useAttendanceStats(attendanceRecords, calendarEvents)

    const rangeLabel = `${formatDate(new Date(dateRange.start_date), "MMM d")} – ${formatDate(
        new Date(dateRange.end_date),
        "MMM d, yyyy",
    )}`

    const summaryCards = useMemo(
        () => [
            {
                title: "Paid Hours",
                icon: Clock3,
                tone: "info" as StatTone,
                value: stats.totalHours,
                description: `Approved and computed hours for ${rangeLabel}.`,
            },
            {
                title: "Pending Records",
                icon: Hourglass,
                tone: "warning" as StatTone,
                value: stats.pendingCount,
                description: "Attendance entries still waiting for admin approval.",
            },
            {
                title: "Leave Days",
                icon: Plane,
                tone: "primary" as StatTone,
                value: stats.leaveCount,
                description: `Approved leave days from ${rangeLabel}.`,
            },
        ],
        [stats.leaveCount, stats.pendingCount, stats.totalHours, rangeLabel],
    )

    return (
        <div className="grid space-y-4">
            <div className="grid grid-cols-1 gap-3 lg:grid-cols-3">
                {summaryCards.map((card) => (
                    <SummaryCard key={card.title} {...card} />
                ))}
            </div>

            <Card>
                <CardHeader className="flex items-center justify-between">
                    <CardTitle className="flex items-center gap-2 text-base">
                        <CalendarClock className="h-4 w-4 text-primary" />
                        Timetable Stats
                    </CardTitle>
                    <CardDescription className="text-xs text-muted-foreground" suppressHydrationWarning>
                        {rangeLabel}
                    </CardDescription>
                </CardHeader>
                <CardContent className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                    {GRADIENT_CARD_CONFIGS.map((config) => {
                        const value = stats[`${config.key}Count` as keyof typeof stats]

                        return (
                            <GradientStatCard
                                key={config.key}
                                title={config.title}
                                value={value as number}
                                subtitle={config.subtitle}
                                icon={config.icon}
                                tone={config.tone}
                                isLoading={isLoading}
                            />
                        )
                    })}
                </CardContent>
            </Card>
        </div>
    )
}
