import type { Client, PaginatedFilterProps } from '@/lib/constants/types'
import { useFilters } from '@/lib/hooks/useFilters'
import { usePaginatedQuery } from '@/lib/hooks/usePaginatedQuery'

const url = '/clients/'

export function useClients(props: PaginatedFilterProps) {
  return usePaginatedQuery<Client>({
    ...props,
    url,
    queryKeyBase: 'clients',
  })
}

export function useClientFilters() {
  return useFilters('client-filters', `${url}filters/`)
}
