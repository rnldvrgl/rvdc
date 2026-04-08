import type { DirectStockRequestBatch, DirectStockRequestBatchPayload, StockRequest } from "@/lib/constants/interface"
import { useApiMutation } from "@/lib/hooks/useApiMutation"
import api from "@/lib/utils/api"

const stockRequestUrl = "/inventory/stock-requests/"
const directBatchUrl = "/inventory/direct-stock-batches/"

const sharedInvalidations = [
  { queryKey: ["stock-requests"] },
  { queryKey: ["stock-requests", "pending-count"] },
  { queryKey: ["stall-stocks"] },
  { queryKey: ["services"] },
  { queryKey: ["direct-stock-batches"] },
]

export function useApproveStockRequest() {
  return useApiMutation<{ id: number; approved_quantity?: number }, StockRequest>({
    mutationFn: ({ id, approved_quantity }) =>
      api.post(`${stockRequestUrl}${id}/approve/`, approved_quantity !== undefined ? { approved_quantity } : {}),
    successMessage: "Stock request approved successfully",
    invalidateQueries: sharedInvalidations,
  })
}

export function useDeclineStockRequest() {
  return useApiMutation<{ id: number; reason?: string }, StockRequest>({
    mutationFn: ({ id, reason }) =>
      api.post(`${stockRequestUrl}${id}/decline/`, { reason }),
    successMessage: "Stock request declined",
    invalidateQueries: sharedInvalidations,
  })
}

export function useBatchApproveStockRequests() {
  return useApiMutation<number[], { approved_count: number }>({
    mutationFn: (ids) => api.post(`${stockRequestUrl}batch-approve/`, { ids }),
    successMessage: "Stock requests approved successfully",
    invalidateQueries: sharedInvalidations,
  })
}

export function useCreateDirectStockBatch() {
  return useApiMutation<DirectStockRequestBatchPayload, DirectStockRequestBatch>({
    mutationFn: (payload) => api.post(directBatchUrl, payload),
    successMessage: "Stock request submitted successfully",
    invalidateQueries: sharedInvalidations,
  })
}

export function useCancelDirectStockBatch() {
  return useApiMutation<number, DirectStockRequestBatch>({
    mutationFn: (id) => api.post(`${directBatchUrl}${id}/cancel/`),
    successMessage: "Request cancelled",
    invalidateQueries: sharedInvalidations,
  })
}
