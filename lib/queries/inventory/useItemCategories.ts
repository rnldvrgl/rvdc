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
}: PaginatedFilterProps = {}) {
  return useApiQuery<PaginatedResult<ProductCategory>>(
    ['categories', page, limit, search, ordering],
    url,
    {
      page,
      limit,
      search: search || undefined,
      ordering: ordering || undefined,
    },
  )
}

export function useItemCategory(id: number) {
  return useApiQuery<ProductCategory>(
    ['category', id],
    `${url}${id}/`,
    undefined,
    {
      enabled: !!id,
    },
  )
}
