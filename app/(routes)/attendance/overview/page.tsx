"use client"

import { AttendanceManagementTabs } from "@/components/custom/attendance/AttendanceManagementTabs"
import { AttendanceOverviewStats } from "@/components/custom/attendance/AttendanceOverviewStats"
import { EmployeeFilter } from "@/components/custom/attendance/EmployeeFilter"
import { MarkAbsentDialog } from "@/components/custom/attendance/MarkAbsentDialog"
import PageHeader from "@/components/custom/shared/PageHeader"
import { Wrapper } from "@/components/custom/shared/Wrapper"
import { useAttendanceStats } from "@/lib/hooks/useAttendanceStats"
import { useNavigation } from "@/lib/hooks/useNavigation"
import useSearchParameters from "@/lib/hooks/useSearchParameters"
import { useDailyAttendances } from "@/lib/queries/useAttendance"
import { useCurrentUser } from "@/lib/hooks/useCurrentUser"
import { useEmployeeChoices } from "@/lib/queries/useChoices"
import { convertAttendanceForCalendar } from "@/lib/utils/attendance"
import { Users } from "lucide-react"
import { useEffect, useRef, useState } from "react"

type SelectedEmployeeType =
  | (Record<"employee_id", number | string> & Record<"employee_name", string>)
  | undefined

const AttendanceOverviewPage = () => {
  const { isAdmin } = useCurrentUser()
  const { filter } = useSearchParameters()
  const { push } = useNavigation()
  const { data: employeeChoicesData } = useEmployeeChoices({
    includeInPayroll: true,
  })
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
  } = useDailyAttendances({ filter: monthFilter, limit: 1000 })

  // Separate query for recent activity (not limited to current month)
  const { data: recentAttendanceData, isLoading: isLoadingRecent } =
    useDailyAttendances({
      filter,
      limit: 10,
      ordering: "-date,-created_at",
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
  }, [selectedEmployee?.employee_id, filter, push])

  return (
    <Wrapper>
      <div className="space-y-4 md:space-y-6">
        {/* Page Header */}
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
          actionButton={isAdmin ? <MarkAbsentDialog /> : undefined}
          variant="compact"
        />

        <EmployeeFilter
          employees={employeeChoices}
          selectedEmployee={selectedEmployee ?? undefined}
          onEmployeeChange={setSelectedEmployee}
        />

        {/* Stats Overview */}
        <AttendanceOverviewStats
          stats={stats}
          isLoading={isLoading}
        />

        {/* Tabbed Management Sections */}
        <AttendanceManagementTabs
          recentRecords={recentRecords}
          isLoadingRecent={isLoadingRecent}
          showEmployeeCount={!selectedEmployee}
          filter={filter}
        />
      </div>
    </Wrapper>
  )
}

export default AttendanceOverviewPage
