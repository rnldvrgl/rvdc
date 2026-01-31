/**
 * Payroll configuration for Sunday half-day rules.
 *
 * This module centralizes rule toggles and defaults used by time-entry creation
 * and weekly payroll computations (especially for half-day Sundays).
 *
 * Usage:
 * - Import `getPayrollConfig()` to read current config.
 * - Use `setPayrollConfig()` to override defaults at runtime (e.g., per shop or environment).
 * - Call `getExpectedSundaySession()` when pre-filling or validating Sunday entries.
 */

export type PayrollConfig = {
  /**
   * Enables half-day Sunday rule. When true, Sundays are expected to be half-day
   * unless shop is closed or explicitly overridden.
   */
  sundayHalfDayEnabled: boolean

  /**
   * Expected working hours for a half-day Sunday (e.g., 4 means 4 hours worked).
   */
  sundayHalfDayHours: number

  /**
   * Default unpaid break minutes for half-day Sunday sessions (if any).
   */
  sundayUnpaidBreakMinutes: number

  /**
   * Optional flag to apply half-day only when the shop is open on Sunday.
   * If false, half-day applies to all Sundays.
   */
  applyOnlyWhenShopOpen: boolean

  /**
   * Optional human-readable reason/explanation for the half-day Sunday policy.
   * Can be displayed in UI or added to notes.
   */
  sundayPolicyNote?: string
}

/**
 * Default configuration. Adjust these values to match your business policy.
 */
const DEFAULT_CONFIG: PayrollConfig = {
  sundayHalfDayEnabled: true,
  sundayHalfDayHours: 4,
  sundayUnpaidBreakMinutes: 0,
  applyOnlyWhenShopOpen: true,
  sundayPolicyNote:
    'Shop observes half-day operations on Sundays; expected working hours are reduced.',
}

/**
 * Internal mutable config state.
 * Keep this module as the single source of truth for half-day Sunday rules.
 */
let currentConfig: PayrollConfig = { ...DEFAULT_CONFIG }

/**
 * Read current payroll configuration.
 */
export function getPayrollConfig(): PayrollConfig {
  return { ...currentConfig }
}

/**
 * Override payroll configuration (partial).
 * Useful for per-shop or environment-specific adjustments.
 */
export function setPayrollConfig(partial: Partial<PayrollConfig>): void {
  currentConfig = { ...currentConfig, ...partial }
}

/**
 * Utility: check if a Date string or Date object falls on Sunday.
 */
export function isSunday(date: string | Date): boolean {
  const d = typeof date === 'string' ? new Date(date) : date
  return d.getDay() === 0 // 0 = Sunday
}

/**
 * Returns expected half-day Sunday session parameters (hours and unpaid break).
 *
 * If half-day Sunday is disabled or the day is not Sunday, returns null.
 * If applyOnlyWhenShopOpen is true and the shop is closed, returns null.
 *
 * @param date - Date or ISO string for the target day
 * @param options.shopOpen - Whether the shop is open this Sunday (if applicable)
 * @param options.overrideHours - Optional override for expected hours
 * @param options.overrideUnpaidBreakMinutes - Optional override for unpaid break
 */
export function getExpectedSundaySession(
  date: string | Date,
  options?: {
    shopOpen?: boolean
    overrideHours?: number
    overrideUnpaidBreakMinutes?: number
  },
): { expectedHours: number; unpaidBreakMinutes: number; policyNote?: string } | null {
  const cfg = currentConfig

  if (!isSunday(date)) return null
  if (!cfg.sundayHalfDayEnabled) return null

  // Respect shop-open rule if enabled
  if (cfg.applyOnlyWhenShopOpen && options?.shopOpen === false) {
    return null
  }

  const expectedHours =
    typeof options?.overrideHours === 'number'
      ? options.overrideHours
      : cfg.sundayHalfDayHours

  const unpaidBreakMinutes =
    typeof options?.overrideUnpaidBreakMinutes === 'number'
      ? options.overrideUnpaidBreakMinutes
      : cfg.sundayUnpaidBreakMinutes

  // Sanity bounds (non-negative, reasonable hours)
  const safeExpectedHours = Math.max(0, Math.min(expectedHours, 12))
  const safeUnpaidBreakMinutes = Math.max(0, unpaidBreakMinutes)

  return {
    expectedHours: safeExpectedHours,
    unpaidBreakMinutes: safeUnpaidBreakMinutes,
    policyNote: cfg.sundayPolicyNote,
  }
}

/**
 * Helper to compute a recommended clock-in and clock-out for half-day Sunday,
 * given a desired clock-in time and expected hours.
 *
 * Returns null when half-day Sunday is not applicable.
 *
 * @param clockInISO - ISO datetime string for clock-in (e.g., '2026-01-11T09:00:00')
 * @param options.shopOpen - Whether the shop is open this Sunday (if applicable)
 * @param options.overrideHours - Optional override for expected hours
 * @param options.overrideUnpaidBreakMinutes - Optional override for unpaid break
 */
export function planHalfDaySundayWindow(
  clockInISO: string,
  options?: {
    shopOpen?: boolean
    overrideHours?: number
    overrideUnpaidBreakMinutes?: number
  },
): { clockIn: string; clockOut: string; unpaidBreakMinutes: number; policyNote?: string } | null {
  const plan = getExpectedSundaySession(clockInISO, options)
  if (!plan) return null

  const clockIn = new Date(clockInISO)
  // Compute clock-out based on expectedHours. Unpaid break minutes are informational
  const minutes = Math.round(plan.expectedHours * 60)
  const clockOut = new Date(clockIn.getTime() + minutes * 60 * 1000)

  return {
    clockIn: clockIn.toISOString(),
    clockOut: clockOut.toISOString(),
    unpaidBreakMinutes: plan.unpaidBreakMinutes,
    policyNote: plan.policyNote,
  }
}

/**
 * Convenience for UI checklists:
 * Given a target week (week_start ISO date), derive the expected payout day (Saturday).
 *
 * Assumes week_start is the start of the week (e.g., Monday). Returns the following Saturday.
 */
export function getPayoutSaturdayForWeekStart(weekStartISO: string): string {
  const start = new Date(weekStartISO)
  // Compute delta to Saturday from week_start (weekday: 6 for Saturday)
  const startWeekday = start.getDay()
  const deltaToSaturday = (6 - startWeekday + 7) % 7
  const saturday = new Date(start.getTime() + deltaToSaturday * 24 * 60 * 60 * 1000)
  return saturday.toISOString()
}

/**
 * Minimal payout checklist structure. The UI can populate each item’s status and notes.
 */
export type PayoutChecklistItem =
  | 'time_entries_approved'
  | 'sessions_review_cleared'
  | 'additional_earnings_approved'
  | 'deductions_applied'
  | 'weekly_payroll_recomputed'
  | 'weekly_payroll_approved'

export type PayoutChecklist = {
  employeeId: number
  weekStartISO: string
  payoutSaturdayISO: string
  items: Record<PayoutChecklistItem, { ok: boolean; note?: string }>
}

/**
 * Initialize a blank payout checklist for an employee/week.
 * The UI can toggle each item to ok: true and add notes as needed.
 */
export function initPayoutChecklist(employeeId: number, weekStartISO: string): PayoutChecklist {
  return {
    employeeId,
    weekStartISO,
    payoutSaturdayISO: getPayoutSaturdayForWeekStart(weekStartISO),
    items: {
      time_entries_approved: { ok: false },
      sessions_review_cleared: { ok: false },
      additional_earnings_approved: { ok: false },
      deductions_applied: { ok: false },
      weekly_payroll_recomputed: { ok: false },
      weekly_payroll_approved: { ok: false },
    },
  }
}
