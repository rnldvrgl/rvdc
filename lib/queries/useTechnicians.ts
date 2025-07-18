import type { PaginatedFilterProps, Technician } from '@/lib/constants/types'
import { useApiQuery } from '@/lib/hooks/useApiQuery'
import { usePaginatedQuery } from '@/lib/hooks/usePaginatedQuery'

const url = '/users/technicians/'

export function useTechnician(id: string) {
  return useApiQuery<Technician>({
    queryKey: ['technician', id],
    url: `${url}${id}/`,
    options: {
      enabled: !!id,
    },
  })
}

export function useTechnicians(props: PaginatedFilterProps = {}) {
  return usePaginatedQuery<Technician>({
    ...props,
    url,
    queryKeyBase: 'technicians',
  })
}
