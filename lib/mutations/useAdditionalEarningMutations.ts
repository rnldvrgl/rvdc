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
  category:
    | "bonus"
    | "commission"
    | "tip"
    | "performance"
    | "installation_pct"
    | "allowance"
    | "other"
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
  category:
    | "bonus"
    | "commission"
    | "tip"
    | "performance"
    | "installation_pct"
    | "allowance"
    | "other"
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
    usePromiseToast: true,
    loadingMessage: "Creating additional earning...",
    invalidateQueries: [
      { queryKey: ["additional-earnings"] },
      { queryKey: ["payroll", "weekly-payroll"] },
    ],
    onSuccess: async () => {
      // If payrollId is provided, auto-recompute the payroll to include the new earning
      if (payrollId) {
        try {
          const { data } = await api.post(
            `/payroll/weekly-payrolls/${payrollId}/recompute/`,
            {},
          )
          
          // Invalidate and refetch all related queries aggressively
          await queryClient.invalidateQueries({
            queryKey: ["payroll", "weekly-payrolls"],
            refetchType: "active",
          })

          await queryClient.invalidateQueries({
            queryKey: ["payroll", "weekly-payroll", payrollId],
            refetchType: "active",
          })

          // Also set the query data directly to ensure immediate update
          queryClient.setQueryData(["payroll", "weekly-payroll", payrollId], data)
          
          toast.success("Payroll recalculated with new earning")
        } catch (error) {
          toast.error("Failed to recalculate payroll. Please try manually.")
          console.error("Recompute error:", error)
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
      { queryKey: ["payroll", "weekly-payroll"] },
    ],
  })
}

export const useDeleteAdditionalEarning = (payrollId?: number) => {
  const queryClient = useQueryClient()

  return useApiMutation<number, unknown>({
    mutationFn: (id) => api.delete(`/payroll/additional-earnings/${id}/`),
    successMessage: "Additional earning deleted successfully",
    usePromiseToast: true,
    loadingMessage: "Deleting additional earning...",
    invalidateQueries: [
      { queryKey: ["additional-earnings"] },
      { queryKey: ["payroll", "weekly-payroll"] },
    ],
    onSuccess: async () => {
      // If payrollId is provided, auto-recompute the payroll to update totals
      if (payrollId) {
        try {
          const { data } = await api.post(
            `/payroll/weekly-payrolls/${payrollId}/recompute/`,
            {},
          )
          
          // Invalidate and refetch all related queries aggressively
          await queryClient.invalidateQueries({
            queryKey: ["payroll", "weekly-payrolls"],
            refetchType: "active",
          })

          await queryClient.invalidateQueries({
            queryKey: ["payroll", "weekly-payroll", payrollId],
            refetchType: "active",
          })

          // Also set the query data directly to ensure immediate update
          queryClient.setQueryData(["payroll", "weekly-payroll", payrollId], data)
          
          toast.success("Payroll recalculated after deletion")
        } catch (error) {
          toast.error("Failed to recalculate payroll. Please try manually.")
          console.error("Recompute error:", error)
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
      { queryKey: ["payroll", "weekly-payroll"] },
    ],
  })
}
