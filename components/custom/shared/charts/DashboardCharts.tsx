'use client'

import PieChart from '@/components/custom/shared/charts/PieChart'
import TimeSeriesAreaChart from '@/components/custom/shared/charts/TimeSeriesAreaChart'
import VerticalBarChart from '@/components/custom/shared/charts/VerticalBarChart'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { useDateParamsFromForm } from '@/lib/hooks/useDateParamsFromForm'
import {
  useCashFlow,
  useExpensesOverTime,
  useSalesOverTime,
  useTopClients,
  useTopSellingItems,
  useUnpaidSalesStatus,
} from '@/lib/queries/analytics/useGetAnalytics'

const ChartCard = ({
  title,
  isLoading,
  children,
}: {
  title: string
  isLoading: boolean
  children: React.ReactNode
}) => (
  <Card>
    <CardHeader>
      <CardTitle className="text-base font-semibold">{title}</CardTitle>
    </CardHeader>
    <CardContent className="h-[300px]">
      {isLoading ? <Skeleton className="w-full h-full rounded-xl" /> : children}
    </CardContent>
  </Card>
)

export default function DashboardCharts() {
  const { start_date, end_date, stall } = useDateParamsFromForm()

  const { data: salesOvertime, isLoading: salesOvertimeLoading } =
    useSalesOverTime({ start_date, end_date, stall })
  const { data: expensesOvertime, isLoading: expensesOvertimeLoading } =
    useExpensesOverTime({ start_date, end_date, stall })
  const { data: topSellingItems, isLoading: topSellingItemsLoading } =
    useTopSellingItems({ start_date, end_date, stall })
  const { data: cashFlow, isLoading: cashFlowLoading } = useCashFlow({
    start_date,
    end_date,
    stall,
  })
  const { data: topClients, isLoading: topClientsLoading } = useTopClients({
    start_date,
    end_date,
    stall,
  })
  const { data: unpaidSalesStatus, isLoading: unpaidSalesStatusLoading } =
    useUnpaidSalesStatus({ start_date, end_date, stall })

  return (
    <div className="grid gap-6 xl:grid-cols-2">
      <ChartCard
        title="Sales Over Time"
        isLoading={salesOvertimeLoading}
      >
        <TimeSeriesAreaChart
          data={salesOvertime || []}
          lines={[
            { key: 'total_sales', color: '#22c55e', label: 'Total Sales' },
          ]}
        />
      </ChartCard>

      <ChartCard
        title="Expenses Over Time"
        isLoading={expensesOvertimeLoading}
      >
        <TimeSeriesAreaChart
          data={expensesOvertime || []}
          lines={[
            { key: 'total_expense', color: '#ef4444', label: 'Total Expenses' },
          ]}
        />
      </ChartCard>

      <ChartCard
        title="Cash Flow"
        isLoading={cashFlowLoading}
      >
        <TimeSeriesAreaChart
          data={cashFlow || []}
          lines={[
            { key: 'income', color: '#3b82f6', label: 'Income' },
            { key: 'expense', color: '#f97316', label: 'Expense' },
          ]}
        />
      </ChartCard>

      <ChartCard
        title="Top Selling Items"
        isLoading={topSellingItemsLoading}
      >
        <VerticalBarChart
          data={topSellingItems || []}
          xKey="item"
          yKey="quantity"
          color="#10b981"
        />
      </ChartCard>

      <ChartCard
        title="Top Clients"
        isLoading={topClientsLoading}
      >
        <VerticalBarChart
          data={topClients || []}
          xKey="client"
          yKey="total_spent"
          color="#facc15"
        />
      </ChartCard>

      <ChartCard
        title="Unpaid Sales Status"
        isLoading={unpaidSalesStatusLoading}
      >
        <PieChart
          data={unpaidSalesStatus || []}
          nameKey="status"
          valueKey="count"
        />
      </ChartCard>
    </div>
  )
}
