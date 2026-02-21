"use client"

import {
  ApproveAttendancePayload,
  ApproveLeavePayload,
  ClockInPayload,
  ClockOutPayload,
  LeaveRequestPayload,
  OffensePayload,
  RejectAttendancePayload,
  RejectLeavePayload,
  UpdateUniformPenaltiesPayload,
  ValidateLeaveBalancePayload,
  ValidateLeaveBalanceResponse,
} from "@/lib/constants/types"
import { useApiMutation } from "@/lib/hooks/useApiMutation"
import api from "@/lib/utils/api"
import { useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"

// Response types for leave approval/rejection
type LeaveApprovalResponse = {
  approved_count: number
  errors: Array<{
    leave_request_id: number
    error: string
  }>
}

type LeaveRejectionResponse = {
  rejected_count: number
  errors?: Array<{
    leave_request_id: number
    error: string
  }>
}

export function useAttendanceMutations() {
  const queryClient = useQueryClient()
  const attendanceUrl = "/attendance/daily-attendance/"

  const sharedInvalidations = [
    { queryKey: ["daily-attendances"] },
    { queryKey: ["pending-attendance-approvals"] },
    { queryKey: ["current-attendance-status"] },
  ]

  const clockIn = useApiMutation({
    mutationFn: (data: ClockInPayload) =>
      api.post(`${attendanceUrl}clock_in/`, data),
    usePromiseToast: true,
    loadingMessage: "Clocking in...",
    successMessage: "Employee clocked in successfully.",
    invalidateQueries: sharedInvalidations,
  })

  const clockOut = useApiMutation({
    mutationFn: (data: ClockOutPayload) =>
      api.post(`${attendanceUrl}clock_out/`, data),
    usePromiseToast: true,
    loadingMessage: "Clocking out...",
    successMessage: "Employee clocked out successfully.",
    invalidateQueries: sharedInvalidations,
    onSuccess: (_, payload) => {
      queryClient.invalidateQueries({
        queryKey: ["daily-attendance", `${payload.attendance_id}`],
      })
    },
  })

  const approveAttendance = useApiMutation({
    mutationFn: (data: ApproveAttendancePayload) =>
      api.post(`${attendanceUrl}approve/`, data),
    usePromiseToast: true,
    loadingMessage: "Approving attendance...",
    successMessage: "Attendance approved successfully.",
    invalidateQueries: sharedInvalidations,
    onSuccess: (_, payload) => {
      // Invalidate individual attendance records
      payload.attendance_ids.forEach((id) => {
        queryClient.invalidateQueries({
          queryKey: ["daily-attendance", `${id}`],
        })
      })
    },
  })

  const rejectAttendance = useApiMutation({
    mutationFn: (data: RejectAttendancePayload) =>
      api.post(`${attendanceUrl}reject/`, data),
    usePromiseToast: true,
    loadingMessage: "Rejecting attendance...",
    successMessage: "Attendance rejected successfully.",
    invalidateQueries: sharedInvalidations,
    onSuccess: (_, payload) => {
      // Invalidate individual attendance records
      payload.attendance_ids.forEach((id) => {
        queryClient.invalidateQueries({
          queryKey: ["daily-attendance", `${id}`],
        })
      })
    },
  })

  const updateAttendance = useApiMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<ClockInPayload> }) =>
      api.patch(`${attendanceUrl}${id}/`, data),
    successMessage: "Attendance updated successfully.",
    invalidateQueries: sharedInvalidations,
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({
        queryKey: ["daily-attendance", `${id}`],
      })
    },
  })

  const deleteAttendance = useApiMutation({
    mutationFn: (id: number) => api.delete(`${attendanceUrl}${id}/`),
    successMessage: "Attendance deleted successfully.",
    invalidateQueries: sharedInvalidations,
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({
        queryKey: ["daily-attendance", `${id}`],
      })
    },
  })

  const updateUniformPenalties = useApiMutation({
    mutationFn: ({
      id,
      data,
    }: {
      id: number
      data: UpdateUniformPenaltiesPayload
    }) => api.patch(`${attendanceUrl}${id}/update_uniform_penalties/`, data),
    successMessage: "Uniform penalties updated successfully.",
    invalidateQueries: sharedInvalidations,
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({
        queryKey: ["daily-attendance", `${id}`],
      })
    },
  })

  return {
    clockIn,
    clockOut,
    approveAttendance,
    rejectAttendance,
    updateAttendance,
    deleteAttendance,
    updateUniformPenalties,
  }
}

export function useLeaveRequestMutations() {
  const queryClient = useQueryClient()
  const leaveRequestUrl = "/attendance/leave-request/"

  const sharedInvalidations = [
    { queryKey: ["leave-requests"] },
    { queryKey: ["pending-leave-approvals"] },
    { queryKey: ["leave-balances"] },
    { queryKey: ["my-leave-balance"] },
    { queryKey: ["daily-attendances"] },
    { queryKey: ["calendar-events"] },
  ]

  const createLeaveRequest = useApiMutation({
    mutationFn: (data: LeaveRequestPayload) => api.post(leaveRequestUrl, data),
    successMessage: "Leave request submitted successfully.",
    invalidateQueries: sharedInvalidations,
  })

  const approveLeave = useApiMutation<
    ApproveLeavePayload,
    LeaveApprovalResponse
  >({
    mutationFn: (data: ApproveLeavePayload) =>
      api.post(`${leaveRequestUrl}approve/`, data),
    invalidateQueries: sharedInvalidations,
    onSuccess: (response, payload) => {
      // Show appropriate message based on response
      const approvedCount = response?.approved_count || 0
      const errors = response?.errors || []

      if (approvedCount > 0) {
        toast.success(
          `${approvedCount} leave request(s) approved successfully.`,
        )
      }

      if (errors.length > 0) {
        errors.forEach((error) => {
          toast.error(
            `Error approving request ${error.leave_request_id}: ${error.error}`,
          )
        })
      }

      // Invalidate individual leave requests
      payload.leave_request_ids.forEach((id) => {
        queryClient.invalidateQueries({
          queryKey: ["leave-request", `${id}`],
        })
      })
    },
  })

  const rejectLeave = useApiMutation<
    RejectLeavePayload,
    LeaveRejectionResponse
  >({
    mutationFn: (data: RejectLeavePayload) =>
      api.post(`${leaveRequestUrl}reject/`, data),
    invalidateQueries: sharedInvalidations,
    onSuccess: (response, payload) => {
      // Show appropriate message based on response
      const rejectedCount = response?.rejected_count || 0

      if (rejectedCount > 0) {
        toast.success(
          `${rejectedCount} leave request(s) rejected successfully.`,
        )
      }

      // Invalidate individual leave requests
      payload.leave_request_ids.forEach((id) => {
        queryClient.invalidateQueries({
          queryKey: ["leave-request", `${id}`],
        })
      })
    },
  })

  const cancelLeave = useApiMutation({
    mutationFn: (id: number) => api.post(`${leaveRequestUrl}${id}/cancel/`),
    successMessage: "Leave request cancelled successfully.",
    invalidateQueries: sharedInvalidations,
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({
        queryKey: ["leave-request", `${id}`],
      })
    },
  })

  const updateLeaveRequest = useApiMutation({
    mutationFn: ({
      id,
      data,
    }: {
      id: number
      data: Partial<LeaveRequestPayload>
    }) => api.patch(`${leaveRequestUrl}${id}/`, data),
    successMessage: "Leave request updated successfully.",
    invalidateQueries: sharedInvalidations,
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({
        queryKey: ["leave-request", `${id}`],
      })
    },
  })

  const deleteLeaveRequest = useApiMutation({
    mutationFn: (id: number) => api.delete(`${leaveRequestUrl}${id}/`),
    successMessage: "Leave request deleted successfully.",
    invalidateQueries: sharedInvalidations,
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({
        queryKey: ["leave-request", `${id}`],
      })
    },
  })

  const validateLeaveBalance = useApiMutation<
    ValidateLeaveBalancePayload,
    ValidateLeaveBalanceResponse
  >({
    mutationFn: (data: ValidateLeaveBalancePayload) =>
      api.post(`${leaveRequestUrl}validate_leave_balance/`, data),
  })

  return {
    createLeaveRequest,
    approveLeave,
    rejectLeave,
    cancelLeave,
    updateLeaveRequest,
    deleteLeaveRequest,
    validateLeaveBalance,
  }
}

export function useOffenseMutations() {
  const queryClient = useQueryClient()
  const offenseUrl = "/attendance/offenses/"

  const sharedInvalidations = [
    { queryKey: ["offenses"] },
    { queryKey: ["my-offenses"] },
    { queryKey: ["offense-statistics"] },
    { queryKey: ["employee-offense-history"] },
  ]

  const createOffense = useApiMutation({
    mutationFn: (data: OffensePayload) => api.post(offenseUrl, data),
    successMessage: "Offense recorded successfully.",
    invalidateQueries: sharedInvalidations,
  })

  const updateOffense = useApiMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<OffensePayload> }) =>
      api.patch(`${offenseUrl}${id}/`, data),
    successMessage: "Offense updated successfully.",
    invalidateQueries: sharedInvalidations,
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({
        queryKey: ["offense", `${id}`],
      })
    },
  })

  const deleteOffense = useApiMutation({
    mutationFn: (id: number) => api.delete(`${offenseUrl}${id}/`),
    successMessage: "Offense deleted successfully.",
    invalidateQueries: sharedInvalidations,
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({
        queryKey: ["offense", `${id}`],
      })
    },
  })

  return {
    createOffense,
    updateOffense,
    deleteOffense,
  }
}
