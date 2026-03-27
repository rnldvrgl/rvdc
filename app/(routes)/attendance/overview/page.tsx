"use client"

import { AttendanceManagementTabs } from "@/components/custom/attendance/AttendanceManagementTabs"
import { AttendanceOverviewStats } from "@/components/custom/attendance/AttendanceOverviewStats"
import { EmployeeFilter } from "@/components/custom/attendance/EmployeeFilter"
import { MarkAbsentDialog } from "@/components/custom/attendance/MarkAbsentDialog"
import PageHeader from "@/components/custom/shared/PageHeader"
import { Wrapper } from "@/components/custom/shared/Wrapper"
import DashboardCalendar from "@/components/custom/shared/calendar/DashboardCalendar"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useAttendanceStats } from "@/lib/hooks/useAttendanceStats"
import { useCurrentUser } from "@/lib/hooks/useCurrentUser"
import { useNavigation } from "@/lib/hooks/useNavigation"
import useSearchParameters from "@/lib/hooks/useSearchParameters"
import { useDailyAttendances } from "@/lib/queries/useAttendance"
import { useEmployeeChoices } from "@/lib/queries/useChoices"
import { convertAttendanceForCalendar } from "@/lib/utils/attendance"
import { formatDateToYMD } from "@/lib/utils/helpers"
import {
  CalendarDays,
  ClipboardList,
  Plane,
  UserRoundSearch,
  Users,
} from "lucide-react"
import Link from "next/link"
import { useEffect, useMemo, useRef, useState } from "react"

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
    date_from: formatDateToYMD(firstDayOfMonth),
    date_to: formatDateToYMD(lastDayOfMonth),
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

  const selectedEmployeeId = selectedEmployee?.employee_id

  useEffect(() => {
    if (!filter?.employee_id || selectedEmployee) return

    const matchedEmployee = employeeChoices.find(
      (employee) => String(employee.id) === String(filter.employee_id),
    )

    if (matchedEmployee) {
      setSelectedEmployee({
        employee_id: matchedEmployee.id,
        employee_name: `${matchedEmployee.first_name} ${matchedEmployee.last_name}`,
      })
    }
  }, [employeeChoices, filter?.employee_id, selectedEmployee])

  // Update URL when employee selection changes
  const prevEmployeeId = useRef(selectedEmployee?.employee_id)
  useEffect(() => {
    if (prevEmployeeId.current === selectedEmployee?.employee_id) return
    prevEmployeeId.current = selectedEmployee?.employee_id
    push({
      filter: { ...filter, employee_id: selectedEmployee?.employee_id },
    })
  }, [selectedEmployee?.employee_id, filter, push])

  const quickLinks = useMemo(
    () => [
      {
        title: "Manual Records",
        description: "Add, edit, archive, or approve attendance records without Django admin.",
        href: {
          pathname: "/attendance/records",
          query: {
            ...(selectedEmployeeId ? { employee_id: selectedEmployeeId } : {}),
          },
        },
        icon: ClipboardList,
      },
      {
        title: "Leaves",
        description: "Review leave requests and balances alongside attendance exceptions.",
        href: { pathname: "/attendance/leaves", query: {} },
        icon: Plane,
      },
      {
        title: "Team Focus",
        description: "Use employee filtering to inspect one person’s month before opening their records.",
        href: { pathname: "/attendance/overview", query: {} },
        icon: UserRoundSearch,
      },
    ],
    [selectedEmployeeId],
  )

  const handleCalendarDateClick = (date: Date) => {
    const query = new URLSearchParams()
    query.set("date", formatDateToYMD(date))
    if (selectedEmployeeId) query.set("employee_id", String(selectedEmployeeId))
    window.location.href = `/attendance/records?${query.toString()}`
  }

  return (
    <Wrapper>
      <div className="space-y-4 md:space-y-6">
        <PageHeader
          icon={Users}
          title="Attendance"
          description="Command center for approvals, day-level corrections, and month-by-month attendance visibility."
          breadcrumbs={[
            "Attendance",
            "Overview",
            `${selectedEmployee?.employee_name || "All Employees"}`,
          ]}
          onRefresh={refetch}
          actionButton={
            isAdmin ? (
              <div className="flex flex-wrap items-center gap-2">
                <Button asChild>
                  <Link href="/attendance/records">
                    <ClipboardList className="mr-2 size-4" />
                    Manage Records
                  </Link>
                </Button>
                <MarkAbsentDialog />
              </div>
            ) : undefined
          }
          variant="compact"
        />

        <EmployeeFilter
          employees={employeeChoices}
          selectedEmployee={selectedEmployee ?? undefined}
          onEmployeeChange={setSelectedEmployee}
        />

        <AttendanceOverviewStats
          stats={stats}
          isLoading={isLoading}
        />

        <div className="grid gap-4 xl:grid-cols-[minmax(0,1.65fr)_minmax(320px,0.95fr)]">
          <Card className="overflow-hidden border-border/60">
            <CardHeader className="border-b border-border/60 pb-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <CalendarDays className="h-5 w-5 text-primary" />
                    Monthly Attendance Calendar
                  </CardTitle>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Click any day to jump straight into the admin records workspace for that date.
                  </p>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <DashboardCalendar
                mode="attendance"
                useCustomData
                attendanceData={calendarEvents}
                onDateClick={handleCalendarDateClick}
                title="Attendance Overview"
                description=""
                eventTypes={["attendance"]}
              />
            </CardContent>
          </Card>

          <div className="space-y-4">
            {quickLinks.map((link) => {
              const Icon = link.icon
              const queryString = new URLSearchParams(
                Object.entries(link.href.query).reduce(
                  (acc, [key, value]) => {
                    if (value != null) acc[key] = String(value)
                    return acc
                  },
                  {} as Record<string, string>,
                ),
              ).toString()
              const target = queryString
                ? `${link.href.pathname}?${queryString}`
                : link.href.pathname

              return (
                <Card
                  key={link.title}
                  className="border-border/60"
                >
                  <CardContent className="flex items-start justify-between gap-4 p-5">
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-base font-semibold">
                        <Icon className="h-4 w-4 text-primary" />
                        {link.title}
                      </div>
                      <p className="text-sm text-muted-foreground">{link.description}</p>
                    </div>
                    <Button
                      asChild
                      variant="outline"
                    >
                      <Link href={target}>Open</Link>
                    </Button>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        </div>

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
