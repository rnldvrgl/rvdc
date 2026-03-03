"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { useDateParamsFromForm } from "@/lib/hooks/useDateParamsFromForm"
import {
  useCashFlow,
  useExpensesOverTime,
  useSalesOverTime,
  useTopClients,
  useTopSellingItems,
  useUnpaidSalesStatus,
} from "@/lib/queries/analytics/useGetAnalytics"
import {
  DollarSign,
  Package,
  PieChart,
  TrendingDown,
  TrendingUp,
  Users,
} from "lucide-react"
import BarChart from "./BarChart"
import DonutChart from "./DonutChart"
import TimeSeriesChart from "./TimeSeriesChart"

const ChartCard = ({
  title,
  isLoading,
  children,
  icon: Icon,
  description,
}: {
  title: string
  isLoading: boolean
  children: React.ReactNode
  icon?: React.ElementType
  description?: string
}) => (
  <div className="transform transition-all duration-300 hover:-translate-y-1">
    <Card className="overflow-hidden border border-slate-200/60 dark:border-slate-700/50 shadow-sm hover:shadow-lg transition-all duration-300 bg-linear-to-br from-white via-white to-slate-50/40 dark:from-slate-900/90 dark:via-slate-900/80 dark:to-slate-800/50">
      <CardHeader className="pb-4 border-b border-slate-200/60 dark:border-slate-700/40 bg-linear-to-r from-transparent via-slate-50/30 to-transparent dark:from-transparent dark:via-slate-800/30 dark:to-transparent">
        <CardTitle className="text-lg font-bold flex items-center gap-3">
          {Icon && (
            <div className="p-2.5 rounded-xl bg-linear-to-br from-slate-100 to-slate-200/80 dark:from-slate-800 dark:to-slate-700/60 shadow-sm">
              <Icon className="size-4.5 text-slate-700 dark:text-slate-300" />
            </div>
          )}
          <span className="bg-linear-to-r from-slate-900 to-slate-700 dark:from-slate-100 dark:to-slate-300 bg-clip-text text-transparent">
            {title}
          </span>
        </CardTitle>
        {description && (
          <p className="text-sm text-muted-foreground/90 mt-1.5 ml-12">
            {description}
          </p>
        )}
      </CardHeader>
      <CardContent className="h-80 p-5">
        {isLoading ? (
          <Skeleton className="w-full h-full rounded-lg bg-linear-to-br from-slate-100 to-slate-200/50 dark:from-slate-800 dark:to-slate-700/50" />
        ) : (
          <div className="w-full h-full animate-in fade-in duration-300">
            {children}
          </div>
        )}
      </CardContent>
    </Card>
  </div>
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
    <div className="grid gap-6 lg:gap-8 xl:grid-cols-2">
      <ChartCard
        title="Sales Performance"
        icon={TrendingUp}
        description="Track your sales growth over time"
        isLoading={salesOvertimeLoading}
      >
        <TimeSeriesChart
          data={salesOvertime || []}
          lines={[
            {
              key: "total_sales",
              color: "#3b82f6",
              label: "Total Sales",
              gradientId: "salesGradient",
            },
          ]}
          height={280}
        />
      </ChartCard>

      <ChartCard
        title="Expense Tracking"
        icon={TrendingDown}
        description="Monitor your business expenses"
        isLoading={expensesOvertimeLoading}
      >
        <TimeSeriesChart
          data={expensesOvertime || []}
          lines={[
            {
              key: "total_expense",
              color: "#f59e0b",
              label: "Total Expenses",
              gradientId: "expenseGradient",
            },
          ]}
          height={280}
        />
      </ChartCard>

      <ChartCard
        title="Cash Flow Analysis"
        icon={DollarSign}
        description="Compare income vs expenses"
        isLoading={cashFlowLoading}
      >
        <TimeSeriesChart
          data={cashFlow || []}
          lines={[
            {
              key: "income",
              color: "#10b981",
              label: "Income",
              gradientId: "incomeGradient",
            },
            {
              key: "expense",
              color: "#f59e0b",
              label: "Expense",
              gradientId: "expenseFlowGradient",
            },
          ]}
          height={280}
        />
      </ChartCard>

      <ChartCard
        title="Top Selling Items"
        icon={Package}
        description="Best performing products"
        isLoading={topSellingItemsLoading}
      >
        <BarChart
          data={topSellingItems || []}
          xKey="item"
          yKey="quantity"
          color="#8b5cf6"
          height={280}
          gradientIntensity={0.4}
        />
      </ChartCard>

      <ChartCard
        title="Top Clients"
        icon={Users}
        description="Your most valuable customers"
        isLoading={topClientsLoading}
      >
        <BarChart
          data={topClients || []}
          xKey="client"
          yKey="total_spent"
          color="#06b6d4"
          height={280}
          gradientIntensity={0.4}
        />
      </ChartCard>

      <ChartCard
        title="Sales Status Overview"
        icon={PieChart}
        description="Payment status breakdown"
        isLoading={unpaidSalesStatusLoading}
      >
        <DonutChart
          data={unpaidSalesStatus || []}
          nameKey="status"
          valueKey="count"
          height={280}
          innerRadius={50}
          outerRadius={90}
          showPercentage={true}
          showLegend={true}
        />
      </ChartCard>
    </div>
  )
}
