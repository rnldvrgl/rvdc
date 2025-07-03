import { StockTransfer } from '@/lib/constants/interface'
import type {
  PaginatedFilterProps,
  PaginatedResult,
} from '@/lib/constants/types'
import api from '@/lib/utils/api'
import { useQuery } from '@tanstack/react-query'

export function useStockTransfers({
  page = 1,
  limit = 10,
  search,
  ordering,
}: PaginatedFilterProps) {
  return useQuery<PaginatedResult<StockTransfer>>({
    queryKey: ['transfers', page, limit, search, ordering],
    queryFn: async () => {
      const res = await api.get<PaginatedResult<StockTransfer>>(
        '/inventory/transfers/',
        {
          params: {
            page,
            limit,
            search: search || undefined,
            ordering: ordering || undefined,
          },
        },
      )
      return res.data
    },
    staleTime: 1000 * 60 * 5,
  })
}
