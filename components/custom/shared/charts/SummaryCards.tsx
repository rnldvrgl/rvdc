"use client"

import { Skeleton } from "@/components/ui/skeleton"
import { AnalyticsSummary } from "@/lib/constants/interface"
import { useDateParamsFromForm } from "@/lib/hooks/useDateParamsFromForm"
import { useGetSummary } from "@/lib/queries/analytics/useGetAnalytics"
import { formatCurrency, formatNumber } from "@/lib/utils/helpers"
import {
  AlertCircle,
  CheckCircle2,
  Clock,
  DollarSign,
  LucideIcon,
  Receipt,
  TrendingUp,
  UserPlus,
  Users,
} from "lucide-react"
import { useMemo } from "react"
import StatsCard from "./StatsCard"

interface CardConfig {
  title: string
  value: string | React.ReactNode
  icon: LucideIcon
  variant: "default" | "success" | "warning" | "danger" | "info"
  trend?: {
    value: number
    label: string
  }
  href?: string
}

type SummaryGroup = {
  title: string
  cards: CardConfig[]
}

/** Calculate percentage change, returning 0 when previous is 0 */
function pctChange(current: number, previous: number): number {
  if (previous === 0) return current > 0 ? 100 : 0
  return Math.round(((current - previous) / Math.abs(previous)) * 100)
}

/** Compute previous period dates (same duration, shifted back) */
function getPreviousPeriod(startDate?: string, endDate?: string) {
  if (!startDate || !endDate)
    return { prev_start: undefined, prev_end: undefined }
  const start = new Date(startDate)
  const end = new Date(endDate)
  const durationMs = end.getTime() - start.getTime()
  const prevEnd = new Date(start.getTime() - 1) // day before current start
  const prevStart = new Date(prevEnd.getTime() - durationMs)
  return {
    prev_start: prevStart.toISOString().split("T")[0],
    prev_end: prevEnd.toISOString().split("T")[0],
  }
}

function buildCard(
  title: string,
  value: string | React.ReactNode,
  icon: LucideIcon,
  variant: "default" | "success" | "warning" | "danger" | "info",
  trend?: { value: number; label: string },
  href?: string,
): CardConfig {
  return { title, value, icon, variant, trend, href }
}

function getSummaryGroups(
  data: AnalyticsSummary,
  prev?: AnalyticsSummary | null,
): SummaryGroup[] {
  const trendLabel = "vs prev period"

  const trend = (current: number, previous?: number) =>
    previous !== undefined
      ? { value: pctChange(current, previous), label: trendLabel }
      : undefined
  return [
    {
      title: "Financial Health",
      cards: [
        buildCard(
          "Total Revenue",
          formatCurrency(data.total_revenue),
          DollarSign,
          "success",
          trend(data.total_revenue, prev?.total_revenue),
          "/reports",
        ),
        buildCard(
          "Net Income",
          formatCurrency(data.net_income),
          TrendingUp,
          data.net_income >= 0 ? "success" : "danger",
          trend(data.net_income, prev?.net_income),
          "/reports",
        ),
        buildCard(
          "Outstanding Receivables",
          formatCurrency(data.total_outstanding),
          AlertCircle,
          data.total_outstanding > 50000 ? "warning" : "info",
          trend(data.total_outstanding, prev?.total_outstanding),
          "/receivables/payment-collection",
        ),
        buildCard(
          "Total Expenses",
          formatCurrency(data.total_expense),
          Receipt,
          "danger",
          trend(data.total_expense, prev?.total_expense),
          "/expenses",
        ),
      ],
    },
    {
      title: "Operations",
      cards: [
        buildCard(
          "Active Services",
          formatNumber(data.active_services),
          Clock,
          "info",
          trend(data.active_services, prev?.active_services),
          "/services",
        ),
        buildCard(
          "Service Completion Rate",
          `${data.service_completion_rate}%`,
          CheckCircle2,
          data.service_completion_rate >= 80 ? "success" : "warning",
          trend(data.service_completion_rate, prev?.service_completion_rate),
          "/services",
        ),
      ],
    },
    {
      title: "Business Growth",
      cards: [
        buildCard(
          "Total Clients",
          formatNumber(data.total_clients),
          Users,
          "info",
          trend(data.total_clients, prev?.total_clients),
          "/clients",
        ),
        buildCard(
          "New Clients",
          formatNumber(data.new_clients),
          UserPlus,
          "success",
          trend(data.new_clients, prev?.new_clients),
          "/clients",
        ),
      ],
    },
  ]
}

const SummaryCards = () => {
  const { start_date, end_date, stall } = useDateParamsFromForm()
  const { data, isLoading } = useGetSummary({ start_date, end_date, stall })

  // Compute previous period (same duration, shifted back)
  const { prev_start, prev_end } = useMemo(
    () => getPreviousPeriod(start_date, end_date),
    [start_date, end_date],
  )

  const { data: prevData } = useGetSummary({
    start_date: prev_start,
    end_date: prev_end,
    stall,
    enabled: !!prev_start && !!prev_end,
  })

  const summaryGroups = useMemo(() => {
    if (!data) return []
    return getSummaryGroups(data, prevData)
  }, [data, prevData])

  return (
    <div className="space-y-8">
      {isLoading
        ? Array.from({ length: 4 }).map((_, i) => (
            <div key={i}>
              <div className="mb-6">
                <Skeleton className="h-6 w-40 mb-2" />
                <Skeleton className="h-4 w-64" />
              </div>
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-2">
                {Array.from({ length: 2 }).map((_, j) => (
                  <StatsCard
                    key={j}
                    title=""
                    value=""
                    icon={DollarSign}
                    isLoading={true}
                  />
                ))}
              </div>
            </div>
          ))
        : summaryGroups.map((group, i) => (
            <div key={i}>
              <div className="mb-6">
                <h2 className="text-xl font-bold text-foreground mb-2">
                  {group.title}
                </h2>
                <p className="text-sm text-muted-foreground">
                  Key performance indicators for your business
                </p>
              </div>
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-2">
                {group.cards.map((card, j) => (
                  <StatsCard
                    key={j}
                    title={card.title}
                    value={card.value}
                    icon={card.icon}
                    variant={card.variant}
                    trend={card.trend}
                    href={card.href}
                  />
                ))}
              </div>
            </div>
          ))}
    </div>
  )
}

export default SummaryCards
