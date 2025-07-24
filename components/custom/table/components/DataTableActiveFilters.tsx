'use client'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { FilterDefinition } from '@/lib/constants/types'
import { useNavigation } from '@/lib/hooks/useNavigation'
import useSearchParameters from '@/lib/hooks/useSearchParameters'
import { X } from 'lucide-react'

const EXCLUDED_KEYS = new Set(['start_date', 'end_date'])

type Props = {
  filters: FilterDefinition[]
}

function DataTableActiveFilters({ filters }: Props) {
  const { filter = {}, ...rest } = useSearchParameters()
  const { push } = useNavigation()

  const visibleEntries = Object.entries(filter).filter(
    ([key]) => !EXCLUDED_KEYS.has(key),
  )

  if (visibleEntries.length === 0) return null

  const removeFilter = (key: string) => {
    const { [key]: _, ...restFilters } = filter
    push({ ...rest, filter: restFilters })
  }

  const getFilterLabel = (key: string, value: string) => {
    const filterDef = filters.find((f) => f.key === key)
    if (!filterDef) return `${key}: ${value}`

    const optionLabel = filterDef.options?.find(
      (opt) => String(opt.value) === value,
    )?.label

    return `${filterDef.label}: ${optionLabel ?? value}`
  }

  return (
    <div className="flex flex-wrap gap-2">
      {visibleEntries.map(([key, value]) => (
        <Badge
          key={key}
          className="flex items-center gap-1 rounded-full px-2 py-1 text-sm"
        >
          <span className="capitalize">
            {getFilterLabel(key, String(value))}
          </span>
          <Button
            onClick={() => removeFilter(key)}
            variant="destructive"
            className="ml-1 size-4 !p-0.5 rounded-full"
            aria-label={`Remove ${key} filter`}
          >
            <X className="size-2" />
          </Button>
        </Badge>
      ))}
    </div>
  )
}

export default DataTableActiveFilters
