import { useApiMutation } from "@/lib/hooks/useApiMutation"
import type { EmployeeBenefitOverride } from "@/lib/schemas/employeeBenefitOverrideSchema"
import api from "@/lib/utils/api"

const baseUrl = "/payroll/employee-benefit-overrides/"

// API payload type - dates as strings
type EmployeeBenefitOverridePayload = Omit<
  EmployeeBenefitOverride,
  | "id"
  | "created_at"
  | "updated_at"
  | "created_by"
  | "employee_name"
  | "benefit_type_display"
>

export function useEmployeeBenefitOverrideMutations() {
  const createOverride = useApiMutation({
    mutationFn: (data: EmployeeBenefitOverridePayload) =>
      api.post(baseUrl, data),
    successMessage: "Benefit override created successfully.",
    invalidateQueries: [
      { queryKey: ["employee-benefit-overrides"] },
      { queryKey: ["employee-choices"] },
    ],
  })

  const updateOverride = useApiMutation({
    mutationFn: ({
      id,
      data,
    }: {
      id: number
      data: EmployeeBenefitOverridePayload
    }) => api.patch(`${baseUrl}${id}/`, data),
    successMessage: "Benefit override updated successfully.",
    invalidateQueries: [
      { queryKey: ["employee-benefit-overrides"] },
      { queryKey: ["employee-choices"] },
    ],
  })

  const deleteOverride = useApiMutation({
    mutationFn: (id) => api.delete(`${baseUrl}${id}/`),
    successMessage: "Benefit override deleted successfully.",
    invalidateQueries: [
      { queryKey: ["employee-benefit-overrides"] },
      { queryKey: ["employee-choices"] },
    ],
  })

  return {
    createOverride,
    updateOverride,
    deleteOverride,
  }
}
