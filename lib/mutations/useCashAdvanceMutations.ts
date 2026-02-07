import type { CashAdvance, CashAdvancePayload } from "@/lib/constants/interface"
import { useApiMutation } from "@/lib/hooks/useApiMutation"
import api from "@/lib/utils/api"

const baseUrl = "/users/cash-advances/"

export const useCashAdvanceMutations = () => {
  const createCashAdvance = useApiMutation<CashAdvancePayload, CashAdvance>({
    mutationFn: (data) => api.post(baseUrl, data),
    successMessage: "Cash advance recorded successfully",
    invalidateQueries: [
      { queryKey: ["cash-advances"] },
      { queryKey: ["employees"] },
      { queryKey: ["users"] },
    ],
  })

  const updateCashAdvance = useApiMutation<
    { id: number; data: Partial<CashAdvancePayload> },
    CashAdvance
  >({
    mutationFn: ({ id, data }) => api.patch(`${baseUrl}${id}/`, data),
    successMessage: "Cash advance updated successfully",
    invalidateQueries: [
      { queryKey: ["cash-advances"] },
      { queryKey: ["employees"] },
      { queryKey: ["users"] },
    ],
  })

  const deleteCashAdvance = useApiMutation<number, unknown>({
    mutationFn: (id) => api.delete(`${baseUrl}${id}/`),
    successMessage: "Cash advance deleted and balance restored",
    invalidateQueries: [
      { queryKey: ["cash-advances"] },
      { queryKey: ["employees"] },
      { queryKey: ["users"] },
    ],
  })

  return {
    createCashAdvance,
    updateCashAdvance,
    deleteCashAdvance,
  }
}
