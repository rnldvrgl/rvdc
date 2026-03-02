"use client"

import { AttendanceApproval } from "@/components/custom/attendance/AttendanceApproval"
import { EmployeeFilter } from "@/components/custom/attendance/EmployeeFilter"
import { GradientStatCard } from "@/components/custom/attendance/GradientStatCard"
import { LeaveOverview } from "@/components/custom/attendance/LeaveOverview"
import { RecentActivitySection } from "@/components/custom/attendance/RecentActivitySection"
import { StatCard } from "@/components/custom/attendance/StatCard"
import PageHeader from "@/components/custom/shared/PageHeader"
import { Wrapper } from "@/components/custom/shared/Wrapper"
import {
  GRADIENT_CARD_CONFIGS,
  STAT_CARD_CONFIGS,
} from "@/lib/constants/attendanceCards"
import { useAttendanceStats } from "@/lib/hooks/useAttendanceStats"
import { useNavigation } from "@/lib/hooks/useNavigation"
import useSearchParameters from "@/lib/hooks/useSearchParameters"
import { useDailyAttendances } from "@/lib/queries/useAttendance"
import { useEmployeeChoices } from "@/lib/queries/useChoices"
import { convertAttendanceForCalendar } from "@/lib/utils/attendance"
import { Users } from "lucide-react"
import { useEffect, useRef, useState } from "react"

type SelectedEmployeeType =
  | (Record<"employee_id", number | string> & Record<"employee_name", string>)
  | undefined

const AttendanceOverviewPage = () => {
  const { filter } = useSearchParameters()
  const { push } = useNavigation()
  const { data: employeeChoicesData } = useEmployeeChoices()
  const [selectedEmployee, setSelectedEmployee] =
    useState<SelectedEmployeeType>(undefined)

  const employeeChoices = employeeChoicesData || []

  // Get current month date range for filtering
  const now = new Date()
  const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
  const lastDayOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0)

  const monthFilter = {
    ...filter,
    date_after: firstDayOfMonth.toISOString().split("T")[0],
    date_before: lastDayOfMonth.toISOString().split("T")[0],
  }

  const {
    data: attendanceData,
    isLoading,
    refetch,
  } = useDailyAttendances({ filter: monthFilter })

  // Separate query for recent activity (not limited to current month)
  const { data: recentAttendanceData, isLoading: isLoadingRecent } =
    useDailyAttendances({
      filter,
      limit: 10,
      ordering: "-date,-created_at", // Most recent first
    })

  const attendanceRecords = attendanceData?.results || []
  const recentRecords = recentAttendanceData?.results || []

  // Convert to calendar format
  const calendarEvents = convertAttendanceForCalendar(attendanceRecords)

  // Calculate stats using custom hook
  const stats = useAttendanceStats(attendanceRecords, calendarEvents)

  // Update URL when employee selection changes
  const prevEmployeeId = useRef(selectedEmployee?.employee_id)
  useEffect(() => {
    if (prevEmployeeId.current === selectedEmployee?.employee_id) return
    prevEmployeeId.current = selectedEmployee?.employee_id
    push({
      filter: { ...filter, employee_id: selectedEmployee?.employee_id },
    })
  }, [selectedEmployee?.employee_id])

  return (
    <Wrapper>
      <div className="space-y-4 md:space-y-6">
        <PageHeader
          icon={Users}
          title="Attendance"
          description="Track and manage employee attendance"
          breadcrumbs={[
            "Attendance",
            "Overview",
            `${selectedEmployee?.employee_name || "All Employees"}`,
          ]}
          onRefresh={refetch}
        />

        {/* Employee Filter */}
        <EmployeeFilter
          employees={employeeChoices}
          selectedEmployee={selectedEmployee ?? undefined}
          onEmployeeChange={setSelectedEmployee}
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

        {/* Admin Approval Panel */}
        <AttendanceApproval />

        {/* Leave Overview Section */}
        <LeaveOverview />

        {/* Recent Records */}
        <RecentActivitySection
          records={recentRecords}
          isLoading={isLoadingRecent}
          showEmployeeCount={!selectedEmployee}
        />
      </div>
    </Wrapper>
  )
}

export default AttendanceOverviewPage
