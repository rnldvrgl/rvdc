import type { StockRequest } from "@/lib/constants/interface"
import { useApiMutation } from "@/lib/hooks/useApiMutation"
import api from "@/lib/utils/api"

const stockRequestUrl = "/inventory/stock-requests/"

const sharedInvalidations = [
  { queryKey: ["stock-requests"] },
  { queryKey: ["stock-requests", "pending-count"] },
  { queryKey: ["stall-stocks"] },
  { queryKey: ["services"] },
]

export function useApproveStockRequest() {
  return useApiMutation<number, StockRequest>({
    mutationFn: (id) => api.post(`${stockRequestUrl}${id}/approve/`),
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
