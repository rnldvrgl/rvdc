import { timeZone } from "@/lib/constants/date"
import { format, startOfToday, subDays } from "date-fns"
import { fromZonedTime, toZonedTime } from "date-fns-tz"

/**
 * Centralized date formatting utilities
 * All date formatting functions should be defined here
 */

/**
 * Format a date string or Date object with timezone support
 * @param date - The date to format (Date object or ISO string)
 * @param formatStr - The format pattern (default: "yyyy-MM-dd")
 * Examples:
 * - "yyyy-MM-dd" → "2026-03-27"
 * - "MMM dd, yyyy" → "Mar 27, 2026"
 * - "MMM/dd/yyyy hh:mm a" → "Mar/27/2026 02:45 PM"
 * - "h:mm a" → "2:45 PM"
 * - "LLL dd, y" → "March 27, 2026"
 */
export function formatDate(
  date: Date | string,
  formatStr: string = "yyyy-MM-dd",
): string {
  if (typeof date === "string") {
    date = new Date(date)
  }
  if (isNaN(date.getTime())) return "-"
  try {
    return format(toZonedTime(date, timeZone), formatStr)
  } catch {
    return "-"
  }
}

/**
 * Format a date for backend (UTC timezone)
 * Used when sending dates to the API
 * @param date - The date to format
 * @param formatStr - The format pattern (default: "yyyy-MM-dd")
 */
export function formatBackDate(
  date: Date | string,
  formatStr: string = "yyyy-MM-dd",
): string {
  if (typeof date === "string") {
    date = new Date(date)
  }
  if (isNaN(date.getTime())) return "-"
  try {
    const utcDate = fromZonedTime(date, timeZone)
    return format(utcDate, formatStr)
  } catch {
    return "-"
  }
}

/**
 * Format date as YYYY-MM-DD
 * @param date - The date to format
 */
export function formatDateYMD(date: Date | string): string {
  return formatDate(date, "yyyy-MM-dd")
}

/**
 * Format time as HH:MM AM/PM
 * @param dateOrString - The date to format (handles null/undefined)
 */
export function formatTime(dateOrString: Date | string | null): string {
  if (!dateOrString) return "-"
  try {
    const date =
      typeof dateOrString === "string" ? new Date(dateOrString) : dateOrString
    if (isNaN(date.getTime())) return "-"
    return formatDate(date, "h:mm a")
  } catch {
    return "-"
  }
}

/**
 * Format date as MMM DD, YYYY (e.g., "Mar 27, 2026")
 * @param dateOrString - The date to format
 */
export function formatDateFull(dateOrString: Date | string | null): string {
  if (!dateOrString) return "-"
  try {
    const date =
      typeof dateOrString === "string" ? new Date(dateOrString) : dateOrString
    if (isNaN(date.getTime())) return "-"
    return formatDate(date, "MMM dd, yyyy")
  } catch {
    return "-"
  }
}

/**
 * Format timestamp as MMM/dd/yyyy hh:mm a (e.g., "Mar/27/2026 02:45 PM")
 * Commonly used in receipts and transaction records
 * @param dateOrString - The date to format
 */
export function formatTimestamp(dateOrString: Date | string | null): string {
  if (!dateOrString) return "-"
  try {
    const date =
      typeof dateOrString === "string" ? new Date(dateOrString) : dateOrString
    if (isNaN(date.getTime())) return "-"
    return formatDate(date, "MMM/dd/yyyy hh:mm a")
  } catch {
    return "-"
  }
}

/**
 * Format elapsed time since a start date
 * Returns format like "1m 30s" or "45s"
 * @param startedAt - The start date/time
 */
export function formatElapsed(startedAt: Date | number): string {
  const startTime =
    typeof startedAt === "number" ? startedAt : startedAt.getTime()
  const seconds = Math.floor((Date.now() - startTime) / 1000)
  if (seconds < 60) return `${seconds}s`
  const mins = Math.floor(seconds / 60)
  const secs = seconds % 60
  return `${mins}m ${secs}s`
}

/**
 * Format date and time as full readable format (e.g., "March 26, 2026 3:24 pm")
 * Used in session/audit logs and detailed timestamps
 * @param dateOrString - The date to format
 */
export function formatDateTimeFull(dateOrString: Date | string | null): string {
  if (!dateOrString) return "-"
  try {
    const date =
      typeof dateOrString === "string" ? new Date(dateOrString) : dateOrString
    if (isNaN(date.getTime())) return "-"
    const formatted = formatDate(date, "LLLL d, yyyy h:mm a")
    // Convert "AM"/"PM" to lowercase "am"/"pm"
    return formatted.replace(/\s(AM|PM)$/, (match) => match.toLowerCase())
  } catch {
    return "-"
  }
}

/**
 * Create a formatted date range for queries
 * @param daysAgo - Number of days to go back from today
 */
export const makeFormattedRange = (daysAgo: number) => {
  const from = subDays(startOfToday(), daysAgo)
  const to = startOfToday()
  return {
    from: new Date(formatBackDate(from)),
    to: new Date(formatBackDate(to)),
  }
}
