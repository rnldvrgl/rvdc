import { useApiMutation } from "@/lib/hooks/useApiMutation"
import type {
  GovernmentBenefit,
  GovernmentBenefitFormData,
} from "@/lib/schemas/governmentBenefitSchema"
import api from "@/lib/utils/api"

export const useCreateGovernmentBenefit = () => {
  return useApiMutation<GovernmentBenefitFormData, GovernmentBenefit>({
    mutationFn: (data) => api.post("/payroll/government-benefits/", data),
    successMessage: "Government benefit created successfully",
    invalidateQueries: [{ queryKey: ["government-benefits"] }],
  })
}

export const useUpdateGovernmentBenefit = () => {
  return useApiMutation<
    { id: number; data: Partial<GovernmentBenefitFormData> },
    GovernmentBenefit
  >({
    mutationFn: ({ id, data }) =>
      api.patch(`/payroll/government-benefits/${id}/`, data),
    successMessage: "Government benefit updated successfully",
    invalidateQueries: [
      { queryKey: ["government-benefits"] },
      { queryKey: ["government-benefit"] },
    ],
  })
}

export const useToggleGovernmentBenefit = () => {
  return useApiMutation<{ id: number; is_active: boolean }, GovernmentBenefit>({
    mutationFn: ({ id, is_active }) =>
      api.patch(`/payroll/government-benefits/${id}/`, { is_active }),
    successMessage: "Benefit status updated successfully",
    invalidateQueries: [
      { queryKey: ["government-benefits"] },
      { queryKey: ["government-benefit"] },
    ],
  })
}

export const useDeleteGovernmentBenefit = () => {
  return useApiMutation<number, unknown>({
    mutationFn: (id) => api.delete(`/payroll/government-benefits/${id}/`),
    successMessage: "Government benefit deleted successfully",
    invalidateQueries: [{ queryKey: ["government-benefits"] }],
  })
}

export const useBulkToggleGovernmentBenefits = () => {
  return useApiMutation<{ ids: number[]; is_active: boolean }, unknown>({
    mutationFn: async ({ ids, is_active }) => {
      const promises = ids.map((id) =>
        api.patch(`/payroll/government-benefits/${id}/`, { is_active }),
      )
      await Promise.all(promises)
    },
    successMessage: "Benefits updated successfully",
    invalidateQueries: [{ queryKey: ["government-benefits"] }],
  })
}
