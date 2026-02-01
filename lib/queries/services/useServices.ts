import { Service } from '@/lib/constants/interface'
import type { PaginatedFilterProps } from '@/lib/constants/types'
import { useFilters } from '@/lib/hooks/useFilters'
import { usePaginatedQuery } from '@/lib/hooks/usePaginatedQuery'

const servicesUrl = '/services/services/'

export function useServices(props: PaginatedFilterProps = {}) {
  return usePaginatedQuery<Service>({
    ...props,
    url: servicesUrl,
    queryKeyBase: 'services',
  })
}

export function useServiceFilters() {
  return useFilters(
    'service-filters',
    `${servicesUrl}filters/`,
  )
}
