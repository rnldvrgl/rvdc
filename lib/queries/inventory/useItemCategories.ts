// src/lib/queries/useItemCategories.ts
import type { ProductCategory } from '@/lib/constants/interface'
import type {
  PaginatedFilterProps,
  PaginatedResult,
} from '@/lib/constants/types'
import { useApiQuery } from '@/lib/hooks/useApiQuery'

const url = '/inventory/categories/'

export function useItemCategories({
  page = 1,
  limit = 10,
  search,
  ordering,
  filter = {},
}: PaginatedFilterProps = {}) {
  return useApiQuery<PaginatedResult<ProductCategory>>({
    queryKey: ['categories', page, limit, search, ordering, filter],
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

export function useItemCategory(id: number) {
  return useApiQuery<ProductCategory>({
    queryKey: ['category', id],
    url: `${url}${id}/`,
    options: {
      enabled: !!id,
    },
  })
}
