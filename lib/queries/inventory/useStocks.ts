import { Stock, StockRoomStock, StockTransfer } from '@/lib/constants/interface'
import type {
  PaginatedFilterProps,
  PaginatedResult,
} from '@/lib/constants/types'
import { useApiQuery } from '@/lib/hooks/useApiQuery'

const stockUrl = '/inventory/stocks/'
const stockRoomUrl = '/inventory/stockroom/stocks/'
const transferUrl = '/inventory/stock-transfers/'

export function useStallStocks({
  page = 1,
  limit = 10,
  search,
  ordering,
  filter = {},
}: PaginatedFilterProps) {
  return useApiQuery<PaginatedResult<Stock>>({
    queryKey: ['stall-stocks', page, limit, search, ordering, filter],
    url: stockUrl,
    params: {
      page,
      limit,
      search: search || undefined,
      ordering: ordering || undefined,
      ...filter,
    },
  })
}

export function useStockRoomStocks({
  page = 1,
  limit = 10,
  search,
  ordering,
  filter = {},
}: PaginatedFilterProps & { filter?: Record<string, any> } = {}) {
  return useApiQuery<PaginatedResult<StockRoomStock>>({
    queryKey: ['stock-room-stocks', page, limit, search, ordering, filter],
    url: stockRoomUrl,
    params: {
      page,
      limit,
      search: search || undefined,
      ordering: ordering || undefined,
      ...filter,
    },
  })
}

export function useStockTransfers({
  page = 1,
  limit = 10,
  search,
  ordering,
  filter = {},
}: PaginatedFilterProps) {
  return useApiQuery<PaginatedResult<StockTransfer>>({
    queryKey: ['stock-transfers', page, limit, search, ordering, filter],
    url: transferUrl,
    params: {
      page,
      limit,
      search: search || undefined,
      ordering: ordering || undefined,
      ...filter,
    },
  })
}
