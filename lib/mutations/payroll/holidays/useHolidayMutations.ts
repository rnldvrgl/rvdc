"use client"

/**
 * Holidays mutations module
 *
 * This file centralizes per-URL mutations for Holidays and re-exports
 * the hooks from the core payroll mutations module. This keeps call sites
 * simple and aligns with the "separated per URL links" pattern.
 *
 * Endpoints covered:
 * - /payroll/holidays/
 *
 * Usage examples:
 * import {
 *   useCreateHoliday,
 *   useUpdateHoliday,
 *   useDeleteHoliday,
 * } from "@/lib/mutations/payroll/holidays/useHolidayMutations";
 *
 * // or use the grouped accessor:
 * const {
 *   createHoliday,
 *   updateHoliday,
 *   deleteHoliday,
 * } = useHolidayMutations();
 */

import { useApiMutation } from "@/lib/hooks/useApiMutation"
import api from "@/lib/utils/api"

export {
  useCreateHoliday,
  useDeleteHoliday,
  useUpdateHoliday,
} from "@/lib/mutations/payroll/usePayrollMutations"

import {
  useCreateHoliday as _useCreateHoliday,
  useDeleteHoliday as _useDeleteHoliday,
  useUpdateHoliday as _useUpdateHoliday,
} from "@/lib/mutations/payroll/usePayrollMutations"
import type { ID } from "@/lib/queries/usePayroll"

/**
 * Optional grouped accessor if you prefer a single hook to obtain
 * all holiday mutations at once.
 */
export function useHolidayMutations() {
  const createHoliday = _useCreateHoliday()
  const updateHoliday = (id: ID) => _useUpdateHoliday(id)
  const deleteHoliday = (id: ID) => _useDeleteHoliday(id)

  const bulkPreview = useApiMutation<FormData, unknown>({
    mutationFn: (formData) =>
      api.post("/payroll/holidays/bulk-preview/", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      }),
    usePromiseToast: true,
    loadingMessage: "Analyzing file...",
  })

  const bulkUpdate = useApiMutation<FormData, unknown>({
    mutationFn: (formData) =>
      api.post("/payroll/holidays/bulk-update/", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      }),
    usePromiseToast: true,
    loadingMessage: "Processing bulk update...",
    successMessage: "Bulk update started. You will be notified when it's done.",
    invalidateQueries: [{ queryKey: ["holidays"] }],
  })

  return {
    createHoliday,
    updateHoliday,
    deleteHoliday,
    bulkPreview,
    bulkUpdate,
  }
}
