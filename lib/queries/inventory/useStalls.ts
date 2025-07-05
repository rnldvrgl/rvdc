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
}: PaginatedFilterProps = {}) {
  return useApiQuery<PaginatedResult<Stall>>(
    ['stalls', page, limit, search, ordering],
    url,
    {
      page,
      limit,
      search: search || undefined,
      ordering: ordering || undefined,
    },
  )
}

export function useStall(id: number) {
  return useApiQuery<Stall>(['stall', id], `${url}${id}/`, undefined, {
    enabled: !!id,
  })
}
