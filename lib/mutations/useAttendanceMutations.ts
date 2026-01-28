"use client"

import {
  ApproveAttendancePayload,
  ApproveLeavePayload,
  ClockInPayload,
  ClockOutPayload,
  LeaveRequestPayload,
  RejectAttendancePayload,
  RejectLeavePayload,
} from "@/lib/constants/types"
import { useApiMutation } from "@/lib/hooks/useApiMutation"
import api from "@/lib/utils/api"
import { useQueryClient } from "@tanstack/react-query"

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
    successMessage: "Employee clocked in successfully.",
    invalidateQueries: sharedInvalidations,
  })

  const clockOut = useApiMutation({
    mutationFn: (data: ClockOutPayload) =>
      api.post(`${attendanceUrl}clock_out/`, data),
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

  return {
    clockIn,
    clockOut,
    approveAttendance,
    rejectAttendance,
    updateAttendance,
    deleteAttendance,
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
  ]

  const createLeaveRequest = useApiMutation({
    mutationFn: (data: LeaveRequestPayload) => api.post(leaveRequestUrl, data),
    successMessage: "Leave request submitted successfully.",
    invalidateQueries: sharedInvalidations,
  })

  const approveLeave = useApiMutation({
    mutationFn: (data: ApproveLeavePayload) =>
      api.post(`${leaveRequestUrl}approve/`, data),
    successMessage: "Leave request(s) approved successfully.",
    invalidateQueries: sharedInvalidations,
    onSuccess: (_, payload) => {
      // Invalidate individual leave requests
      payload.leave_request_ids.forEach((id) => {
        queryClient.invalidateQueries({
          queryKey: ["leave-request", `${id}`],
        })
      })
    },
  })

  const rejectLeave = useApiMutation({
    mutationFn: (data: RejectLeavePayload) =>
      api.post(`${leaveRequestUrl}reject/`, data),
    successMessage: "Leave request(s) rejected successfully.",
    invalidateQueries: sharedInvalidations,
    onSuccess: (_, payload) => {
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

  return {
    createLeaveRequest,
    approveLeave,
    rejectLeave,
    cancelLeave,
    updateLeaveRequest,
    deleteLeaveRequest,
  }
}
