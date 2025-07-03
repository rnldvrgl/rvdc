// src/lib/queries/useItemCategories.ts
import type { ProductCategory } from '@/lib/constants/interface'
import type {
  PaginatedFilterProps,
  PaginatedResult,
} from '@/lib/constants/types'
import { useApiQuery } from '@/lib/hooks/useApiQuery'

export function useItemCategories({
  page = 1,
  limit = 10,
  search,
  ordering,
}: PaginatedFilterProps = {}) {
  return useApiQuery<PaginatedResult<ProductCategory>>(
    ['categories', page, limit, search, ordering],
    '/inventory/categories/',
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
    `/inventory/categories/${id}/`,
    undefined,
    {
      enabled: !!id,
    },
  )
}
