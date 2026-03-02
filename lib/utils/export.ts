/**
 * Client-side CSV export utility.
 * Converts an array of objects to CSV and triggers download.
 */

type CellValue = string | number | boolean | null | undefined

interface ExportColumn<T> {
  /** Column header label */
  header: string
  /** Accessor function to extract cell value from a row */
  accessor: (row: T) => CellValue
}

function escapeCSV(value: CellValue): string {
  if (value === null || value === undefined) return ""
  const str = String(value)
  // Wrap in quotes if it contains comma, quote, or newline
  if (str.includes(",") || str.includes('"') || str.includes("\n")) {
    return `"${str.replace(/"/g, '""')}"`
  }
  return str
}

export function exportToCSV<T>(
  rows: T[],
  columns: ExportColumn<T>[],
  filename: string,
) {
  const header = columns.map((c) => escapeCSV(c.header)).join(",")
  const body = rows
    .map((row) => columns.map((col) => escapeCSV(col.accessor(row))).join(","))
    .join("\n")

  const csv = `${header}\n${body}`
  const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" })
  const url = URL.createObjectURL(blob)

  const link = document.createElement("a")
  link.href = url
  link.download = `${filename}.csv`
  link.click()
  URL.revokeObjectURL(url)
}

export type { ExportColumn }
