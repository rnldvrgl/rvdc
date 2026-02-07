/**
 * Currency formatting utilities
 */

export const formatCurrency = (value: number | string | undefined): string => {
  const num = typeof value === "string" ? parseFloat(value) || 0 : value || 0
  return num.toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })
}

export const toNumber = (value: string | number | undefined): number => {
  return typeof value === "string" ? parseFloat(value) || 0 : value || 0
}
