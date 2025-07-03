import type {
  PaginatedFilterProps,
  PaginatedResult,
  Technician,
} from '@/lib/constants/types'
import { useApiQuery } from '@/lib/hooks/useApiQuery'

export function useTechnician(id: string) {
  return useApiQuery<Technician>(
    ['technician', id],
    `/users/technicians/${id}/`,
    undefined,
  )
}

export function useTechnicians({
  page = 1,
  limit = 10,
  search,
  ordering,
}: PaginatedFilterProps) {
  return useApiQuery<PaginatedResult<Technician>>(
    ['technicians', page, limit, search, ordering],
    '/users/technicians',
    {
      page,
      limit,
      search: search || undefined,
      ordering: ordering || undefined,
    },
  )
}
