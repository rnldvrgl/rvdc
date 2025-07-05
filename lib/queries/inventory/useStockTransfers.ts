'use client'

import { StockTransfer } from '@/lib/constants/interface'
import type {
  PaginatedFilterProps,
  PaginatedResult,
} from '@/lib/constants/types'
import { useApiQuery } from '@/lib/hooks/useApiQuery'

const url = '/inventory/stocks/transfers/'

export function useStockTransfers({
  page = 1,
  limit = 10,
  search,
  ordering,
}: PaginatedFilterProps = {}) {
  return useApiQuery<PaginatedResult<StockTransfer>>(
    ['stock-transfers', page, limit, search, ordering],
    url,
    {
      page,
      limit,
      search: search || undefined,
      ordering: ordering || undefined,
    },
  )
}
