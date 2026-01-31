"use client";

/**
 * Additional Earnings mutations module
 *
 * This file centralizes per-URL mutations for Additional Earnings and re-exports
 * the hooks from the core payroll mutations module. This keeps call sites
 * simple and aligns with the "separated per URL links" pattern.
 *
 * Endpoints covered:
 * - /payroll/additional-earnings/
 *
 * Usage examples:
 * import {
 *   useCreateAdditionalEarning,
 *   useUpdateAdditionalEarning,
 *   useDeleteAdditionalEarning,
 * } from "@/lib/mutations/payroll/additionalEarnings/useAdditionalEarningMutations";
 *
 * // or use the grouped accessor:
 * const {
 *   createAdditionalEarning,
 *   updateAdditionalEarning,
 *   deleteAdditionalEarning,
 * } = useAdditionalEarningMutations();
 */

export {
  useCreateAdditionalEarning,
  useUpdateAdditionalEarning,
  useDeleteAdditionalEarning,
} from "@/lib/mutations/payroll/usePayrollMutations";

import type { ID } from "@/lib/queries/usePayroll";
import {
  useCreateAdditionalEarning as _useCreateAdditionalEarning,
  useUpdateAdditionalEarning as _useUpdateAdditionalEarning,
  useDeleteAdditionalEarning as _useDeleteAdditionalEarning,
} from "@/lib/mutations/payroll/usePayrollMutations";

/**
 * Optional grouped accessor if you prefer a single hook to obtain
 * all additional-earning mutations at once.
 */
export function useAdditionalEarningMutations() {
  const createAdditionalEarning = _useCreateAdditionalEarning();
  const updateAdditionalEarning = (id: ID) => _useUpdateAdditionalEarning(id);
  const deleteAdditionalEarning = (id: ID) => _useDeleteAdditionalEarning(id);

  return {
    createAdditionalEarning,
    updateAdditionalEarning,
    deleteAdditionalEarning,
  };
}
