/**
 * Currency formatting utilities
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

export const toNumber = (value: string | number | undefined): number => {
  return typeof value === "string" ? parseFloat(value) || 0 : value || 0
}
