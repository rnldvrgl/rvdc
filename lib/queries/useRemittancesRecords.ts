import { RemittanceRecord } from "@/lib/constants/interface"
import type { PaginatedFilterProps } from "@/lib/constants/types"
import { useApiQuery } from "@/lib/hooks/useApiQuery"
import { useFilters } from "@/lib/hooks/useFilters"
import { usePaginatedQuery } from "@/lib/hooks/usePaginatedQuery"

const remittanceUrl = "/remittances/"

export function useRemittancesRecords(props: PaginatedFilterProps = {}) {
  return usePaginatedQuery<RemittanceRecord>({
    ...props,
    url: remittanceUrl,
    queryKeyBase: "remittances",
  })
}

export function useRemittancesRecordFilters() {
  return useFilters("remittance-filters", `${remittanceUrl}filters/`)
}

export interface RemittancePreview {
  date: string
  stall_id: number
  stall_name: string
  already_exists: boolean
  total_sales_cash: string
  total_sales_gcash: string
  total_sales_credit: string
  total_sales_debit: string
  total_sales_cheque: string
  total_collected: string
  total_expenses: string
  cod_from_previous: string
  expected_remittance: string
}

export function useRemittancePreview({
  stall,
  date,
}: {
  stall?: number
  date?: string
}) {
  return useApiQuery<RemittancePreview>({
    queryKey: ["remittance-preview", stall, date],
    url: `${remittanceUrl}preview/`,
    params: { stall, date },
    enabled: !!stall,
    staleTime: 1000 * 30, // 30s – fresh enough for preview
  })
}
