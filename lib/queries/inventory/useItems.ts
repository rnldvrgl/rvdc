import { Item } from '@/lib/constants/interface'
import type { PaginatedFilterProps } from '@/lib/constants/types'
import { useApiQuery } from '@/lib/hooks/useApiQuery'
import { useFilters } from '@/lib/hooks/useFilters'
import { usePaginatedQuery } from '@/lib/hooks/usePaginatedQuery'

const url = '/inventory/items/'

export function useItems(props: PaginatedFilterProps = {}) {
  return usePaginatedQuery<Item>({
    ...props,
    url,
    queryKeyBase: 'items',
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

export function useItemFilters() {
  return useFilters('item-filters', `${url}filters/`)
}
