/**
 * RVDC Application Changelog
 *
 * How to add a new release:
 * 1. Create a new entry in the CHANGELOG array (prepend — newest first).
 * 2. Set `roles` to the array of roles that should see the entry, or omit /
 *    use ['all'] to show to every role.
 * 3. The banner will appear automatically for users who haven't seen this
 *    version yet (tracked per-user via localStorage).
 */

export type ChangelogCategory =
  | "feature"
  | "fix"
  | "improvement"
  | "removed"
  | "security"

export type UserRole = "admin" | "manager" | "clerk" | "technician"

export interface ChangelogItem {
  category: ChangelogCategory
  text: string
  /** Restrict this bullet to certain roles; omit or use ['all'] for everyone */
  roles?: UserRole[] | ["all"]
}

export interface ChangelogEntry {
  /** Semantic version string — must be unique, e.g. "1.4.0" */
  version: string
  title: string
  date: string // ISO date "YYYY-MM-DD"
  /** Roles that should be notified by this release. Use ['all'] or omit for everyone. */
  roles?: UserRole[] | ["all"]
  items: ChangelogItem[]
}

// ── Category metadata ──────────────────────────────────────────────────────────
export const CATEGORY_META: Record<
  ChangelogCategory,
  { label: string; color: string; bg: string }
> = {
  feature: {
    label: "New Feature",
    color: "text-emerald-700 dark:text-emerald-400",
    bg: "bg-emerald-100 dark:bg-emerald-950/60",
  },
  fix: {
    label: "Bug Fix",
    color: "text-rose-700 dark:text-rose-400",
    bg: "bg-rose-100 dark:bg-rose-950/60",
  },
  improvement: {
    label: "Improvement",
    color: "text-sky-700 dark:text-sky-400",
    bg: "bg-sky-100 dark:bg-sky-950/60",
  },
  removed: {
    label: "Removed",
    color: "text-amber-700 dark:text-amber-400",
    bg: "bg-amber-100 dark:bg-amber-950/60",
  },
  security: {
    label: "Security",
    color: "text-violet-700 dark:text-violet-400",
    bg: "bg-violet-100 dark:bg-violet-950/60",
  },
}

// ── Changelog entries (newest first) ──────────────────────────────────────────
export const CHANGELOG: ChangelogEntry[] = [
  {
    version: "1.6.0",
    title: "Appliance Claiming Fixes",
    date: "2026-04-04",
    items: [
      {
        category: "fix",
        text: "Clicking \"Mark Claimed\" on a service appliance now immediately updates the button state without needing to close and reopen the service detail.",
        roles: ["admin", "manager", "clerk"],
      },
      {
        category: "feature",
        text: "Completing a carry-in or pull-out service now automatically marks all unclaimed appliances as claimed — no need to manually click \"Mark Claimed\" for each appliance.",
        roles: ["admin", "manager", "clerk"],
      },
    ],
  },
  {
    version: "1.5.0",
    title: "Dashboard Stat Card & In-App Changelog",
    date: "2026-04-04",
    items: [
      {
        category: "feature",
        text: "Sub Stall Daily Settlement now appears as a compact stat card on the admin dashboard, matching the height and style of other metric cards. Click it to open the full settlement breakdown.",
        roles: ["admin"],
      },
      {
        category: "feature",
        text: "In-app Changelog is live — you'll see a banner when new updates are available, with a full changelog page filtered to changes relevant to your role.",
      },
      {
        category: "improvement",
        text: "Admin dashboard metric grid now uniformly fits the Sub Stall stat card without breaking the layout.",
        roles: ["admin"],
      },
    ],
  },
  {
    version: "1.4.0",
    title: "Services, Company Assets & Client Improvements",
    date: "2026-04-04",
    items: [
      // ── Features ──
      {
        category: "feature",
        text: "Warranty & free cleaning indicators are now shown directly on the services list for quick at-a-glance status.",
        roles: ["admin", "manager", "clerk"],
      },
      {
        category: "feature",
        text: "Client detail page now has a Warranty Claims tab — view and manage all warranty claims per client in one place.",
        roles: ["admin", "manager", "clerk"],
      },
      {
        category: "feature",
        text: "Company Assets can now be sold — record a sale price and link to the buying client directly from the asset record.",
        roles: ["admin", "manager"],
      },
      {
        category: "feature",
        text: "Service appliances now track claiming and forfeiture — mark an appliance as claimed or forfeited after a job.",
        roles: ["admin", "manager", "clerk"],
      },
      {
        category: "feature",
        text: "Sub Stall Daily Settlement now appears as a compact stat card on the admin dashboard matching other metric cards. Click to view the full breakdown.",
        roles: ["admin"],
      },
      {
        category: "feature",
        text: "In-app Changelog (this screen) — get notified directly in the app whenever updates are released, filtered by your role.",
      },
      // ── Improvements ──
      {
        category: "improvement",
        text: "Service form redesigned — appliance manager and parts manager have improved UX with clearer item selection and fewer steps.",
        roles: ["admin", "manager", "clerk"],
      },
      {
        category: "improvement",
        text: "Client selector upgraded to a card-style picker for easier client lookup when recording sales and assets.",
        roles: ["admin", "manager", "clerk"],
      },
      {
        category: "improvement",
        text: "Employee profile page layout improved with a cleaner section structure.",
        roles: ["admin", "manager"],
      },
      {
        category: "improvement",
        text: "Payment status filter on services is now more accurate — quickly find unpaid services with a direct link.",
        roles: ["admin", "manager", "clerk"],
      },
      {
        category: "improvement",
        text: "Sales and outstanding analytics now correctly exclude service-linked transactions to avoid double-counting revenue.",
        roles: ["admin"],
      },
      {
        category: "improvement",
        text: "Inventory items can now be marked as untracked (catalogue-only) — useful for items that don't need stock management.",
        roles: ["admin", "manager"],
      },
      // ── Fixes ──
      {
        category: "fix",
        text: "Payment status 'Pending' added as a proper status. 'N/A' renamed to 'No Charge' for clarity across services and sales.",
        roles: ["admin", "manager", "clerk"],
      },
      {
        category: "fix",
        text: "Outstanding analytics no longer include deleted or cancelled services in the outstanding balance totals.",
        roles: ["admin"],
      },
      // ── Removed ──
      {
        category: "removed",
        text: "Tax bracket functionality removed from payroll — government benefits now use a fixed calculation method.",
        roles: ["admin"],
      },
      {
        category: "removed",
        text: "Unit warranty months field removed from the service appliance form (no longer needed).",
        roles: ["admin", "manager", "clerk"],
      },
    ],
  },
  {
    version: "1.3.0",
    title: "Aircon Installation & Units",
    date: "2026-03-20",
    items: [
      {
        category: "feature",
        text: "Aircon Installation Units tab is now live — track per-unit installation records.",
        roles: ["admin", "manager"],
      },
      {
        category: "feature",
        text: "Aircon unit inventory integration — stock levels are now linked to installation records.",
        roles: ["admin", "manager", "clerk"],
      },
      {
        category: "fix",
        text: "Fixed empty service list showing incorrectly on certain filter combinations.",
      },
      {
        category: "fix",
        text: "Resolved edit service error when saving without changes.",
      },
    ],
  },
  {
    version: "1.2.0",
    title: "Attendance & Payroll",
    date: "2026-03-05",
    items: [
      {
        category: "feature",
        text: "Quick Clock In/Out widget added to the dashboard for faster attendance logging.",
        roles: ["technician", "clerk", "manager"],
      },
      {
        category: "feature",
        text: "Payroll now includes additional earnings categories.",
        roles: ["admin"],
      },
      {
        category: "improvement",
        text: "Attendance approval workflow redesigned for clarity.",
        roles: ["admin", "manager"],
      },
      {
        category: "fix",
        text: "Fixed deduction duplication bug in payroll computation.",
        roles: ["admin"],
      },
    ],
  },
  {
    version: "1.1.0",
    title: "Expenses & Discount System",
    date: "2026-02-18",
    items: [
      {
        category: "feature",
        text: "Complete expense category management with sub-categories.",
        roles: ["admin", "manager"],
      },
      {
        category: "feature",
        text: "Discount system implemented — apply discounts at service and sale level.",
        roles: ["admin", "clerk"],
      },
      {
        category: "improvement",
        text: "Expense list now filters by category and date range.",
        roles: ["admin", "manager", "clerk"],
      },
      {
        category: "removed",
        text: "Legacy deduction items field removed from payroll form.",
        roles: ["admin"],
      },
    ],
  },
]
