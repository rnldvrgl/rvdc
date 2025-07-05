import { Item } from '@/lib/constants/interface'
import type {
  PaginatedFilterProps,
  PaginatedResult,
} from '@/lib/constants/types'
import { useApiQuery } from '@/lib/hooks/useApiQuery'

const url = '/inventory/items/'
export function useItems({
  page = 1,
  limit = 10,
  search,
  ordering,
  filter = {},
}: PaginatedFilterProps = {}) {
  return useApiQuery<PaginatedResult<Item>>(
    ['items', page, limit, search, ordering, filter],
    url,
    {
      page,
      limit,
      search: search || undefined,
      ordering: ordering || undefined,
      ...filter,
    },
  )
}

export function useItem(id: number) {
  return useApiQuery<Item>(['item', id], `${url}${id}/`, undefined, {
    enabled: !!id,
  })
}
