import type { TPaginatedClients } from '@/lib/constants/types'
import api from '@/lib/utils/api'
import { useQuery } from '@tanstack/react-query'

type UseClientsProps = {
  page?: number
  limit?: number
  search?: string
  ordering?: string
}

export function useClients({
  page = 1,
  limit = 10,
  search,
  ordering,
}: UseClientsProps) {
  return useQuery<TPaginatedClients>({
    queryKey: ['clients', page, limit, search, ordering],
    queryFn: async () => {
      const res = await api.get<TPaginatedClients>('/clients', {
        params: {
          page,
          limit,
          search: search || undefined,
          ordering: ordering || undefined,
        },
      })
      return res.data
    },
    staleTime: 1000 * 60 * 5,
  })
}
