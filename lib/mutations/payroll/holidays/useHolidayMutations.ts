"use client";

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

export {
  useCreateHoliday,
  useUpdateHoliday,
  useDeleteHoliday,
} from "@/lib/mutations/payroll/usePayrollMutations";

import type { ID } from "@/lib/queries/usePayroll";
import {
  useCreateHoliday as _useCreateHoliday,
  useUpdateHoliday as _useUpdateHoliday,
  useDeleteHoliday as _useDeleteHoliday,
} from "@/lib/mutations/payroll/usePayrollMutations";

/**
 * Optional grouped accessor if you prefer a single hook to obtain
 * all holiday mutations at once.
 */
export function useHolidayMutations() {
  const createHoliday = _useCreateHoliday();
  const updateHoliday = (id: ID) => _useUpdateHoliday(id);
  const deleteHoliday = (id: ID) => _useDeleteHoliday(id);

  return {
    createHoliday,
    updateHoliday,
    deleteHoliday,
  };
}
