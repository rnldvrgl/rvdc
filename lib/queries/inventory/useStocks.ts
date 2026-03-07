import { Stock, StockRoomStock } from "@/lib/constants/interface"
import type { PaginatedFilterProps } from "@/lib/constants/types"
import { useFilters } from "@/lib/hooks/useFilters"
import { usePaginatedQuery } from "@/lib/hooks/usePaginatedQuery"
import api from "@/lib/utils/api"
import { useQuery } from "@tanstack/react-query"

const stockUrl = "/inventory/stocks/"
const stockRoomUrl = "/inventory/stockroom/stocks/"

export function useStallStocks(props: PaginatedFilterProps = {}) {
  return usePaginatedQuery<Stock>({
    ...props,
    url: stockUrl,
    queryKeyBase: "stall-stocks",
  })
}

export function useStockRoomStocks(props: PaginatedFilterProps = {}) {
  return usePaginatedQuery<StockRoomStock>({
    ...props,
    url: stockRoomUrl,
    queryKeyBase: "stock-room-stocks",
  })
}

export function useStockFilters() {
  return useFilters("stock-filters", `${stockUrl}filters/`)
}

export function useStockRoomFilters() {
  return useFilters("stock-room-filters", `${stockRoomUrl}filters/`)
}

export interface StockStatusCounts {
  no_stock: number
  low_stock: number
  high_stock: number
}

export function useStallStockStatusCounts() {
  return useQuery<StockStatusCounts>({
    queryKey: ["stall-stock-status-counts"],
    queryFn: async () => {
      const { data } = await api.get(`${stockUrl}status-counts/`)
      return data
    },
  })
}

export function useStockRoomStatusCounts() {
  return useQuery<StockStatusCounts>({
    queryKey: ["stockroom-stock-status-counts"],
    queryFn: async () => {
      const { data } = await api.get(`${stockRoomUrl}status-counts/`)
      return data
    },
  })
}

export interface StockAuditData {
  stock_id: number
  item_name: string
  item_unit: string
  stall_name: string
  system_quantity: number
  reserved_quantity: number
  available_quantity: number
  reservations: {
    service_id: number
    client_name: string
    service_type: string
    service_status: string
    item_name: string
    quantity_used: number
    created_at: string
  }[]
}

export function useStockAudit(stockId: number | null) {
  return useQuery<StockAuditData>({
    queryKey: ["stock-audit", stockId],
    queryFn: async () => {
      const { data } = await api.get(`/inventory/stocks/${stockId}/audit/`)
      return data
    },
    enabled: !!stockId,
  })
}

export interface StockRoomAuditData {
  stock_id: number
  item_name: string
  item_unit: string
  system_quantity: number
}

export function useStockRoomAudit(stockId: number | null) {
  return useQuery<StockRoomAuditData>({
    queryKey: ["stockroom-audit", stockId],
    queryFn: async () => {
      const { data } = await api.get(
        `/inventory/stockroom/stocks/${stockId}/audit/`,
      )
      return data
    },
    enabled: !!stockId,
  })
}
