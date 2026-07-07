"use client"

import { ClockInOut } from "@/components/custom/attendance/ClockInOut"
import { GradientStatCard } from "@/components/custom/attendance/GradientStatCard"
import { RecentActivitySection } from "@/components/custom/attendance/RecentActivitySection"
import { SummaryStatCard } from "@/components/custom/attendance/SummaryStatCard"
import PageHeader from "@/components/custom/shared/PageHeader"
import { Wrapper } from "@/components/custom/shared/Wrapper"
import DashboardCalendar from "@/components/custom/shared/calendar/DashboardCalendar"
import { Button } from "@/components/ui/button"
import { GRADIENT_CARD_CONFIGS } from "@/lib/constants/attendanceCards"
import { useAttendanceStats } from "@/lib/hooks/useAttendanceStats"
import { useCurrentUser } from "@/lib/hooks/useCurrentUser"
import { useDailyAttendances } from "@/lib/queries/useAttendance"
import { convertAttendanceForCalendar } from "@/lib/utils/attendance"
import { formatDateToYMD } from "@/lib/utils/helpers"
import { formatDate } from "date-fns"
import { Clock3, Hourglass, Plane, Users } from "lucide-react"
import Link from "next/link"
import { useMemo, useState } from "react"

const AttendancePage = () => {
    const { user_id } = useCurrentUser()
    const [dateRange] = useState({
        start_date: formatDateToYMD(
            new Date(new Date().getFullYear(), new Date().getMonth(), 1),
        ),
        end_date: formatDateToYMD(new Date()),
    })

    // Fetch attendance data from API
    const {
        data: attendanceData,
        isLoading,
        refetch,
    } = useDailyAttendances({
        start_date: dateRange.start_date,
        end_date: dateRange.end_date,
        filter: { employee_id: user_id },
    })

    const attendanceRecords = attendanceData?.results || []
    const yesterdayAttendance = attendanceData?.results[1] || null

    // Convert to calendar format
    const calendarEvents = convertAttendanceForCalendar(attendanceRecords)

    // Calculate stats using custom hook
    const stats = useAttendanceStats(attendanceRecords, calendarEvents)

    // Real label from the actual computed range, not a static string.
    const rangeLabel = `${formatDate(new Date(dateRange.start_date), "MMM d")} – ${formatDate(
        new Date(dateRange.end_date),
        "MMM d, yyyy",
    )}`

    const summaryCards = useMemo(
        () => [
            {
                title: "Paid Hours",
                icon: Clock3,
                tone: "info" as const,
                value: stats.totalHours,
                format: { maximumFractionDigits: 2, minimumFractionDigits: 2 },
                description: `Approved and computed hours for ${rangeLabel}.`,
            },
            {
                title: "Pending Records",
                icon: Hourglass,
                tone: "warning" as const,
                value: stats.pendingCount,
                description: "Attendance entries still waiting for admin approval.",
            },
            {
                title: "Leave Days",
                icon: Plane,
                tone: "primary" as const,
                value: stats.leaveCount,
                description: `Approved leave days from ${rangeLabel}.`,
            },
        ],
        [stats.leaveCount, stats.pendingCount, stats.totalHours, rangeLabel],
    )

    return (
        <Wrapper>
            <div className="space-y-4 md:space-y-6">
                <PageHeader
                    variant="compact"
                    icon={Users}
                    title="Attendance"
                    description={`Your daily clock-in workspace, month snapshot (${rangeLabel}), and recent attendance history.`}
                    breadcrumbs={["Attendance"]}
                    actionButton={
                        <div className="flex flex-wrap items-center gap-2">
                            <Button
                                asChild
                                variant="outline"
                            >
                                <Link href="/attendance/leaves">
                                    <Plane className="mr-2 size-4" />
                                    My Leaves
                                </Link>
                            </Button>
                        </div>
                    }
                />

                <div className="grid gap-4 xl:grid-cols-[minmax(0,1.35fr)_minmax(320px,0.85fr)]">
                    <ClockInOut
                        onSuccess={() => refetch()}
                        yesterdayAttendance={yesterdayAttendance ?? undefined}
                    />

                    <div className="grid space-y-4">
                        {summaryCards.map((card) => (
                            <SummaryStatCard key={card.title} {...card} />
                        ))}
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 md:gap-4">
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
                </div>

                <DashboardCalendar
                    mode="attendance"
                    useCustomData
                    attendanceData={calendarEvents}
                    title="My Attendance"
                    description=""
                    withSettings={false}
                    withRefresh={false}
                    eventTypes={["attendance"]}
                />

                <RecentActivitySection
                    records={attendanceRecords}
                    isLoading={isLoading}
                />
            </div>
        </Wrapper>
    )
}

export default AttendancePage
