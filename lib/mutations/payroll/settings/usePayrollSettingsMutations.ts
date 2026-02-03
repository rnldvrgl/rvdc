"use client";

/**
 * Payroll Settings mutations module
 *
 * This file centralizes per-URL mutations for Payroll Settings and re-exports
 * the hooks from the core payroll mutations module. This keeps call sites
 * simple and aligns with the "separated per URL links" pattern.
 *
 * Endpoints covered:
 * - /payroll/settings/
 *
 * Usage examples:
 * import {
 *   useUpdatePayrollSettings,
 *   usePatchPayrollSettings,
 * } from "@/lib/mutations/payroll/settings/usePayrollSettingsMutations";
 *
 * // or use the grouped accessor:
 * const {
 *   updatePayrollSettings,
 *   patchPayrollSettings,
 * } = usePayrollSettingsMutations();
 */

export {
  useUpdatePayrollSettings,
  usePatchPayrollSettings,
} from "@/lib/mutations/payroll/usePayrollMutations";

import {
  useUpdatePayrollSettings as _useUpdatePayrollSettings,
  usePatchPayrollSettings as _usePatchPayrollSettings,
} from "@/lib/mutations/payroll/usePayrollMutations";

/**
 * Optional grouped accessor if you prefer a single hook to obtain
 * all payroll settings mutations at once.
 */
export function usePayrollSettingsMutations() {
  const updatePayrollSettings = _useUpdatePayrollSettings();
  const patchPayrollSettings = _usePatchPayrollSettings();

  return {
    updatePayrollSettings,
    patchPayrollSettings,
  };
}
