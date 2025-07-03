import { StockRoomStock } from '@/lib/constants/interface'
import type {
  PaginatedFilterProps,
  PaginatedResult,
} from '@/lib/constants/types'
import api from '@/lib/utils/api'
import { useQuery } from '@tanstack/react-query'

export function useStockRoomStocks({
  page = 1,
  limit = 10,
  search,
  ordering,
}: PaginatedFilterProps) {
  return useQuery<PaginatedResult<StockRoomStock>>({
    queryKey: ['stockroom', page, limit, search, ordering],
    queryFn: async () => {
      const res = await api.get<PaginatedResult<StockRoomStock>>(
        '/inventory/stock-room/',
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
