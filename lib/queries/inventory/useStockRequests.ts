import { DirectStockRequestBatch, StockRequest } from "@/lib/constants/interface"
import type { PaginatedFilterProps } from "@/lib/constants/types"
import { usePaginatedQuery } from "@/lib/hooks/usePaginatedQuery"
import api from "@/lib/utils/api"
import { useQuery } from "@tanstack/react-query"

const stockRequestUrl = "/inventory/stock-requests/"
const directBatchUrl = "/inventory/direct-stock-batches/"

export function useStockRequests(props: PaginatedFilterProps = {}) {
  return usePaginatedQuery<StockRequest>({
    ...props,
    url: stockRequestUrl,
    queryKeyBase: "stock-requests",
  })
}

export function usePendingStockRequestCount() {
  return useQuery<{ count: number }>({
    queryKey: ["stock-requests", "pending-count"],
    queryFn: async () => {
      const { data } = await api.get(`${stockRequestUrl}pending-count/`)
      return data
    },
  })
}

export function useDirectStockBatches(props: PaginatedFilterProps = {}) {
  return usePaginatedQuery<DirectStockRequestBatch>({
    ...props,
    url: directBatchUrl,
    queryKeyBase: "direct-stock-batches",
  })
}
