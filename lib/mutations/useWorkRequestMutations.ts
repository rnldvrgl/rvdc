import type { WorkRequest } from "@/lib/constants/types"
import { useApiMutation } from "@/lib/hooks/useApiMutation"
import api from "@/lib/utils/api"

export type CreateWorkRequestInput = {
  date: string
  reason?: string
}

export type ReviewWorkRequestInput = {
  id: number
  reason?: string
}

export type BatchWorkRequestInput = {
  ids: number[]
  reason?: string
}

const invalidateQueries = [
  { queryKey: ["attendance", "work-requests"] },
  { queryKey: ["attendance", "daily-attendance", "current-status"] },
]

export function useCreateWorkRequest() {
  return useApiMutation<CreateWorkRequestInput, WorkRequest>({
    mutationFn: (input) => api.post("/attendance/work-requests/", input),
    successMessage: "Work request submitted successfully",
    invalidateQueries,
  })
}

export function useApproveWorkRequest() {
  return useApiMutation<ReviewWorkRequestInput, WorkRequest>({
    mutationFn: ({ id }) =>
      api.post(`/attendance/work-requests/${id}/approve/`),
    successMessage: "Work request approved",
    invalidateQueries,
  })
}

export function useDeclineWorkRequest() {
  return useApiMutation<ReviewWorkRequestInput, WorkRequest>({
    mutationFn: ({ id, reason }) =>
      api.post(`/attendance/work-requests/${id}/decline/`, { reason }),
    successMessage: "Work request declined",
    invalidateQueries,
  })
}

export function useBatchApproveWorkRequests() {
  return useApiMutation<BatchWorkRequestInput, { approved_count: number }>({
    mutationFn: ({ ids }) =>
      api.post("/attendance/work-requests/batch-approve/", { ids }),
    successMessage: "Work requests approved",
    invalidateQueries,
  })
}

export function useBatchDeclineWorkRequests() {
  return useApiMutation<BatchWorkRequestInput, { declined_count: number }>({
    mutationFn: ({ ids, reason }) =>
      api.post("/attendance/work-requests/batch-decline/", { ids, reason }),
    successMessage: "Work requests declined",
    invalidateQueries,
  })
}
