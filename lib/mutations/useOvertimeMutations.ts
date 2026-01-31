import { useApiMutation } from "@/lib/hooks/useApiMutation"
import type { OvertimeRequest } from "@/lib/queries/useOvertimeRequests"
import api from "@/lib/utils/api"

/**
 * Create overtime request input
 */
export type CreateOvertimeRequestInput = {
  employee: number
  date: string
  time_start: string
  time_end: string
  reason?: string
}

/**
 * Update overtime request input
 */
export type UpdateOvertimeRequestInput = {
  id: number
  date?: string
  time_start?: string
  time_end?: string
  reason?: string
}

/**
 * Approve overtime request input
 */
export type ApproveOvertimeRequestInput = {
  id: number
  approved: boolean
}

/**
 * Hook to create a new overtime request
 */
export function useCreateOvertimeRequest() {
  return useApiMutation<CreateOvertimeRequestInput, OvertimeRequest>({
    mutationFn: (input) => api.post("/attendance/overtime-requests/", input),
    successMessage: "Overtime request submitted successfully",
    invalidateQueries: [{ queryKey: ["attendance", "overtime-requests"] }],
  })
}

/**
 * Hook to update an overtime request
 */
export function useUpdateOvertimeRequest() {
  return useApiMutation<UpdateOvertimeRequestInput, OvertimeRequest>({
    mutationFn: ({ id, ...input }) =>
      api.patch(`/attendance/overtime-requests/${id}/`, input),
    successMessage: "Overtime request updated successfully",
    invalidateQueries: [{ queryKey: ["attendance", "overtime-requests"] }],
  })
}

/**
 * Hook to approve/reject an overtime request
 */
export function useApproveOvertimeRequest() {
  return useApiMutation<ApproveOvertimeRequestInput, OvertimeRequest>({
    mutationFn: ({ id, approved }) =>
      api.patch(`/attendance/overtime-requests/${id}/approve/`, { approved }),
    successMessage: "Overtime request status updated successfully",
    invalidateQueries: [{ queryKey: ["attendance", "overtime-requests"] }],
  })
}

/**
 * Hook to delete an overtime request
 */
export function useDeleteOvertimeRequest() {
  return useApiMutation<number, void>({
    mutationFn: (id) => api.delete(`/attendance/overtime-requests/${id}/`),
    successMessage: "Overtime request deleted successfully",
    invalidateQueries: [{ queryKey: ["attendance", "overtime-requests"] }],
  })
}
