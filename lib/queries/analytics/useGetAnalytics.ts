import {
  AnalyticsSummary,
  CashFlow,
  ExpensesOvertime,
  SalesOvertime,
  TopClients,
  TopSellingItems,
  UnpaidSalesStatus,
} from '@/lib/constants/interface'
import { useApiQuery } from '@/lib/hooks/useApiQuery'

interface useGetAnalyticsOptions {
  start_date?: string
  end_date?: string
  stall?: number
  limit?: number
}

const baseUrl = '/analytics/'
const chartsUrl = '/analytics/charts/'

// Convert object to query string, skipping undefined/null
const buildQueryString = (params: Partial<useGetAnalyticsOptions>): string => {
  const query = new URLSearchParams()
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null) {
      query.append(key, String(value))
    }
  })
  const str = query.toString()
  return str ? `?${str}` : ''
}

// Summary
export const useGetSummary = (options: useGetAnalyticsOptions) =>
  useApiQuery<AnalyticsSummary>({
    queryKey: ['summary', options],
    url: `${baseUrl}summary/${buildQueryString(options)}`,
  })

// Sales Over Time
export const useSalesOverTime = (options: useGetAnalyticsOptions) =>
  useApiQuery<SalesOvertime[]>({
    queryKey: ['sales_over_time', options],
    url: `${chartsUrl}sales-over-time/${buildQueryString(options)}`,
  })

// Expenses Over Time
export const useExpensesOverTime = (options: useGetAnalyticsOptions) =>
  useApiQuery<ExpensesOvertime[]>({
    queryKey: ['expenses_over_time', options],
    url: `${chartsUrl}expenses-over-time/${buildQueryString(options)}`,
  })

// Top Selling Items
export const useTopSellingItems = (options: useGetAnalyticsOptions) =>
  useApiQuery<TopSellingItems[]>({
    queryKey: ['top_selling_items', options],
    url: `${chartsUrl}top-selling-items/${buildQueryString(options)}`,
  })

// Cash Flow (income + expense per day)
export const useCashFlow = (options: useGetAnalyticsOptions) =>
  useApiQuery<CashFlow[]>({
    queryKey: ['cash_flow', options],
    url: `${chartsUrl}cash-flow/${buildQueryString(options)}`,
  })

// Top Clients
export const useTopClients = (options: useGetAnalyticsOptions) =>
  useApiQuery<TopClients[]>({
    queryKey: ['top_clients', options],
    url: `${chartsUrl}top-clients/${buildQueryString(options)}`,
  })

// Unpaid Sales Status
export const useUnpaidSalesStatus = (options: useGetAnalyticsOptions) =>
  useApiQuery<UnpaidSalesStatus[]>({
    queryKey: ['unpaid_sales_status', options],
    url: `${chartsUrl}unpaid-sales-status/${buildQueryString(options)}`,
  })
