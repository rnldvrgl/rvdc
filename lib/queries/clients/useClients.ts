import type {
  Client,
  PaginatedFilterProps,
  PaginatedResult,
} from '@/lib/constants/types'
import { useApiQuery } from '@/lib/hooks/useApiQuery'

export function useClients({
  page = 1,
  limit = 10,
  search,
  ordering,
  filter = {},
}: PaginatedFilterProps) {
  return useApiQuery<PaginatedResult<Client>>({
    queryKey: ['clients', page, limit, search, ordering, filter],
    url: '/clients',
    params: {
      page,
      limit,
      search: search || undefined,
      ordering: ordering || undefined,
      ...filter,
    },
  })
}
