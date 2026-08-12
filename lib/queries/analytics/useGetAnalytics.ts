import {
  AnalyticsSummary,
  BusinessInsightsResponse,
  CashFlow,
  ExpensesOvertime,
  SalesOvertime,
  TopClients,
  TopSellingItems,
  UnpaidSalesStatus,
} from "@/lib/constants/interface"
import { useApiQuery } from "@/lib/hooks/useApiQuery"

interface useGetAnalyticsOptions {
  start_date?: string
  end_date?: string
  stall?: number
  limit?: number
}

const baseUrl = "/analytics/"
const chartsUrl = "/analytics/charts/"

// Convert object to query string, skipping undefined/null
const buildQueryString = (params: Partial<useGetAnalyticsOptions>): string => {
  const query = new URLSearchParams()
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null) {
      query.append(key, String(value))
    }
  })
  const str = query.toString()
  return str ? `?${str}` : ""
}

// Summary
export const useGetSummary = (
  options: useGetAnalyticsOptions & { enabled?: boolean },
) =>
  useApiQuery<AnalyticsSummary>({
    queryKey: ["summary", options],
    url: `${baseUrl}summary/${buildQueryString(options)}`,
    enabled: options.enabled,
  })

// Sales Over Time
export const useSalesOverTime = (options: useGetAnalyticsOptions) =>
  useApiQuery<SalesOvertime[]>({
    queryKey: ["sales_over_time", options],
    url: `${chartsUrl}sales-over-time/${buildQueryString(options)}`,
  })

// Expenses Over Time
export const useExpensesOverTime = (options: useGetAnalyticsOptions) =>
  useApiQuery<ExpensesOvertime[]>({
    queryKey: ["expenses_over_time", options],
    url: `${chartsUrl}expenses-over-time/${buildQueryString(options)}`,
  })

// Top Selling Items
export const useTopSellingItems = (options: useGetAnalyticsOptions) =>
  useApiQuery<TopSellingItems[]>({
    queryKey: ["top_selling_items", options],
    url: `${chartsUrl}top-selling-items/${buildQueryString(options)}`,
  })

// Cash Flow (income + expense per day)
export const useCashFlow = (options: useGetAnalyticsOptions) =>
  useApiQuery<CashFlow[]>({
    queryKey: ["cash_flow", options],
    url: `${chartsUrl}cash-flow/${buildQueryString(options)}`,
  })

// Top Clients
export const useTopClients = (options: useGetAnalyticsOptions) =>
  useApiQuery<TopClients[]>({
    queryKey: ["top_clients", options],
    url: `${chartsUrl}top-clients/${buildQueryString(options)}`,
  })

// Unpaid Sales Status
export const useUnpaidSalesStatus = (options: useGetAnalyticsOptions) =>
  useApiQuery<UnpaidSalesStatus[]>({
    queryKey: ["unpaid_sales_status", options],
    url: `${chartsUrl}unpaid-sales-status/${buildQueryString(options)}`,
  })

// Employee Performance
export interface EmployeePerformanceData {
  start_date: string
  end_date: string
  top_service_types: {
    service_type: string
    count: number
    revenue: number
    top_technician: {
      employee_id: number
      employee_name: string
      completed_count: number
    } | null
  }[]
  top_technicians: {
    employee_id: number
    employee_name: string
    total_assignments: number
    completed: number
    completion_rate: number
    total_revenue: number
  }[]
  most_late: {
    employee_id: number
    employee_name: string
    late_count: number
    total_late_minutes: number
  }[]
  most_punctual: {
    employee_id: number
    employee_name: string
    total_days: number
    on_time_days: number
    late_days: number
    punctuality_rate: number
    total_paid_hours: number
    full_days: number
  }[]
}

export const useEmployeePerformance = (
  options: useGetAnalyticsOptions & { enabled?: boolean },
) =>
  useApiQuery<EmployeePerformanceData>({
    queryKey: ["employee_performance", options],
    url: `/analytics/reports/employee-performance/${buildQueryString(options)}`,
    enabled: options.enabled,
  })

export const useBusinessInsights = (
  options: useGetAnalyticsOptions & { enabled?: boolean },
) =>
  useApiQuery<BusinessInsightsResponse>({
    queryKey: ["business_insights", options],
    url: `/analytics/reports/business-insights/${buildQueryString(options)}`,
    enabled: options.enabled,
  })
