import { Stock, StockRoomStock, StockTransfer } from '@/lib/constants/interface'
import type { PaginatedFilterProps } from '@/lib/constants/types'
import { useFilters } from '@/lib/hooks/useFilters'
import { usePaginatedQuery } from '@/lib/hooks/usePaginatedQuery'

const stockUrl = '/inventory/stocks/'
const stockRoomUrl = '/inventory/stockroom/stocks/'
const transferUrl = '/inventory/stock-transfers/'

export function useStallStocks(props: PaginatedFilterProps = {}) {
  return usePaginatedQuery<Stock>({
    ...props,
    url: stockUrl,
    queryKeyBase: 'stall-stocks',
  })
}

export function useStockRoomStocks(props: PaginatedFilterProps = {}) {
  return usePaginatedQuery<StockRoomStock>({
    ...props,
    url: stockRoomUrl,
    queryKeyBase: 'stock-room-stocks',
  })
}

export function useStockTransfers(props: PaginatedFilterProps = {}) {
  return usePaginatedQuery<StockTransfer>({
    ...props,
    url: transferUrl,
    queryKeyBase: 'stock-transfers',
  })
}

export function useStockFilters() {
  return useFilters('stock-filters', `${stockUrl}filters/`)
}

export function useStockRoomFilters() {
  return useFilters('stock-room-filters', `${stockRoomUrl}filters/`)
}

export function useStockTransferFilters() {
  return useFilters('stock-transfer-filters', `${transferUrl}filters/`)
}
