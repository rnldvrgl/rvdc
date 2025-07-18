import {
  AnalyticsSummary,
  ExpensesOvertime,
  SalesOvertime,
} from '@/lib/constants/interface'
import { useApiQuery } from '@/lib/hooks/useApiQuery'

interface useGetAnalyticsOptions {
  start_date?: string
  end_date?: string
  stall?: number
}

const url = '/analytics/'
const chartsUrl = '/analytics/charts/'

// Utility: convert object to query string, excluding undefined
const buildQueryString = (params: useGetAnalyticsOptions): string => {
  const query = new URLSearchParams()
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null) {
      query.append(key, String(value))
    }
  })
  const str = query.toString()
  return str ? `?${str}` : ''
}

const useGetSummary = (options: useGetAnalyticsOptions) => {
  return useApiQuery<AnalyticsSummary>({
    queryKey: ['summary', options],
    url: `${url}summary/${buildQueryString(options)}`,
  })
}

const useSalesOverTime = (options: useGetAnalyticsOptions) => {
  return useApiQuery<SalesOvertime>({
    queryKey: ['sales_over_time', options],
    url: `${chartsUrl}sales-over-time/${buildQueryString(options)}`,
  })
}

const useExpensesOverTime = (options: useGetAnalyticsOptions) => {
  return useApiQuery<ExpensesOvertime>({
    queryKey: ['expenses_over_time', options],
    url: `${chartsUrl}expenses-over-time/${buildQueryString(options)}`,
  })
}

export { useExpensesOverTime, useGetSummary, useSalesOverTime }
