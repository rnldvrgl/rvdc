import { SalesTransaction } from '@/lib/constants/interface'
import type { PaginatedFilterProps } from '@/lib/constants/types'
import { usePaginatedQuery } from '@/lib/hooks/usePaginatedQuery'

const salesTransactionsUrl = '/sales/transactions/'

export function useSalesTransactions(props: PaginatedFilterProps = {}) {
  return usePaginatedQuery<SalesTransaction>({
    ...props,
    url: salesTransactionsUrl,
    queryKeyBase: 'sales-transactions',
  })
}
