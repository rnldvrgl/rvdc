import { Item } from '@/lib/constants/interface'
import type {
  PaginatedFilterProps,
  PaginatedResult,
} from '@/lib/constants/types'
import { useApiQuery } from '@/lib/hooks/useApiQuery'

export function useItems({
  page = 1,
  limit = 10,
  search,
  ordering,
}: PaginatedFilterProps = {}) {
  return useApiQuery<PaginatedResult<Item>>(
    ['items', page, limit, search, ordering],
    '/inventory/items/',
    {
      page,
      limit,
      search: search || undefined,
      ordering: ordering || undefined,
    },
  )
}

export function useItem(id: number) {
  return useApiQuery<Item>(['item', id], `/inventory/items/${id}/`, undefined, {
    enabled: !!id,
  })
}
