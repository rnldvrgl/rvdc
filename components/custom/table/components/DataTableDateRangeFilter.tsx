'use client'

import DataTableDateRangePicker from '@/components/custom/table/components/DataTableDateRangePicker'
import { useNavigation } from '@/lib/hooks/useNavigation'
import useSearchParameters from '@/lib/hooks/useSearchParameters'
import { formatDateLocal } from '@/lib/utils/helpers'
import { DateRange } from 'react-day-picker'

export function DataTableDateRangeFilter() {
  const { limit, search, ordering, filter } = useSearchParameters()
  const { push } = useNavigation()

  const defaultRange: DateRange = {
    from: filter?.start_date ? new Date(filter.start_date) : undefined,
    to: filter?.end_date ? new Date(filter.end_date) : undefined,
  }

  const handleChange = (range?: DateRange) => {
    const from = range?.from ? formatDateLocal(range.from) : undefined
    const to = range?.to ? formatDateLocal(range.to) : undefined

    const updatedFilter = { ...filter }

    if (from) {
      updatedFilter.start_date = from
    } else {
      delete updatedFilter.start_date
    }

    if (to) {
      updatedFilter.end_date = to
    } else {
      delete updatedFilter.end_date
    }

    push({
      page: 1,
      limit,
      search,
      ordering,
      filter: updatedFilter,
    })
  }

  return (
    <DataTableDateRangePicker
      defaultValue={defaultRange}
      onChange={handleChange}
    />
  )
}
