import type { ProductCategory } from '@/lib/constants/interface'
import type { PaginatedFilterProps } from '@/lib/constants/types'
import { useApiQuery } from '@/lib/hooks/useApiQuery'
import { usePaginatedQuery } from '@/lib/hooks/usePaginatedQuery'

const url = '/inventory/categories/'

export function useItemCategories(props: PaginatedFilterProps = {}) {
  return usePaginatedQuery<ProductCategory>({
    ...props,
    url,
    queryKeyBase: 'categories',
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
