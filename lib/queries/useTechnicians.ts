import type {
  PaginatedFilterProps,
  PaginatedResult,
  Technician,
} from '@/lib/constants/types'
import { useApiQuery } from '@/lib/hooks/useApiQuery'

const url = '/users/technicians/'

export function useTechnician(id: string) {
  return useApiQuery<Technician>(['technician', id], `${url}${id}/`, undefined)
}

export function useTechnicians({
  page = 1,
  limit = 10,
  search,
  ordering,
  filter = {},
}: PaginatedFilterProps) {
  return useApiQuery<PaginatedResult<Technician>>(
    ['technicians', page, limit, search, ordering, filter],
    url,
    {
      page,
      limit,
      search: search || undefined,
      ordering: ordering || undefined,
      ...filter,
    },
  )
}
