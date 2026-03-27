/**
 * Currency formatting utilities
 * All Philippine Peso related formatting
 */

import { toSafeNumber } from "@/lib/utils/math"

/**
 * Format a number as Philippine Peso currency string
 * @param value - Number or string to format
 * @returns Formatted currency string (e.g., "₱1,234.56")
 * @example
 * formatCurrency(1234.56) // → "₱1,234.56"
 * formatCurrency("999.99") // → "₱999.99"
 * formatCurrency(null) // → "N/A"
 */
export const formatCurrency = (value: number | string | undefined): string => {
  if (value == null) return "N/A"
  const num = typeof value === "string" ? parseFloat(value) : value
  if (isNaN(num)) return "N/A"
  return num.toLocaleString("en-PH", {
    style: "currency",
    currency: "PHP",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })
}

/**
 * Format a number as Peso with symbol (₱)
 * Extracted from 9 component files that had duplicate implementations
 * @param value - Number or string to format
 * @returns Formatted peso string (e.g., "₱1,234.56")
 * @example
 * peso(500) // → "₱500.00"
 * peso(1234.5) // → "₱1,234.50"
 * peso("999") // → "₱999.00"
 */
export const peso = (value: number | string | undefined): string => {
  return formatCurrency(value)
}

/**
 * Convert a value to a safe number for calculations
 * @param value - String, number, or undefined to convert
 * @returns Numeric value (defaults to 0 if invalid)
 * @deprecated Use toSafeNumber from @/lib/utils/math instead
 */
export const toNumber = (value: string | number | undefined): number => {
  return toSafeNumber(value, 0)
}
