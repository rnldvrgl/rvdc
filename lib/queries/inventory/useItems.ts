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
  return useApiQuery<PaginatedResult<Item>>({
    queryKey: ['items', page, limit, search, ordering, filter],
    url,
    params: {
      page,
      limit,
      search: search || undefined,
      ordering: ordering || undefined,
      ...filter,
    },
  })
}

export function useItem(id: number) {
  return useApiQuery<Item>({
    queryKey: ['item', id],
    url: `${url}${id}/`,
    options: {
      enabled: !!id,
    },
  })
}
