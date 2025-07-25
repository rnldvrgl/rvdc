import {
  FilterDefinition,
  FilterResponse,
  LabeledOption,
  SortOption,
} from '@/lib/constants/interface'
import { useApiQuery } from '@/lib/hooks/useApiQuery'

function toFilterDefinitions(
  filters: Record<string, LabeledOption[]>,
): FilterDefinition[] {
  return Object.entries(filters).map(([key, options]) => ({
    key,
    label: key.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase()),
    options,
  }))
}

function toOrderingOptions(ordering: LabeledOption[]): SortOption[] {
  return ordering.map((opt) => ({
    value: opt.value,
    label: opt.label,
  }))
}

export function useFilters(key: string, url: string) {
  const query = useApiQuery<FilterResponse>({ queryKey: [key], url })

  const filters = query.data ? toFilterDefinitions(query.data.filters) : []
  const orderingOptions = query.data
    ? toOrderingOptions(query.data.ordering)
    : []

  return {
    ...query,
    filters,
    orderingOptions,
  }
}
