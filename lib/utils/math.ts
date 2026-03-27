/**
 * Mathematical utility functions
 * Extracted from components to centralize numeric operations
 */

/**
 * Round a number to 2 decimal places
 * Commonly used for currency calculations
 * @param value - The number to round
 * @returns Rounded number to 2 decimal places
 * @example
 * round2(10.256) // → 10.26
 * round2(10.251) // → 10.25
 */
export function round2(value: number): number {
  return Math.round(value * 100) / 100
}

/**
 * Round a number to a specific number of decimal places
 * @param value - The number to round
 * @param decimals - Number of decimal places (default: 2)
 * @returns Rounded number
 * @example
 * roundTo(10.256, 2) // → 10.26
 * roundTo(10.256, 1) // → 10.3
 */
export function roundTo(value: number, decimals: number = 2): number {
  const multiplier = Math.pow(10, decimals)
  return Math.round(value * multiplier) / multiplier
}

/**
 * Sum an array of numbers
 * @param values - Array of numbers to sum
 * @returns Sum of all values
 * @example
 * sum([1.23, 2.34, 3.45]) // → 6.99 (not 7.02 due to floating point)
 */
export function sum(values: number[]): number {
  return values.reduce((acc, val) => acc + val, 0)
}

/**
 * Sum and round to 2 decimal places
 * Useful for calculating totals in currency contexts
 * @param values - Array of numbers to sum
 * @returns Rounded sum to 2 decimal places
 */
export function sumRounded(values: number[]): number {
  return round2(sum(values))
}

/**
 * Calculate percentage of a value
 * @param value - The partial value
 * @param total - The total value
 * @param decimals - Decimal places in result (default: 2)
 * @returns Percentage as a number
 * @example
 * percentage(25, 100) // → 25
 * percentage(1, 3) // → 33.33
 */
export function percentage(
  value: number,
  total: number,
  decimals: number = 2,
): number {
  if (total === 0) return 0
  return roundTo((value / total) * 100, decimals)
}

/**
 * Calculate percentage change between two values
 * @param oldValue - The initial value
 * @param newValue - The new value
 * @param decimals - Decimal places in result (default: 2)
 * @returns Percentage change
 * @example
 * percentageChange(100, 120) // → 20
 * percentageChange(100, 80) // → -20
 */
export function percentageChange(
  oldValue: number,
  newValue: number,
  decimals: number = 2,
): number {
  if (oldValue === 0) return 0
  return roundTo(((newValue - oldValue) / oldValue) * 100, decimals)
}

/**
 * Clamp a number between min and max
 * @param value - The number to clamp
 * @param min - Minimum value
 * @param max - Maximum value
 * @returns Clamped number
 */
export function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value))
}

/**
 * Convert a string to a safe number, defaulting to 0
 * @param value - String or number to convert
 * @param defaultValue - Default value if conversion fails (default: 0)
 * @returns Number value
 */
export function toSafeNumber(
  value: string | number | null | undefined,
  defaultValue: number = 0,
): number {
  if (value == null) return defaultValue
  const num = typeof value === "string" ? parseFloat(value) : value
  return isNaN(num) ? defaultValue : num
}

/**
 * Generate a UUID v4
 * @returns UUID string
 */
export function generateId(): string {
  return crypto.getRandomValues(new Uint8Array(16)).toString()
}
