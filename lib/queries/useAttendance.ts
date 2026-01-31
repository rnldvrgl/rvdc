"use client"

import type {
  CurrentAttendanceStatus,
  DailyAttendance,
  LeaveBalance,
  LeaveRequest,
  Offense,
  OffenseStatistics,
  PaginatedFilterProps,
} from "@/lib/constants/types"
import { useApiQuery } from "@/lib/hooks/useApiQuery"
import { usePaginatedQuery } from "@/lib/hooks/usePaginatedQuery"

// Daily Attendance Queries
const attendanceUrl = "/attendance/daily-attendance/"

export function useDailyAttendance(id: string) {
  return useApiQuery<DailyAttendance>({
    queryKey: ["daily-attendance", id],
    url: `${attendanceUrl}${id}/`,
    options: {
      enabled: !!id,
    },
  })
}

export function useDailyAttendances(props: PaginatedFilterProps = {}) {
  return usePaginatedQuery<DailyAttendance>({
    ...props,
    url: attendanceUrl,
    queryKeyBase: "daily-attendances",
  })
}

export function usePendingAttendanceApprovals(
  props: PaginatedFilterProps = {},
) {
  const employeeId = props.filter?.employee_id
  return useApiQuery<DailyAttendance[]>({
    queryKey: [
      "pending-attendance-approvals",
      `${employeeId ? "employee_id=" + employeeId : "all"}`,
    ],
    url: `${attendanceUrl}pending_approvals/${employeeId ? `?employee_id=${employeeId}` : ""}`,
  })
}

// !TODO: FIX: Backend endpoint needs to be fixed to avoid paginated results
export function useCurrentAttendanceStatus() {
  return useApiQuery<CurrentAttendanceStatus | null>({
    queryKey: ["current-attendance-status"],
    url: `${attendanceUrl}current_status`,
  })
}

// Leave Balance Queries
const leaveBalanceUrl = "/attendance/leave-balance/"

export function useLeaveBalance(id: string) {
  return useApiQuery<LeaveBalance>({
    queryKey: ["leave-balance", id],
    url: `${leaveBalanceUrl}${id}/`,
    options: {
      enabled: !!id,
    },
  })
}

export function useLeaveBalances(props: PaginatedFilterProps = {}) {
  return usePaginatedQuery<LeaveBalance>({
    ...props,
    url: leaveBalanceUrl,
    queryKeyBase: "leave-balances",
  })
}

export function useMyLeaveBalance({ enabled = true } = {}) {
  return useApiQuery<LeaveBalance>({
    queryKey: ["my-leave-balance"],
    url: `${leaveBalanceUrl}my_balance/`,
    options: {
      enabled,
    },
  })
}

// Leave Request Queries
const leaveRequestUrl = "/attendance/leave-request/"

export function useLeaveRequest(id: string) {
  return useApiQuery<LeaveRequest>({
    queryKey: ["leave-request", id],
    url: `${leaveRequestUrl}${id}/`,
    options: {
      enabled: !!id,
    },
  })
}

export function useLeaveRequests(
  props: PaginatedFilterProps = {},
  enabled: boolean = true,
) {
  return usePaginatedQuery<LeaveRequest>({
    ...props,
    url: leaveRequestUrl,
    queryKeyBase: "leave-requests",
    enabled,
  })
}

export function usePendingLeaveApprovals(
  props: PaginatedFilterProps = {},
  enabled = true,
) {
  const employeeId = props.filter?.employee_id
  return useApiQuery<LeaveRequest[]>({
    queryKey: [
      "pending-leave-approvals",
      `${employeeId ? "employee_id=" + employeeId : "all"}`,
    ],
    url: `${leaveRequestUrl}pending_approvals/${employeeId ? `?employee_id=${employeeId}` : ""}`,
    options: {
      enabled,
    },
  })
}

// Offense Queries
const offenseUrl = "/attendance/offenses/"

export function useOffense(id: string) {
  return useApiQuery<Offense>({
    queryKey: ["offense", id],
    url: `${offenseUrl}${id}/`,
    options: {
      enabled: !!id,
    },
  })
}

export function useOffenses(props: PaginatedFilterProps = {}) {
  return usePaginatedQuery<Offense>({
    ...props,
    url: offenseUrl,
    queryKeyBase: "offenses",
  })
}

export function useOffenseFilters() {
  return {
    filters: [
      {
        key: "offense_type",
        label: "Offense Type",
        options: [
          { label: "AWOL", value: "AWOL" },
          { label: "Late", value: "LATE" },
          { label: "Curfew", value: "CURFEW" },
          { label: "Other", value: "OTHER" },
        ],
      },
      {
        key: "severity_level",
        label: "Severity",
        options: [
          { label: "Warning", value: "WARNING" },
          { label: "Suspension", value: "SUSPENSION" },
          { label: "Termination", value: "TERMINATION" },
        ],
      },
    ],
    orderingOptions: [
      { label: "Date (Newest)", value: "-date" },
      { label: "Date (Oldest)", value: "date" },
      { label: "Employee (A-Z)", value: "employee__first_name" },
      { label: "Employee (Z-A)", value: "-employee__first_name" },
      { label: "Severity (High-Low)", value: "-severity_level" },
      { label: "Severity (Low-High)", value: "severity_level" },
    ],
  }
}

export function useMyOffenses() {
  return useApiQuery<Offense[]>({
    queryKey: ["my-offenses"],
    url: `${offenseUrl}my_offenses/`,
  })
}

export function useOffenseStatistics(employeeId?: number, atLimit?: boolean) {
  const params = new URLSearchParams()
  if (employeeId) params.append("employee_id", employeeId.toString())
  if (atLimit) params.append("at_limit", "true")

  return useApiQuery<OffenseStatistics[]>({
    queryKey: ["offense-statistics", employeeId, atLimit],
    url: `${offenseUrl}statistics/${params.toString() ? `?${params.toString()}` : ""}`,
  })
}

export function useEmployeeOffenseHistory(employeeId: number) {
  return useApiQuery<Offense[]>({
    queryKey: ["employee-offense-history", employeeId],
    url: `${offenseUrl}${employeeId}/offense_history/`,
    options: {
      enabled: !!employeeId,
    },
  })
}
