"use client"

import { ClockInOut } from "@/components/custom/attendance/ClockInOut"
import { GradientStatCard } from "@/components/custom/attendance/GradientStatCard"
import { RecentActivitySection } from "@/components/custom/attendance/RecentActivitySection"
import { StatCard } from "@/components/custom/attendance/StatCard"
import PageHeader from "@/components/custom/shared/PageHeader"
import { Wrapper } from "@/components/custom/shared/Wrapper"
import {
  GRADIENT_CARD_CONFIGS,
  STAT_CARD_CONFIGS,
} from "@/lib/constants/attendanceCards"
import { useAttendanceStats } from "@/lib/hooks/useAttendanceStats"
import { useCurrentUser } from "@/lib/hooks/useCurrentUser"
import { useDailyAttendances } from "@/lib/queries/useAttendance"
import { convertAttendanceForCalendar } from "@/lib/utils/attendance"
import { formatDateToYMD } from "@/lib/utils/helpers"
import { Users } from "lucide-react"
import { useState } from "react"

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

  return (
    <Wrapper>
      <div className="space-y-4 md:space-y-6">
        <PageHeader
          icon={Users}
          title="Attendance"
          description="Track and manage employee attendance"
          breadcrumbs={["Attendance"]}
        />

        {/* Clock In/Out Panel */}
        <ClockInOut
          onSuccess={() => refetch()}
          yesterdayAttendance={yesterdayAttendance ?? undefined}
        />

        {/* Summary Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
          {STAT_CARD_CONFIGS.map((config) => {
            const value = stats[`${config.key}Count` as keyof typeof stats]
            const subtitle =
              typeof config.getSubtitle === "function"
                ? config.getSubtitle(stats.approvedCount, stats.totalCount)
                : config.getSubtitle

            return (
              <StatCard
                key={config.key}
                title={config.title}
                value={value as number}
                subtitle={subtitle}
                icon={config.icon}
                iconBgColor={config.iconBgColor}
                iconColor={config.iconColor}
                valueColor={config.valueColor}
                isLoading={isLoading}
              />
            )
          })}
        </div>

        {/* Additional Stats Row */}
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

        {/* Recent Records */}
        <RecentActivitySection
          records={attendanceRecords}
          isLoading={isLoading}
          showEmployeeCount={true}
        />
      </div>
    </Wrapper>
  )
}

export default AttendancePage
