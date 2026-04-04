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

import { title } from "process"
import { date } from "zod"

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
    version: "1.7.0",
    title: "Services, Inventory Bulk Update & App Improvements",
    date: "2026-04-04",
    items: [
      // ── Features: Services ──
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
        text: "Completing a carry-in or pull-out service now automatically marks all unclaimed appliances as claimed — no need to manually click \"Mark Claimed\" for each appliance.",
        roles: ["admin", "manager", "clerk"],
      },
      {
        category: "feature",
        text: "You can now void a recorded service payment, making it easy to correct a wrong entry.",
        roles: ["admin", "manager", "clerk"],
      },
      {
        category: "feature",
        text: "You can now edit a recorded service payment — change the payment type, amount, notes, or date without having to void and re-record.",
        roles: ["admin", "manager", "clerk"],
      },
      // ── Features: Inventory ──
      {
        category: "feature",
        text: "Bulk update for stall stock — download a pre-filled template, edit quantities and thresholds in Excel, then upload to preview and confirm changes in one go.",
        roles: ["admin", "manager"],
      },
      {
        category: "feature",
        text: "Bulk update for stockroom stock — same download → preview → confirm flow, now available for stockroom stock levels.",
        roles: ["admin", "manager"],
      },
      {
        category: "feature",
        text: "Item bulk update now supports creating new items — add a row with a blank SKU and fill in the name and price to create the item directly from the spreadsheet.",
        roles: ["admin"],
      },
      {
        category: "feature",
        text: "Item bulk update now supports deleting items — set the Action column to DELETE in the template to soft-delete an item.",
        roles: ["admin"],
      },
      // ── Features: Dashboard & App ──
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
        category: "feature",
        text: "\"What's New\" button added to the sidebar (desktop and mobile) — click it any time to re-open the changelog.",
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
      {
        category: "improvement",
        text: "Bulk update preview dialog now highlights delete rows in red and new-item rows in green so you can clearly see what will be created or removed before confirming.",
        roles: ["admin", "manager"],
      },
      {
        category: "improvement",
        text: "Admin dashboard metric grid now uniformly fits the Sub Stall stat card without breaking the layout.",
        roles: ["admin"],
      },
      {
        category: "feature",
        text: "You can now send images in chat — paste a copied image directly into the message box or click the image icon to attach a file.",
        roles: ["admin", "manager", "clerk"],
      },
      {
        category: "improvement",
        text: "Chat draft messages are now preserved when you close the chat window — your unsent text is still there when you reopen it.",
        roles: ["admin", "manager", "clerk"],
      },
      {
        category: "improvement",
        text: "Notification, chat, and sale sounds are louder and easier to hear. You can also set your own preferred volume in Account Settings → Sound Preferences.",
        roles: ["admin", "manager", "clerk"],
      },
      {
        category: "feature",
        text: "You can now add stall stock directly from the sales form — when an item shows 0 available stock, an \"Add Stock\" button appears on that row to restock it without leaving the sale.",
        roles: ["admin", "manager", "clerk"],
      },
      // ── Bug Fixes ──
      {
        category: "fix",
        text: "Resuming a held sale no longer keeps the Submit button disabled — the form now correctly allows submission when continuing from a held sale.",
        roles: ["admin", "manager", "clerk"],
      },
      // ── Improvements ──
      {
        category: "improvement",
        text: "Stall stock table now supports up to 500 rows per page, making it easier to view and audit all items at once.",
        roles: ["admin", "manager", "clerk"],
      },
        roles: ["admin", "manager", "clerk"],
      },
      {
        category: "fix",
        text: "Clicking \"Mark Claimed\" on a service appliance now immediately updates the button state without needing to close and reopen the service detail.",
        roles: ["admin", "manager", "clerk"],
      },
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
