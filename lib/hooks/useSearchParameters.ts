"use client"

import { DATE_RANGE_PRESETS } from "@/lib/constants/general"
import { DateRangePresetLabel } from "@/lib/constants/types"
import { formatBackDate } from "@/lib/utils/helpers/date"
import { useSearchParams } from "next/navigation"

interface SearchParameters {
  page: number
  limit: number
  search?: string
  ordering?: string
  filter?: Record<string, string>
}

interface UseSearchParametersOptions {
  defaultRangePreset?: DateRangePresetLabel
}

const ALLOWED_LIMITS = [10, 20, 30, 40, 50]
const RESERVED_KEYS = new Set(["page", "limit", "search", "ordering"])

const useSearchParameters = (
  options?: UseSearchParametersOptions,
): SearchParameters => {
  const searchParams = useSearchParams()

  // Early return with defaults if searchParams is null (SSR/hydration)
  if (!searchParams) {
    const filter: Record<string, string> = {}

    // Apply default date range if specified
    if (options?.defaultRangePreset) {
      const preset = DATE_RANGE_PRESETS.find(
        (p) => p.label === options.defaultRangePreset,
      )
      if (preset?.range.from) {
        filter.start_date = formatBackDate(preset.range.from)
      }
      if (preset?.range.to) {
        filter.end_date = formatBackDate(preset.range.to)
      }
    }

    return {
      page: 1,
      limit: 10,
      search: undefined,
      ordering: undefined,
      filter,
    }
  }

  const getString = (key: string): string | undefined => {
    const val = searchParams.get(key)
    return val?.trim() || undefined
  }

  const getInt = (key: string, fallback: number): number => {
    const val = parseInt(searchParams.get(key) || "", 10)
    return isNaN(val) || val < 1 ? fallback : val
  }

  const page = getInt("page", 1)

  const rawLimit = getInt("limit", 10)
  const limit = ALLOWED_LIMITS.includes(rawLimit) ? rawLimit : 10

  const search = getString("search")
  const ordering = getString("ordering")?.toLowerCase()

  const filter: Record<string, string> = {}
  searchParams.forEach((value, key) => {
    if (!RESERVED_KEYS.has(key)) {
      filter[key] = value
    }
  })

  // Apply default date range synchronously if URL has no dates
  if (options?.defaultRangePreset && !filter.start_date && !filter.end_date) {
    const preset = DATE_RANGE_PRESETS.find(
      (p) => p.label === options.defaultRangePreset,
    )
    if (preset?.range.from) {
      filter.start_date = formatBackDate(preset.range.from)
    }
    if (preset?.range.to) {
      filter.end_date = formatBackDate(preset.range.to)
    }
  }

  return {
    page,
    limit,
    search,
    ordering,
    filter,
  }
}

export default useSearchParameters
