import { NavListItem } from "@/lib/constants/types"
import { clsx, type ClassValue } from "clsx"

import { twMerge } from "tailwind-merge"

type badgeVariants =
  | "default"
  | "secondary"
  | "destructive"
  | "outline"
  | "success"
  | "warning"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export const setItem = (key: string, value: unknown): void => {
  try {
    window.localStorage.setItem(key, JSON.stringify(value))
  } catch {
    // error is handled by mutation
  }
}

export const getItem = <T = unknown>(key: string): T | undefined => {
  try {
    const item = window.localStorage.getItem(key)
    return item ? (JSON.parse(item) as T) : undefined
  } catch {
    return undefined
  }
}

export const removeItem = (key: string): void => {
  try {
    window.localStorage.removeItem(key)
  } catch {
    // error is handled by mutation
  }
}

export const clearStorage = (): void => {
  try {
    window.localStorage.clear()
  } catch {
    // error is handled by mutation
  }
}

export const focusRing = [
  "outline outline-offset-2 outline-0 focus-visible:outline-2",
  "outline-indigo-500 dark:outline-indigo-500",
]

export const concatString = (...args: string[]) => args.join(" ")

export function getLinkClasses(active: boolean) {
  return `flex items-center gap-x-3 rounded-xl px-3 py-2 text-sm font-medium transition-all duration-200
    ${
      active
        ? "bg-primary text-primary-foreground shadow-sm shadow-primary/25"
        : "text-muted-foreground hover:bg-muted hover:text-foreground"
    }
`
}

export function getNameByCode<T extends { code: string; name: string }>(
  list: T[],
  code: string,
): string {
  return list.find((item) => item.code === code)?.name || ""
}

export function getCodeByName<T extends { code: string; name: string }>(
  list: T[],
  name: string,
): string {
  return list.find((item) => item.name === name)?.code || ""
}

export function prepareOptions<T extends { code?: string; name: string }>(
  list: T[],
): T[] {
  return list
    .filter((item) => item.code?.trim())
    .sort((a, b) => a.name.localeCompare(b.name))
}

export const convertFileToBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.readAsDataURL(file)
    reader.onload = () => {
      const result = reader.result as string
      // Strip "data:image/png;base64," if you want
      const base64 = result.split(",")[1]
      resolve(base64)
    }
    reader.onerror = reject
  })
}

export function getDisplayImage(
  image?: string,
  type: "profile_image" | "e_signature" = "profile_image",
  fallback: string = type === "profile_image"
    ? "/default_image.jpg"
    : "/default_signature.png",
) {
  if (!image || image.trim() === "") {
    return fallback
  }

  // If image starts with /media/, prepend the backend URL
  if (image.startsWith("/media/")) {
    const backendUrl =
      process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:8000"
    return `${backendUrl}${image}`
  }

  // For absolute URLs or other paths, return as-is
  return image
}

// Format date in local timezone (YYYY-MM-DD) - fixes timezone offset issues
export function formatDateToYMD(date: Date): string {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, "0")
  const day = String(date.getDate()).padStart(2, "0")
  return `${year}-${month}-${day}`
}

/**
 * Format time string to 12-hour format
 * @param timeString - Time string in HH:MM:SS or HH:MM format
 * @returns Formatted time in 12-hour format (e.g., "2:30 PM")
 */
export function formatTimeTo12Hour(
  timeString: string | null | undefined,
): string {
  if (!timeString) return ""

  // Extract hours and minutes from time string (ignore seconds and microseconds)
  const timeParts = timeString.split(":")
  if (timeParts.length < 2) return timeString

  const hours = parseInt(timeParts[0], 10)
  const minutes = timeParts[1].padStart(2, "0")

  if (isNaN(hours)) return timeString

  const period = hours >= 12 ? "PM" : "AM"
  const displayHours = hours % 12 || 12 // Convert 0 to 12 for midnight

  return `${displayHours}:${minutes} ${period}`
}

export function normalizeProfileImage(image?: string | null) {
  if (image === "") return ""
  if (!image) return undefined
  return image
}

export function isPathActive(item: NavListItem, path: string): boolean {
  if (item.href && path.startsWith(item.href)) return true
  if (item.children) {
    return item.children!.some((child: NavListItem) =>
      isPathActive(child, path),
    )
  }
  return false
}

export { formatCurrency } from "@/lib/utils/currency"

export function safeCell(value: unknown): string {
  const EMPTY_DASH = "—"

  if (typeof value === "string") {
    const trimmed = value.trim()
    return trimmed !== "" ? trimmed : EMPTY_DASH
  }

  if (value == null) return EMPTY_DASH

  return String(value)
}

export function getBadgeVariant(
  source: string | undefined | null,
): badgeVariants {
  if (!source) return "default"
  source = source.toLocaleLowerCase()
  const variants: Record<string, badgeVariants> = {
    paid: "success",
    pending: "secondary",
    high_stock: "success",
    manual: "secondary",
    picked_up: "default",
    client_delivered: "warning",
    transfer: "default",
    partial: "warning",
    low_stock: "warning",
    no_stock: "destructive",
    unpaid: "destructive",
    inverter: "default",
    "non-inverter": "destructive",
    // Service statuses
    in_progress: "default",
    completed: "success",
    cancelled: "destructive",
    // Appliance statuses
    in_repair: "default",
    ready_for_pickup: "success",
    delivered: "success",
    diagnosed: "default",
    repaired: "success",
    tested: "success",
    ready: "success",
    replacement: "warning",
    sale: "default",
    service: "secondary",
    // Quotation statuses
    draft: "secondary",
    sent: "default",
    accepted: "success",
    declined: "destructive",
    // Stock request statuses
    approved: "default",
    // Cheque statuses
    deposited: "success",
    encashed: "success",
    bounced: "destructive",
    returned: "outline",
    // Schedule types
    shop_closed: "destructive",
    half_day: "secondary",
    // Calculation methods
    fixed: "default",
    percentage: "secondary",
    progressive_tax: "outline",
    // Reimbursement
    reimbursed: "success",
  }

  return variants[source] ?? "outline"
}

export function getBoolBadgeVariant({
  status,
  reverse = false,
}: {
  status: boolean
  reverse?: boolean
}): "success" | "destructive" {
  if (reverse) return status ? "destructive" : "success"
  return status ? "success" : "destructive"
}

export const getHashedStallBadgeClass = (stallName: string) => {
  const colors = [
    "border-transparent bg-emerald-600 text-white dark:bg-emerald-500 dark:text-white",
    "border-transparent bg-yellow-400 text-black dark:bg-yellow-300 dark:text-black",
    "border-transparent bg-blue-500 text-white dark:bg-blue-400 dark:text-white",
    "border-transparent bg-pink-500 text-white dark:bg-pink-400 dark:text-white",
    "border-transparent bg-purple-500 text-white dark:bg-purple-400 dark:text-white",
    "border-transparent bg-teal-500 text-white dark:bg-teal-400 dark:text-white",
    "border-transparent bg-rose-500 text-white dark:bg-rose-400 dark:text-white",
    "border-transparent bg-orange-500 text-white dark:bg-orange-400 dark:text-white",
  ]

  let hash = 0
  for (let i = 0; i < stallName.length; i++) {
    hash = stallName.charCodeAt(i) + ((hash << 5) - hash)
    hash = hash & hash // force 32-bit integer
  }

  const index = Math.abs(hash) % colors.length
  return colors[index]
}

export const formatNumber = (value: number | null | undefined): string => {
  if (value == null || isNaN(value)) return "0"
  return new Intl.NumberFormat("en-PH").format(value)
}

export function capitalize(input: string): string {
  return input
    .toLowerCase()
    .split(" ")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ")
}

/**
 * Payroll-specific helpers
 */

export function formatHours(value: number | string | undefined): string {
  const num =
    typeof value === "string"
      ? parseFloat(value)
      : typeof value === "number"
        ? value
        : 0
  const safe = isNaN(num) ? 0 : num
  return `${safe.toFixed(2)} h`
}

export function getWeekEnd(weekStart?: string): string | undefined {
  if (!weekStart) return undefined

  const start = new Date(weekStart)

  if (isNaN(start.getTime())) return undefined

  const end = new Date(start)

  end.setDate(start.getDate() + 7) // exclusive end

  return formatDateToYMD(end)
}

// New helpers: explicit exclusive (+7) and inclusive (+6) week end calculators.

/**
 * Exclusive week end date: returns week_start + 7 days (YYYY-MM-DD).
 * Use when building [start, end) ranges (end_date should be treated as exclusive).
 */
export function getWeekEndExclusive(weekStart?: string): string | undefined {
  return getWeekEnd(weekStart)
}

/**
 * Inclusive week end date: returns week_start + 6 days (YYYY-MM-DD).
 * Use when you need a display-friendly inclusive end date.
 */
export function getWeekEndInclusive(weekStart?: string): string | undefined {
  if (!weekStart) return undefined
  const start = new Date(weekStart)
  if (isNaN(start.getTime())) return undefined
  const end = new Date(start)
  end.setDate(start.getDate() + 6) // inclusive end
  return formatDateToYMD(end)
}

export const formatMinutesToHours = (totalMinutes: number) => {
  const h = Math.floor(totalMinutes / 60)
  const m = totalMinutes % 60

  if (h === 0) return `${m} minute${m === 1 ? "" : "s"}`
  if (m === 0) return `${h} hour${h === 1 ? "" : "s"}`

  return `${h} hour${h === 1 ? "" : "s"} & ${String(m).padStart(
    2,
    "0",
  )} minute${m === 1 ? "" : "s"}`
}
