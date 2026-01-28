"use client"

import type {
  DailyAttendance,
  LeaveBalance,
  LeaveRequest,
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
  return useApiQuery<DailyAttendance | null>({
    queryKey: ["current-attendance-status"],
    url: `${attendanceUrl}/current_status`,
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

export function useMyLeaveBalance() {
  return useApiQuery<LeaveBalance>({
    queryKey: ["my-leave-balance"],
    url: `${leaveBalanceUrl}my_balance/`,
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

export function useLeaveRequests(props: PaginatedFilterProps = {}) {
  return usePaginatedQuery<LeaveRequest>({
    ...props,
    url: leaveRequestUrl,
    queryKeyBase: "leave-requests",
  })
}

export function usePendingLeaveApprovals() {
  return useApiQuery<LeaveRequest[]>({
    queryKey: ["pending-leave-approvals"],
    url: `${leaveRequestUrl}pending_approvals/`,
  })
}
