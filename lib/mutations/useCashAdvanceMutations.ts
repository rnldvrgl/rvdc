import type {
  CashAdvanceMovement,
  CashAdvanceMovementPayload,
} from "@/lib/constants/interface"
import { useApiMutation } from "@/lib/hooks/useApiMutation"
import api from "@/lib/utils/api"

const baseUrl = "/users/cash-advance-movements/"

export const useCashAdvanceMutations = () => {
  const createMovement = useApiMutation<
    CashAdvanceMovementPayload,
    CashAdvanceMovement
  >({
    mutationFn: (data) => api.post(baseUrl, data),
    successMessage: "Cash advance movement recorded successfully",
    invalidateQueries: [
      { queryKey: ["cash-advance-movements"] },
      { queryKey: ["employees"] },
      { queryKey: ["employee"] },
      { queryKey: ["users"] },
      { queryKey: ["weekly-payroll"] },
      { queryKey: ["payroll"] },
    ],
  })

  const updateMovement = useApiMutation<
    { id: number; data: Partial<CashAdvanceMovementPayload> },
    CashAdvanceMovement
  >({
    mutationFn: ({ id, data }) => api.patch(`${baseUrl}${id}/`, data),
    successMessage: "Cash advance movement updated successfully",
    invalidateQueries: [
      { queryKey: ["cash-advance-movements"] },
      { queryKey: ["employees"] },
      { queryKey: ["employee"] },
      { queryKey: ["users"] },
      { queryKey: ["weekly-payroll"] },
      { queryKey: ["payroll"] },
    ],
  })

  const deleteMovement = useApiMutation<number, unknown>({
    mutationFn: (id) => api.delete(`${baseUrl}${id}/`),
    successMessage: "Movement deleted and balance restored",
    invalidateQueries: [
      { queryKey: ["cash-advance-movements"] },
      { queryKey: ["employees"] },
      { queryKey: ["employee"] },
      { queryKey: ["users"] },
      { queryKey: ["weekly-payroll"] },
      { queryKey: ["payroll"] },
    ],
  })

  return {
    createMovement,
    updateMovement,
    deleteMovement,
  }
}
