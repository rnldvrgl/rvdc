import { Stall } from '@/lib/constants/interface'
import type { PaginatedFilterProps } from '@/lib/constants/types'
import { useApiQuery } from '@/lib/hooks/useApiQuery'
import { usePaginatedQuery } from '@/lib/hooks/usePaginatedQuery'

const url = '/inventory/stalls/'

export function useStalls(props: PaginatedFilterProps = {}) {
  return usePaginatedQuery<Stall>({
    ...props,
    url,
    queryKeyBase: 'stalls',
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
