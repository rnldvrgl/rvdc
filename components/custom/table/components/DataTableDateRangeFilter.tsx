'use client'

import DataTableDateRangePicker from '@/components/custom/table/components/DataTableDateRangePicker'
import { DateRangePresetLabel } from '@/lib/constants/types'
import { useDefaultDateRange } from '@/lib/hooks/useDefaultRange'
import { useNavigation } from '@/lib/hooks/useNavigation'
import useSearchParameters from '@/lib/hooks/useSearchParameters'
import { formatBackDate } from '@/lib/utils/helpers/date'
import { useCallback, useEffect, useMemo, useRef } from 'react'
import { DateRange } from 'react-day-picker'

export function DataTableDateRangeFilter({
  defaultRangePreset,
}: {
  defaultRangePreset?: DateRangePresetLabel
}) {
  const { limit, search, ordering, filter } = useSearchParameters()
  const { push } = useNavigation()

  const computedDefaultRange = useDefaultDateRange(
    defaultRangePreset || 'Today',
  )

  const defaultRange = useMemo(
    () => (defaultRangePreset ? computedDefaultRange : undefined),
    [computedDefaultRange, defaultRangePreset],
  )

  const hasInitialized = useRef(false)

  const handleChange = useCallback(
    (range?: DateRange) => {
      const from = range?.from ? formatBackDate(range.from) : undefined
      const to = range?.to ? formatBackDate(range.to) : undefined
      const updatedFilter = { ...filter }

      if (from) updatedFilter.start_date = from
      else delete updatedFilter.start_date

      if (to) updatedFilter.end_date = to
      else delete updatedFilter.end_date

      push({
        page: 1,
        limit,
        search,
        ordering,
        filter: updatedFilter,
      })
    },
    [filter, limit, search, ordering, push],
  )

  // Only run on first mount if defaultRange exists
  useEffect(() => {
    if (!hasInitialized.current && defaultRange) {
      hasInitialized.current = true
      handleChange(defaultRange)
    }
  }, [defaultRange, handleChange])

  return (
    <DataTableDateRangePicker
      defaultValue={defaultRange}
      onChange={handleChange}
    />
  )
}
