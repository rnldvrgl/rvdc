"use client"

import {
  FadeUpItem,
  StaggerGrid,
} from "@/components/custom/shared/charts/MotionWrappers"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { useDateParamsFromForm } from "@/lib/hooks/useDateParamsFromForm"
import {
  useCashFlow,
  useTopClients,
  useTopSellingItems,
} from "@/lib/queries/analytics/useGetAnalytics"
import { AnimatePresence, motion } from "framer-motion"
import { DollarSign, Package, Users } from "lucide-react"
import BarChart from "./BarChart"
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
  <motion.div
    whileHover={{ y: -4, transition: { duration: 0.2, ease: "easeOut" } }}
  >
    <Card className="overflow-hidden border border-border shadow-sm hover:shadow-md transition-shadow duration-300 bg-card h-full">
      <CardHeader className="pb-4 border-b border-border">
        <CardTitle className="text-base font-semibold flex items-center gap-3">
          {Icon && (
            <div className="p-2 rounded-lg bg-primary/10 dark:bg-primary/20">
              <Icon className="size-4 text-primary" />
            </div>
          )}
          <div className="space-y-0.5">
            <span className="text-foreground">{title}</span>
            {description && (
              <p className="text-xs font-normal text-muted-foreground">
                {description}
              </p>
            )}
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent className="h-80 p-5">
        <AnimatePresence mode="wait">
          {isLoading ? (
            <motion.div
              key="skeleton"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
            >
              <Skeleton className="w-full h-full rounded-lg" />
            </motion.div>
          ) : (
            <motion.div
              key="chart"
              className="w-full h-full"
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.4, ease: [0.25, 0.46, 0.45, 0.94] }}
            >
              {children}
            </motion.div>
          )}
        </AnimatePresence>
      </CardContent>
    </Card>
  </motion.div>
)

export default function DashboardCharts() {
  const { start_date, end_date, stall } = useDateParamsFromForm()

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

  return (
    <StaggerGrid className="grid gap-6 lg:gap-8 xl:grid-cols-2">
      <FadeUpItem className="xl:col-span-2">
        <ChartCard
          title="Cash Flow Analysis"
          icon={DollarSign}
          description="Compare income vs expenses over time"
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
      </FadeUpItem>

      <FadeUpItem>
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
      </FadeUpItem>

      <FadeUpItem>
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
      </FadeUpItem>
    </StaggerGrid>
  )
}
