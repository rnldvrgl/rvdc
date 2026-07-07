import { STALE_TIME } from "@/lib/constants/general"
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
  client_fund_deposits_cash: string
  client_fund_deposits_gcash: string
  client_fund_deposits_credit: string
  client_fund_deposits_debit: string
  client_fund_deposits_cheque: string
  total_client_fund_deposits: string
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
    staleTime: STALE_TIME.REAL_TIME,
  })
}

export interface SubStallPayableService {
  service_id: number
  client_name: string
  sub_stall_revenue: string
  paid_today: string
}

export interface SubStallPayable {
  date: string
  sub_stall_id: number
  sub_stall_name: string
  sales_cash: string
  sales_gcash: string
  sales_credit: string
  sales_debit: string
  sales_cheque: string
  total_sales: string
  e_payments_total: string
  cash_payable: string
  services: SubStallPayableService[]
}

export function useSubStallPayable() {
  return useApiQuery<SubStallPayable>({
    queryKey: ["sub-stall-payable"],
    url: `${remittanceUrl}sub-stall-payable/`,
    staleTime: STALE_TIME.SHORT,
  })
}
