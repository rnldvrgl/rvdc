import { SalesTransaction } from '@/lib/constants/interface'
import type {
  PaginatedFilterProps,
  PaginatedResult,
} from '@/lib/constants/types'
import { useApiQuery } from '@/lib/hooks/useApiQuery'

const salesTransactionsUrl = '/sales/transactions/'

export function useSalesTransactions({
  page = 1,
  limit = 10,
  search,
  ordering,
  filter = {},
}: PaginatedFilterProps & { filter?: Record<string, any> } = {}) {
  return useApiQuery<PaginatedResult<SalesTransaction>>({
    queryKey: ['sales-transactions', page, limit, search, ordering, filter],
    url: salesTransactionsUrl,
    params: {
      page,
      limit,
      search: search || undefined,
      ordering: ordering || undefined,
      ...filter,
    },
  })
}
