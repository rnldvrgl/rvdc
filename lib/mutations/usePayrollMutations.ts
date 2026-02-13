"use client"
import type { WeeklyPayroll } from "@/lib/constants/types"
import { useApiMutation } from "@/lib/hooks/useApiMutation"
import api from "@/lib/utils/api"

const PAYROLL_BASE = "/payroll"
const WEEKLY_PAYROLLS = `${PAYROLL_BASE}/weekly-payrolls/`

export interface GeneratePayrollInput {
  employee_id: number
  week_start?: string
  week_end?: string
  notes?: string
  include_unapproved?: boolean
}

export interface PreviewPayrollInput {
  employee_id: number
  include_unapproved?: boolean
}

export interface PreviewPayrollResponse {
  employee: {
    id: number
    full_name: string
    basic_salary: number
  }
  week_start: string
  week_end: string
  hourly_rate: number
  regular_hours: number
  overtime_multiplier: number
  approved_ot_hours: number
  approved_night_diff_hours: number
  base_pay: number
  additional_earnings: number
  gross_pay: number
  deductions: Record<string, number>
  total_deductions: number
  net_pay: number
  attendance_breakdown: Array<{
    date: string
    attendance_type: string
    paid_hours: number
    regular_hours: number
    overtime_hours: number
    late_penalty: number
  }>
}

export interface UpdateStatusInput {
  id: number
  status: "draft" | "approved" | "paid" | "received"
}

export interface BulkGeneratePayrollInput {
  employee_ids?: number[]
  week_start?: string
  week_end?: string
  notes?: string
  include_unapproved?: boolean
}

export interface BulkGeneratePayrollResponse {
  week_start: string
  week_end: string
  created_count: number
  skipped_count: number
  error_count: number
  created: WeeklyPayroll[]
  skipped: Array<{
    employee_id: number
    employee_name: string
    reason: string
  }>
  errors: Array<{
    employee_id: number
    employee_name: string
    error: string
  }>
}

export interface MarkReceivedInput {
  id: number
}

export interface DisputePayrollInput {
  id: number
  reason: string
}

export interface BulkUpdateStatusInput {
  payroll_ids: number[]
  status: "draft" | "approved" | "paid"
}

/**
 * Mutations for Weekly Payroll operations
 */
export function usePayrollMutations() {
  // Generate payroll
  const generatePayroll = useApiMutation<GeneratePayrollInput, WeeklyPayroll>({
    mutationFn: (data) => api.post(`${WEEKLY_PAYROLLS}generate/`, data),
    successMessage: "Payroll generated successfully.",
    invalidateQueries: [{ queryKey: ["payroll", "weekly-payrolls"] }],
  })

  // Preview payroll (dry-run)
  const previewPayroll = useApiMutation<
    PreviewPayrollInput,
    PreviewPayrollResponse
  >({
    mutationFn: (data) => api.post(`${WEEKLY_PAYROLLS}preview/`, data),
    successMessage: undefined, // No toast for preview
    invalidateQueries: undefined, // No cache invalidation for preview
  })

  // Update payroll status
  const updateStatus = useApiMutation<UpdateStatusInput, WeeklyPayroll>({
    mutationFn: ({ id, status }) =>
      api.patch(`${WEEKLY_PAYROLLS}${id}/status/`, { status }),
    successMessage: "Payroll status updated successfully.",
    invalidateQueries: [
      { queryKey: ["payroll", "weekly-payrolls"] },
      { queryKey: ["payroll", "weekly-payroll"] },
    ],
  })

  // Update payroll (basic fields)
  const updatePayroll = useApiMutation<
    { id: number; data: Partial<WeeklyPayroll> },
    WeeklyPayroll
  >({
    mutationFn: ({ id, data }) => api.patch(`${WEEKLY_PAYROLLS}${id}/`, data),
    successMessage: "Payroll updated successfully.",
    invalidateQueries: [
      { queryKey: ["payroll", "weekly-payrolls"] },
      { queryKey: ["payroll", "weekly-payroll"] },
    ],
  })

  // Delete payroll
  const deletePayroll = useApiMutation<number, unknown>({
    mutationFn: (id) => api.delete(`${WEEKLY_PAYROLLS}${id}/`),
    successMessage: "Payroll deleted.",
    invalidateQueries: [{ queryKey: ["payroll", "weekly-payrolls"] }],
  })

  // Bulk generate payroll
  const bulkGeneratePayroll = useApiMutation<
    BulkGeneratePayrollInput,
    BulkGeneratePayrollResponse
  >({
    mutationFn: (data) => api.post(`${WEEKLY_PAYROLLS}bulk-generate/`, data),
    successMessage: "Bulk payroll generation completed.",
    invalidateQueries: [{ queryKey: ["payroll", "weekly-payrolls"] }],
  })

  // Mark as received
  const markAsReceived = useApiMutation<MarkReceivedInput, WeeklyPayroll>({
    mutationFn: ({ id }) =>
      api.post(`${WEEKLY_PAYROLLS}${id}/mark-received/`, {}),
    successMessage: "Payroll marked as received.",
    invalidateQueries: [
      { queryKey: ["payroll", "weekly-payrolls"] },
      { queryKey: ["payroll", "weekly-payroll"] },
    ],
  })

  // Dispute payroll
  const disputePayroll = useApiMutation<DisputePayrollInput, WeeklyPayroll>({
    mutationFn: ({ id, reason }) =>
      api.post(`${WEEKLY_PAYROLLS}${id}/dispute/`, { reason }),
    successMessage: "Payroll dispute submitted.",
    invalidateQueries: [
      { queryKey: ["payroll", "weekly-payrolls"] },
      { queryKey: ["payroll", "weekly-payroll"] },
    ],
  })

  // Bulk update status
  const bulkUpdateStatus = useApiMutation<
    BulkUpdateStatusInput,
    { updated_count: number; status: string }
  >({
    mutationFn: (data) =>
      api.patch(`${WEEKLY_PAYROLLS}bulk-update-status/`, data),
    successMessage: "Payroll statuses updated successfully.",
    invalidateQueries: [{ queryKey: ["payroll", "weekly-payrolls"] }],
  })

  return {
    generatePayroll,
    previewPayroll,
    updateStatus,
    updatePayroll,
    deletePayroll,
    bulkGeneratePayroll,
    markAsReceived,
    disputePayroll,
    bulkUpdateStatus,
  }
}
