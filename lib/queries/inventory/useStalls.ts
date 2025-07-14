import { Stall } from '@/lib/constants/interface'
import type {
  PaginatedFilterProps,
  PaginatedResult,
} from '@/lib/constants/types'
import { useApiQuery } from '@/lib/hooks/useApiQuery'

const url = '/inventory/stalls/'
export function useStalls({
  page = 1,
  limit = 10,
  search,
  ordering,
  filter = {},
}: PaginatedFilterProps = {}) {
  return useApiQuery<PaginatedResult<Stall>>({
    queryKey: ['stalls', page, limit, search, ordering, filter],
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

export function useStall(id: number) {
  return useApiQuery<Stall>({
    queryKey: ['stall', id],
    url: `${url}${id}/`,
    options: {
      enabled: !!id,
    },
  })
}
