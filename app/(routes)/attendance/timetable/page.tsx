"use client"

import { ClockInOut } from "@/components/custom/attendance/ClockInOut"
import { GradientStatCard } from "@/components/custom/attendance/GradientStatCard"
import { RecentActivitySection } from "@/components/custom/attendance/RecentActivitySection"
import PageHeader from "@/components/custom/shared/PageHeader"
import { Wrapper } from "@/components/custom/shared/Wrapper"
import DashboardCalendar from "@/components/custom/shared/calendar/DashboardCalendar"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { GRADIENT_CARD_CONFIGS } from "@/lib/constants/attendanceCards"
import { useAttendanceStats } from "@/lib/hooks/useAttendanceStats"
import { useCurrentUser } from "@/lib/hooks/useCurrentUser"
import { useDailyAttendances } from "@/lib/queries/useAttendance"
import { convertAttendanceForCalendar } from "@/lib/utils/attendance"
import { formatDateToYMD } from "@/lib/utils/helpers"
import { CalendarDays, ClipboardList, Plane, Users } from "lucide-react"
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

  const summaryCards = useMemo(
    () => [
      {
        title: "Paid Hours",
        value: stats.totalHours.toFixed(2),
        description: "Approved and computed hours for the current month range.",
      },
      {
        title: "Pending Records",
        value: String(stats.pendingCount),
        description: "Attendance entries still waiting for admin approval.",
      },
      {
        title: "Leave Days",
        value: String(stats.leaveCount),
        description: "Approved leave days visible in your attendance month view.",
      },
    ],
    [stats.leaveCount, stats.pendingCount, stats.totalHours],
  )

  return (
    <Wrapper>
      <div className="space-y-4 md:space-y-6">
        <PageHeader
          icon={Users}
          title="Attendance"
          description="Your daily clock-in workspace, month snapshot, and recent attendance history."
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

          <div className="space-y-4">
            {summaryCards.map((card) => (
              <Card
                key={card.title}
                className="border-border/60"
              >
                <CardContent className="p-5">
                  <p className="text-sm font-medium text-muted-foreground">{card.title}</p>
                  <div className="mt-2 text-3xl font-semibold">{card.value}</div>
                  <p className="mt-2 text-sm text-muted-foreground">{card.description}</p>
                </CardContent>
              </Card>
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
        </div>

        <Card className="overflow-hidden border-border/60">
          <CardHeader className="border-b border-border/60 pb-4">
            <div className="flex items-center justify-between gap-3">
              <div>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <CalendarDays className="h-5 w-5 text-primary" />
                  Monthly Calendar
                </CardTitle>
                <p className="mt-1 text-sm text-muted-foreground">
                  View your attendance pattern for the month, including late, leave, and absent days.
                </p>
              </div>
              <Button
                asChild
                variant="outline"
              >
                <Link href="/attendance/leaves">
                  <ClipboardList className="mr-2 h-4 w-4" />
                  Request or Review Leave
                </Link>
              </Button>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <DashboardCalendar
              mode="attendance"
              useCustomData
              attendanceData={calendarEvents}
              title="My Attendance"
              description=""
              eventTypes={["attendance"]}
            />
          </CardContent>
        </Card>

        <RecentActivitySection
          records={attendanceRecords}
          isLoading={isLoading}
          showEmployeeCount={false}
        />
      </div>
    </Wrapper>
  )
}

export default AttendancePage
