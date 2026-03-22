"use client"

import { Card, CardContent } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useDateParamsFromForm } from "@/lib/hooks/useDateParamsFromForm"
import {
  useGetSummary,
  useSalesOverTime,
  useUnpaidSalesStatus,
} from "@/lib/queries/analytics/useGetAnalytics"
import { useStalls } from "@/lib/queries/inventory/useStalls"
import { formatCurrency } from "@/lib/utils/helpers"
import { AnimatePresence, motion } from "framer-motion"
import { DollarSign, TrendingDown, TrendingUp } from "lucide-react"
import { useMemo, useState } from "react"
import DonutChart from "./DonutChart"
import TimeSeriesChart from "./TimeSeriesChart"

function pctChange(current: number, previous: number): number {
  if (previous === 0) return current > 0 ? 100 : 0
  return Math.round(((current - previous) / Math.abs(previous)) * 100)
}

function getPreviousPeriod(startDate?: string, endDate?: string) {
  if (!startDate || !endDate)
    return { prev_start: undefined, prev_end: undefined }
  const start = new Date(startDate)
  const end = new Date(endDate)
  const durationMs = end.getTime() - start.getTime()
  const prevEnd = new Date(start.getTime() - 1)
  const prevStart = new Date(prevEnd.getTime() - durationMs)
  return {
    prev_start: prevStart.toISOString().split("T")[0],
    prev_end: prevEnd.toISOString().split("T")[0],
  }
}

export default function HeroStatsSection() {
  const { start_date, end_date, stall } = useDateParamsFromForm()
  const [stallTab, setStallTab] = useState<string>("all")

  const { data: stallsData } = useStalls({ limit: 50 })
  const stalls = stallsData?.results ?? []
  const mainStall = stalls.find((s) => s.stall_type === "main")
  const subStall = stalls.find((s) => s.stall_type === "sub")

  const effectiveStall = useMemo(() => {
    if (stallTab === "main" && mainStall) return mainStall.id
    if (stallTab === "sub" && subStall) return subStall.id
    if (stallTab === "all") return undefined
    return stall
  }, [stallTab, mainStall, subStall, stall])

  const { data: summary, isLoading: summaryLoading } = useGetSummary({
    start_date,
    end_date,
    stall: effectiveStall,
  })
  const { data: salesOvertime, isLoading: salesLoading } = useSalesOverTime({
    start_date,
    end_date,
    stall: effectiveStall,
  })
  const { data: unpaidStatus, isLoading: statusLoading } = useUnpaidSalesStatus(
    { start_date, end_date, stall: effectiveStall },
  )

  const { prev_start, prev_end } = useMemo(
    () => getPreviousPeriod(start_date, end_date),
    [start_date, end_date],
  )
  const { data: prevData } = useGetSummary({
    start_date: prev_start,
    end_date: prev_end,
    stall: effectiveStall,
    enabled: !!prev_start && !!prev_end,
  })

  const revenueTrend = useMemo(() => {
    if (!summary || !prevData) return null
    return pctChange(summary.total_revenue, prevData.total_revenue)
  }, [summary, prevData])

  return (
    <div className="grid gap-6 lg:grid-cols-3">
      {/* Revenue Overview + Chart */}
      <div className="lg:col-span-2">
        <Card className="overflow-hidden border border-border shadow-md bg-card h-full relative">
          <CardContent className="p-4 sm:p-6 sm:pl-7">
            <AnimatePresence mode="wait">
              {summaryLoading ? (
                <motion.div
                  key="skeleton"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="space-y-4"
                >
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-10 w-48" />
                  <Skeleton className="h-4 w-40" />
                  <Skeleton className="h-44 w-full rounded-lg" />
                </motion.div>
              ) : (
                <motion.div
                  key="content"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5 }}
                >
                  <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 mb-4">
                    <div className="space-y-1 min-w-0">
                      <p className="text-sm font-medium text-muted-foreground">
                        Period Revenue
                      </p>
                      <p className="text-2xl sm:text-3xl lg:text-4xl font-bold text-foreground tracking-tight break-all sm:break-normal">
                        {formatCurrency(summary?.total_revenue ?? 0)}
                      </p>
                      <div className="flex items-center gap-4 mt-2">
                        {revenueTrend !== null && (
                          <span
                            className={`inline-flex items-center gap-1 text-sm font-medium ${
                              revenueTrend >= 0
                                ? "text-primary"
                                : "text-destructive"
                            }`}
                          >
                            {revenueTrend >= 0 ? (
                              <TrendingUp className="size-4" />
                            ) : (
                              <TrendingDown className="size-4" />
                            )}
                            {revenueTrend > 0 ? "+" : ""}
                            {revenueTrend}% vs prev period
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-3 shrink-0">
                      <Tabs
                        value={stallTab}
                        onValueChange={setStallTab}
                      >
                        <TabsList className="h-8">
                          <TabsTrigger
                            value="all"
                            className="text-xs px-3 h-7"
                          >
                            All
                          </TabsTrigger>
                          <TabsTrigger
                            value="main"
                            className="text-xs px-3 h-7"
                          >
                            Main
                          </TabsTrigger>
                          <TabsTrigger
                            value="sub"
                            className="text-xs px-3 h-7"
                          >
                            Sub
                          </TabsTrigger>
                        </TabsList>
                      </Tabs>
                      <div className="p-3 rounded-xl bg-primary/10 dark:bg-primary/20">
                        <DollarSign className="size-6 text-primary" />
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4 mb-4">
                    <div className="rounded-lg bg-muted px-4 py-3">
                      <p className="text-xs text-muted-foreground">
                        Net Income
                      </p>
                      <p className="text-lg font-semibold text-foreground">
                        {formatCurrency(summary?.net_income ?? 0)}
                      </p>
                    </div>
                    <div className="rounded-lg bg-muted px-4 py-3">
                      <p className="text-xs text-muted-foreground">
                        Total Sales
                      </p>
                      <p className="text-lg font-semibold text-foreground">
                        {formatCurrency(summary?.total_sales ?? 0)}
                      </p>
                    </div>
                  </div>

                  <div className="h-44">
                    {salesLoading ? (
                      <Skeleton className="w-full h-full rounded-lg" />
                    ) : (
                      <TimeSeriesChart
                        data={salesOvertime || []}
                        lines={[
                          {
                            key: "total_sales",
                            color: "oklch(0.55 0.17 290)",
                            label: "Sales",
                            gradientId: "heroSalesGrad",
                          },
                        ]}
                        height={176}
                        showGrid={false}
                      />
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </CardContent>
        </Card>
      </div>

      {/* Sales Status Donut */}
      <div className="lg:col-span-1">
        <Card className="overflow-hidden border border-border shadow-md bg-card h-full">
          <CardContent className="p-4 sm:p-6 flex flex-col h-full">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 rounded-lg bg-primary/10 dark:bg-primary/20">
                <DollarSign className="size-4 text-primary" />
              </div>
              <div>
                <h3 className="text-base font-semibold text-foreground">
                  Sales Status
                </h3>
                <p className="text-xs text-muted-foreground">
                  Payment breakdown
                </p>
              </div>
            </div>
            <div className="flex-1 min-h-0">
              <AnimatePresence mode="wait">
                {statusLoading ? (
                  <motion.div
                    key="skeleton"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="flex items-center justify-center h-full"
                  >
                    <Skeleton className="size-40 rounded-full" />
                  </motion.div>
                ) : (
                  <motion.div
                    key="chart"
                    className="h-full"
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.5, ease: "easeOut" }}
                  >
                    <DonutChart
                      data={unpaidStatus || []}
                      nameKey="status"
                      valueKey="count"
                      height={280}
                      innerRadius={55}
                      outerRadius={85}
                      showPercentage={true}
                      showLegend={true}
                    />
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
