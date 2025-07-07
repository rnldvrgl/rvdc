import type {
  Client,
  PaginatedFilterProps,
  PaginatedResult,
} from '@/lib/constants/types'
import api from '@/lib/utils/api'
import { useQuery } from '@tanstack/react-query'

export function useClients({
  page = 1,
  limit = 10,
  search,
  ordering,
  filter = {},
}: PaginatedFilterProps) {
  return useQuery<PaginatedResult<Client>>({
    queryKey: ['clients', page, limit, search, ordering, filter],
    queryFn: async () => {
      const res = await api.get<PaginatedResult<Client>>('/clients', {
        params: {
          page,
          limit,
          search: search || undefined,
          ordering: ordering || undefined,
          ...filter,
        },
      })
      return res.data
    },
    staleTime: 1000 * 60 * 5,
  })
}
