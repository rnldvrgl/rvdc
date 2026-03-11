import { SalesTransaction } from "@/lib/constants/interface"
import type { PaginatedFilterProps } from "@/lib/constants/types"
import { useApiQuery } from "@/lib/hooks/useApiQuery"
import { useFilters } from "@/lib/hooks/useFilters"
import { usePaginatedQuery } from "@/lib/hooks/usePaginatedQuery"

const salesTransactionsUrl = "/sales/transactions/"

export function useSalesTransactions(props: PaginatedFilterProps = {}) {
  return usePaginatedQuery<SalesTransaction>({
    ...props,
    url: salesTransactionsUrl,
    queryKeyBase: "sales-transactions",
  })
}

export function useSalesTransaction(id: number | string | undefined) {
  return useApiQuery<SalesTransaction>({
    queryKey: ["sales-transaction", id],
    url: `${salesTransactionsUrl}${id}/`,
    options: {
      enabled: !!id,
    },
  })
}

export function useSalesTransactionFilters() {
  return useFilters(
    "sales-transaction-filters",
    `${salesTransactionsUrl}filters/`,
  )
}
