import type {
  PaginatedFilterProps,
  PaginatedResult,
  Technician,
} from '@/lib/constants/types'
import api from '@/lib/utils/api'
import { useQuery } from '@tanstack/react-query'
export function useTechnicians({
  page = 1,
  limit = 10,
  search,
  ordering,
}: PaginatedFilterProps) {
  return useQuery<PaginatedResult<Technician>>({
    queryKey: ['technicians', page, limit, search, ordering],
    queryFn: async () => {
      const res = await api.get<PaginatedResult<Technician>>(
        '/users/technicians',
        {
          params: {
            page,
            limit,
            search: search || undefined,
            ordering: ordering || undefined,
          },
        },
      )
      return res.data
    },
    staleTime: 1000 * 60 * 5,
  })
}
