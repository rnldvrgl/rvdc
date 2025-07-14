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
  return useApiQuery<PaginatedResult<Stock>>(
    ['stall-stocks', page, limit, search, ordering, filter],
    stockUrl,
    {
      page,
      limit,
      search: search || undefined,
      ordering: ordering || undefined,
      ...filter, // spread extra filters
    },
  )
}

export function useStockRoomStocks({
  page = 1,
  limit = 10,
  search,
  ordering,
  filter = {},
}: PaginatedFilterProps & { filter?: Record<string, any> } = {}) {
  return useApiQuery<PaginatedResult<StockRoomStock>>(
    ['stock-room-stocks', page, limit, search, ordering, filter],
    stockRoomUrl,
    {
      page,
      limit,
      search: search || undefined,
      ordering: ordering || undefined,
      ...filter,
    },
  )
}

export function useStockTransfers({
  page = 1,
  limit = 10,
  search,
  ordering,
  filter = {},
}: PaginatedFilterProps) {
  return useApiQuery<PaginatedResult<StockTransfer>>(
    ['stock-transfers', page, limit, search, ordering, filter],
    transferUrl,
    {
      page,
      limit,
      search: search || undefined,
      ordering: ordering || undefined,
      ...filter,
    },
  )
}
