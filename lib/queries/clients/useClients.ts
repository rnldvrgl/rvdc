import type { Client, PaginatedFilterProps } from '@/lib/constants/types'
import { usePaginatedQuery } from '@/lib/hooks/usePaginatedQuery'

export function useClients(props: PaginatedFilterProps) {
  return usePaginatedQuery<Client>({
    ...props,
    url: '/clients',
    queryKeyBase: 'clients',
  })
}
