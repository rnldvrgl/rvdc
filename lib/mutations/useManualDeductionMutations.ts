import { useApiMutation } from "@/lib/hooks/useApiMutation"
import type {
  ManualDeduction,
  ManualDeductionFormData,
} from "@/lib/schemas/manualDeductionSchema"
import api from "@/lib/utils/api"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"

export const useCreateManualDeduction = (payrollId?: number) => {
  const queryClient = useQueryClient()

  return useApiMutation<ManualDeductionFormData, ManualDeduction>({
    mutationFn: (data) => api.post("/payroll/manual-deductions/", data),
    successMessage: "Manual deduction created successfully",
    invalidateQueries: [
      { queryKey: ["manual-deductions"] },
      { queryKey: ["weekly-payroll"] },
    ],
    onSuccess: async () => {
      // If payrollId is provided, auto-recompute the payroll to include the new deduction
      if (payrollId) {
        try {
          await api.post(`/payroll/weekly-payrolls/${payrollId}/recompute/`, {})
          // Invalidate the specific payroll query to refresh the UI
          await queryClient.invalidateQueries({
            queryKey: ["payroll", "weekly-payroll", payrollId],
          })
          toast.success("Payroll recalculated with new deduction")
        } catch {
          // error is handled by mutation
        }
      }
    },
  })
}

export const useUpdateManualDeduction = () => {
  return useApiMutation<
    { id: number } & Partial<ManualDeductionFormData>,
    ManualDeduction
  >({
    mutationFn: ({ id, ...data }) =>
      api.patch(`/payroll/manual-deductions/${id}/`, data),
    successMessage: "Manual deduction updated successfully",
    invalidateQueries: [
      { queryKey: ["manual-deductions"] },
      { queryKey: ["manual-deduction"] },
      { queryKey: ["weekly-payroll"] },
    ],
  })
}

export const useToggleDeduction = () => {
  return useApiMutation<{ id: number; is_active: boolean }, ManualDeduction>({
    mutationFn: ({ id, is_active }) =>
      api.patch(`/payroll/manual-deductions/${id}/`, { is_active }),
    successMessage: "Deduction status updated successfully",
    invalidateQueries: [
      { queryKey: ["manual-deductions"] },
      { queryKey: ["manual-deduction"] },
      { queryKey: ["weekly-payroll"] },
    ],
  })
}

export const useDeleteManualDeduction = (payrollId?: number) => {
  const queryClient = useQueryClient()

  return useApiMutation<number, unknown>({
    mutationFn: (id) => api.delete(`/payroll/manual-deductions/${id}/`),
    successMessage: "Manual deduction deleted successfully",
    invalidateQueries: [
      { queryKey: ["manual-deductions"] },
      { queryKey: ["weekly-payroll"] },
    ],
    onSuccess: async () => {
      // If payrollId is provided, auto-recompute the payroll to update totals
      if (payrollId) {
        try {
          await api.post(`/payroll/weekly-payrolls/${payrollId}/recompute/`, {})
          // Invalidate the specific payroll query to refresh the UI
          await queryClient.invalidateQueries({
            queryKey: ["payroll", "weekly-payroll", payrollId],
          })
          toast.success("Payroll recalculated after deletion")
        } catch {
          // error is handled by mutation
        }
      }
    },
  })
}

export const useActivateManualDeduction = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (id: number) => {
      const response = await api.post(
        `/payroll/manual-deductions/${id}/activate/`,
      )
      return response.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["manual-deductions"] })
      queryClient.invalidateQueries({ queryKey: ["manual-deduction"] })
      queryClient.invalidateQueries({ queryKey: ["weekly-payroll"] })
      toast.success("Deduction activated successfully")
    },
    onError: (error: unknown) => {
      const err = error as { response?: { data?: { detail?: string } } }
      toast.error(err.response?.data?.detail || "Failed to activate deduction")
    },
  })
}

export const useDeactivateManualDeduction = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (id: number) => {
      const response = await api.post(
        `/payroll/manual-deductions/${id}/deactivate/`,
      )
      return response.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["manual-deductions"] })
      queryClient.invalidateQueries({ queryKey: ["manual-deduction"] })
      queryClient.invalidateQueries({ queryKey: ["weekly-payroll"] })
      toast.success("Deduction deactivated successfully")
    },
    onError: (error: unknown) => {
      const err = error as { response?: { data?: { detail?: string } } }
      toast.error(
        err.response?.data?.detail || "Failed to deactivate deduction",
      )
    },
  })
}
