"use client"

import { GradientStatCard } from "@/components/custom/attendance/GradientStatCard"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { GRADIENT_CARD_CONFIGS } from "@/lib/constants/attendanceCards"
import { useAttendanceStats } from "@/lib/hooks/useAttendanceStats"
import { useCurrentUser } from "@/lib/hooks/useCurrentUser"
import { useDailyAttendances } from "@/lib/queries/useAttendance"
import { convertAttendanceForCalendar } from "@/lib/utils/attendance"
import { formatDateToYMD } from "@/lib/utils/helpers"
import { formatDate } from "@/lib/utils/helpers/date"
import { CalendarClock } from "lucide-react"
import { useMemo, useState } from "react"

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
                value: stats.totalHours.toFixed(2),
                description: `Approved and computed hours for ${rangeLabel}.`,
            },
            {
                title: "Pending Records",
                value: String(stats.pendingCount),
                description: "Attendance entries still waiting for admin approval.",
            },
            {
                title: "Leave Days",
                value: String(stats.leaveCount),
                description: `Approved leave days from ${rangeLabel}.`,
            },
        ],
        [stats.leaveCount, stats.pendingCount, stats.totalHours, rangeLabel],
    )

    return (
        <div className="space-y-4">
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                {summaryCards.map((card) => (
                    <Card key={card.title} className="border-border/60">
                        <CardContent className="p-5">
                            <p className="text-sm font-medium text-muted-foreground">{card.title}</p>
                            <div className="mt-2 text-3xl font-semibold">{card.value}</div>
                            <p className="mt-2 text-sm text-muted-foreground">{card.description}</p>
                        </CardContent>
                    </Card>
                ))}
            </div>

            <Card className="border-border/60">
                <CardHeader className="pb-3">
                    <div className="flex items-center justify-between gap-3">
                        <CardTitle className="flex items-center gap-2 text-base">
                            <CalendarClock className="h-4 w-4 text-primary" />
                            Timetable Stats
                        </CardTitle>
                        <p className="text-xs text-muted-foreground" suppressHydrationWarning>
                            {rangeLabel}
                        </p>
                    </div>
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
                                gradientFrom={config.gradientFrom}
                                gradientTo={config.gradientTo}
                                borderColor={config.borderColor}
                                iconBgColor={config.iconBgColor}
                                iconColor={config.iconColor}
                                titleColor={config.titleColor}
                                valueColor={config.valueColor}
                                subtitleColor={config.subtitleColor}
                                isLoading={isLoading}
                            />
                        )
                    })}
                </CardContent>
            </Card>
        </div>
    )
}
