import { RemittanceRecord } from '@/lib/constants/infers'
import type { PaginatedFilterProps } from '@/lib/constants/types'
import { useFilters } from '@/lib/hooks/useFilters'
import { usePaginatedQuery } from '@/lib/hooks/usePaginatedQuery'

const remittanceUrl = '/remittances/'

export function useRemittancesRecords(props: PaginatedFilterProps = {}) {
  return usePaginatedQuery<RemittanceRecord>({
    ...props,
    url: remittanceUrl,
    queryKeyBase: 'remittances',
  })
}

export function useRemittancesRecordFilters() {
  return useFilters('remittance-filters', `${remittanceUrl}filters/`)
}
