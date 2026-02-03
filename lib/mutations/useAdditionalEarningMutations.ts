import { useApiMutation } from "@/lib/hooks/useApiMutation"
import api from "@/lib/utils/api"
import { useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"

export interface AdditionalEarning {
  id: number
  employee: number
  employee_detail?: {
    id: number
    username: string
    first_name: string
    last_name: string
  }
  earning_date: string
  category: "installation_pct" | "custom"
  amount: string | number
  description: string
  reference: string
  approved: boolean
  is_deleted: boolean
  created_at: string
  updated_at: string
}

export interface AdditionalEarningFormData {
  employee: number
  earning_date: string
  category: "installation_pct" | "custom"
  amount: number
  description?: string
  reference?: string
  approved?: boolean
}

export const useCreateAdditionalEarning = (payrollId?: number) => {
  const queryClient = useQueryClient()

  return useApiMutation<AdditionalEarningFormData, AdditionalEarning>({
    mutationFn: (data) => api.post("/payroll/additional-earnings/", data),
    successMessage: "Additional earning created successfully",
    invalidateQueries: [
      { queryKey: ["additional-earnings"] },
      { queryKey: ["weekly-payroll"] },
    ],
    onSuccess: async () => {
      // If payrollId is provided, auto-recompute the payroll to include the new earning
      if (payrollId) {
        try {
          await api.post(`/payroll/weekly-payrolls/${payrollId}/recompute/`, {})
          // Invalidate the specific payroll query to refresh the UI
          await queryClient.invalidateQueries({
            queryKey: ["payroll", "weekly-payroll", payrollId],
          })
          toast.success("Payroll recalculated with new earning")
        } catch {
          // error is handled by mutation
        }
      }
    },
  })
}

export const useUpdateAdditionalEarning = () => {
  return useApiMutation<
    { id: number } & Partial<AdditionalEarningFormData>,
    AdditionalEarning
  >({
    mutationFn: ({ id, ...data }) =>
      api.patch(`/payroll/additional-earnings/${id}/`, data),
    successMessage: "Additional earning updated successfully",
    invalidateQueries: [
      { queryKey: ["additional-earnings"] },
      { queryKey: ["additional-earning"] },
      { queryKey: ["weekly-payroll"] },
    ],
  })
}

export const useDeleteAdditionalEarning = (payrollId?: number) => {
  const queryClient = useQueryClient()

  return useApiMutation<number, unknown>({
    mutationFn: (id) => api.delete(`/payroll/additional-earnings/${id}/`),
    successMessage: "Additional earning deleted successfully",
    invalidateQueries: [
      { queryKey: ["additional-earnings"] },
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

export const useApproveAdditionalEarning = () => {
  return useApiMutation<{ id: number; approved: boolean }, AdditionalEarning>({
    mutationFn: ({ id, approved }) =>
      api.patch(`/payroll/additional-earnings/${id}/`, { approved }),
    successMessage: "Additional earning status updated successfully",
    invalidateQueries: [
      { queryKey: ["additional-earnings"] },
      { queryKey: ["additional-earning"] },
      { queryKey: ["weekly-payroll"] },
    ],
  })
}
