"use client";

/**
 * Weekly Payroll mutations module
 *
 * This file centralizes per-URL mutations for Weekly Payrolls and re-exports
 * the hooks from the core payroll mutations module. This keeps call sites
 * simple and aligns with the "separated per URL links" pattern.
 *
 * Endpoints covered:
 * - /payroll/weekly-payrolls/
 * - /payroll/weekly-payrolls/{id}/recompute/
 *
 * Usage examples:
 * import {
 *   useCreateWeeklyPayroll,
 *   useUpdateWeeklyPayroll,
 *   useDeleteWeeklyPayroll,
 *   useRecomputeWeeklyPayroll,
 * } from "@/lib/mutations/payroll/weeklyPayrolls/useWeeklyPayrollMutations";
 *
 * // or use the grouped accessor:
 * const {
 *   createWeeklyPayroll,
 *   updateWeeklyPayroll,
 *   deleteWeeklyPayroll,
 *   recomputeWeeklyPayroll,
 * } = useWeeklyPayrollMutations();
 */

export {
  useCreateWeeklyPayroll,
  useUpdateWeeklyPayroll,
  useDeleteWeeklyPayroll,
  useRecomputeWeeklyPayroll,
} from "@/lib/mutations/payroll/usePayrollMutations";

import type { ID } from "@/lib/queries/usePayroll";
import {
  useCreateWeeklyPayroll as _useCreateWeeklyPayroll,
  useUpdateWeeklyPayroll as _useUpdateWeeklyPayroll,
  useDeleteWeeklyPayroll as _useDeleteWeeklyPayroll,
  useRecomputeWeeklyPayroll as _useRecomputeWeeklyPayroll,
} from "@/lib/mutations/payroll/usePayrollMutations";

/**
 * Optional grouped accessor if you prefer a single hook to obtain
 * all weekly payroll mutations at once.
 */
export function useWeeklyPayrollMutations() {
  const createWeeklyPayroll = _useCreateWeeklyPayroll();
  const updateWeeklyPayroll = (id: ID) => _useUpdateWeeklyPayroll(id);
  const deleteWeeklyPayroll = (id: ID) => _useDeleteWeeklyPayroll(id);
  const recomputeWeeklyPayroll = (id: ID) => _useRecomputeWeeklyPayroll(id);

  return {
    createWeeklyPayroll,
    updateWeeklyPayroll,
    deleteWeeklyPayroll,
    recomputeWeeklyPayroll,
  };
}
