import { ChequeCollection } from '@/lib/constants/interface'
import type { PaginatedFilterProps } from '@/lib/constants/types'
import { useFilters } from '@/lib/hooks/useFilters'
import { usePaginatedQuery } from '@/lib/hooks/usePaginatedQuery'

const chequeUrl = '/receivables/cheques/'

export function useChequeCollections(props: PaginatedFilterProps = {}) {
  return usePaginatedQuery<ChequeCollection>({
    ...props,
    url: chequeUrl,
    queryKeyBase: 'cheque-collections',
  })
}

export function useChequeCollectionFilters() {
  return useFilters('cheque-collection-filters', `${chequeUrl}filters/`)
}
