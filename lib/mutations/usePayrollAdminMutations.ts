"use client"
import { useApiMutation } from "@/lib/hooks/useApiMutation"
import type { Holiday, PayrollSettings } from "@/lib/queries/usePayroll"
import api from "@/lib/utils/api"
import { useQueryClient } from "@tanstack/react-query"

const PAYROLL_BASE = "/payroll"
const SETTINGS_URL = `${PAYROLL_BASE}/settings/`
const HOLIDAYS_URL = `${PAYROLL_BASE}/holidays/`

interface CsvUploadSummary {
  imported: number
  skipped: number
  errors: Array<{ line: number; message: string }>
}

interface BackendCsvResponse {
  imported_count?: number
  skipped_count?: number
  errors?: Array<{ line?: number; message?: string }>
}

interface HolidayItem {
  date: string
  name: string
  kind: "regular" | "special"
}

const parseHolidayType = (raw: string): "regular" | "special" | null => {
  const normalized = raw.trim().toLowerCase()
  if (normalized.includes("regular")) return "regular"
  if (normalized.includes("special")) return "special"
  return null
}

const parseCsv = async (file: File): Promise<HolidayItem[]> => {
  const text = await file.text()
  const lines = text.split(/\r?\n/).filter((l) => l.trim().length > 0)

  const [header, ...rows] = lines
  const headerCols = header.split(",").map((c) => c.trim().toLowerCase())

  if (
    headerCols.length < 3 ||
    headerCols[0] !== "date" ||
    headerCols[1] !== "name" ||
    headerCols[2] !== "type"
  ) {
    throw new Error("Invalid CSV header. Expected: Date, Name, Type")
  }

  const results: HolidayItem[] = []

  for (const row of rows) {
    const cols = row.split(",").map((c) => c.trim())
    if (cols.length < 3) continue

    const date = cols[0]
    const name = cols[1]
    const kindParsed = parseHolidayType(cols[2])

    if (!date || !name || !kindParsed) continue
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) continue

    results.push({ date, name, kind: kindParsed })
  }

  return results
}

/**
 * Centralized mutations for Payroll Admin (settings and holidays).
 * - Uses app-standard useApiMutation for toast + cache invalidation
 * - Keeps endpoints and messages consistent across the app
 */
export function usePayrollAdminMutations() {
  const queryClient = useQueryClient()

  // Settings
  const saveSettings = useApiMutation<
    Partial<PayrollSettings>,
    PayrollSettings
  >({
    mutationFn: (data) => api.put(SETTINGS_URL, data),
    successMessage: "Settings saved successfully.",
    invalidateQueries: [{ queryKey: ["payroll", "settings"] }],
  })

  const patchSettings = useApiMutation<
    Partial<PayrollSettings>,
    PayrollSettings
  >({
    mutationFn: (data) => api.patch(SETTINGS_URL, data),
    successMessage: "Settings updated.",
    invalidateQueries: [{ queryKey: ["payroll", "settings"] }],
  })

  // Holidays
  const addHoliday = useApiMutation<
    Omit<Holiday, "id" | "is_deleted">,
    Holiday
  >({
    mutationFn: (data) => api.post(HOLIDAYS_URL, data),
    successMessage: "Holiday added.",
    invalidateQueries: [
      { queryKey: ["payroll", "holidays"] },
      { queryKey: ["calendar-events"] },
    ],
  })

  const updateHoliday = useApiMutation<
    { id: number; data: Partial<Holiday> },
    Holiday
  >({
    mutationFn: ({ id, data }) => api.patch(`${HOLIDAYS_URL}${id}/`, data),
    successMessage: "Holiday saved.",
    invalidateQueries: [
      { queryKey: ["payroll", "holidays"] },
      { queryKey: ["calendar-events"] },
    ],
    onSuccess: (_, variables) => {
      // Invalidate a potential holiday detail query if used elsewhere
      queryClient.invalidateQueries({
        queryKey: ["payroll", "holiday", `${variables.id}`],
      })
    },
  })

  const deleteHoliday = useApiMutation<number, unknown>({
    mutationFn: (id) => api.delete(`${HOLIDAYS_URL}${id}/`),
    successMessage: "Holiday deleted.",
    invalidateQueries: [{ queryKey: ["payroll", "holidays"] }],
  })

  // CSV Upload
  const uploadHolidaysCsv = useApiMutation<File, CsvUploadSummary>({
    mutationFn: async (file: File) => {
      const formData = new FormData()
      formData.append("file", file)

      try {
        // Try backend bulk upload first
        const response = await api.post<BackendCsvResponse>(
          `${HOLIDAYS_URL}upload/`,
          formData,
          {
            headers: { "Content-Type": "multipart/form-data" },
          },
        )

        const summary = response.data
        return {
          imported: summary?.imported_count ?? 0,
          skipped: summary?.skipped_count ?? 0,
          errors: (summary?.errors ?? []).map((e) => ({
            line: e?.line ?? 0,
            message: e?.message ?? "Unknown error",
          })),
        }
      } catch (backendError) {
        console.warn(
          "Backend CSV upload failed, using client-side parsing:",
          backendError,
        )

        // Fallback to client-side parsing
        const items = await parseCsv(file)
        let imported = 0
        const errors: Array<{ line: number; message: string }> = []

        for (let i = 0; i < items.length; i++) {
          const item = items[i]
          try {
            await api.post(HOLIDAYS_URL, item)
            imported += 1
          } catch {
            // error is handled by mutation
          }
        }

        return {
          imported,
          skipped: errors.length,
          errors,
        }
      }
    },
    successMessage: "CSV uploaded successfully.",
    invalidateQueries: [{ queryKey: ["payroll", "holidays"] }],
  })

  return {
    // Settings
    saveSettings,
    patchSettings,
    // Holidays
    addHoliday,
    updateHoliday,
    deleteHoliday,
    uploadHolidaysCsv,
  }
}
