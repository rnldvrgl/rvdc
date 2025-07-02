import type { PaginatedResult, Technician } from '@/lib/constants/types'
import api from '@/lib/utils/api'
import { useQuery } from '@tanstack/react-query'
export function useTechnician(id: string) {
  return useQuery<PaginatedResult<Technician>>({
    queryKey: ['technician', id],
    queryFn: async () => {
      const res = await api.get<PaginatedResult<Technician>>(
        `/users/technicians/${id}/`,
      )
      return res.data
    },
    staleTime: 1000 * 60 * 5,
  })
}
