import type {
  PaginatedFilterProps,
  PaginatedResult,
  Technician,
} from '@/lib/constants/types'
import { useApiQuery } from '@/lib/hooks/useApiQuery'

const url = '/users/technicians/'

export function useTechnician(id: string) {
  return useApiQuery<Technician>({
    queryKey: ['technician', id],
    url: `${url}${id}/`,
  })
}

export function useTechnicians({
  page = 1,
  limit = 10,
  search,
  ordering,
  filter = {},
}: PaginatedFilterProps) {
  return useApiQuery<PaginatedResult<Technician>>({
    queryKey: ['technicians', page, limit, search, ordering, filter],
    url,
    params: {
      page,
      limit,
      search: search || undefined,
      ordering: ordering || undefined,
      ...filter,
    },
  })
}
