"use client"

import { Skeleton } from "@/components/ui/skeleton"
import { AnalyticsSummary } from "@/lib/constants/interface"
import { useDateParamsFromForm } from "@/lib/hooks/useDateParamsFromForm"
import { useGetSummary } from "@/lib/queries/analytics/useGetAnalytics"
import { formatCurrency, formatNumber } from "@/lib/utils/helpers"
import {
  AlertCircle,
  Ban,
  Calendar,
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
}

type SummaryGroup = {
  title: string
  cards: CardConfig[]
}

function buildCard(
  title: string,
  value: string | React.ReactNode,
  icon: LucideIcon,
  variant: "default" | "success" | "warning" | "danger" | "info",
  trend?: { value: number; label: string },
): CardConfig {
  return { title, value, icon, variant, trend }
}

function getSummaryGroups(data: AnalyticsSummary): SummaryGroup[] {
  return [
    {
      title: "Financial Health",
      cards: [
        buildCard(
          "Total Revenue",
          formatCurrency(data.total_revenue),
          DollarSign,
          "success",
        ),
        buildCard(
          "Net Income",
          formatCurrency(data.net_income),
          TrendingUp,
          data.net_income >= 0 ? "success" : "danger",
        ),
        buildCard(
          "Outstanding Receivables",
          formatCurrency(data.total_outstanding),
          AlertCircle,
          data.total_outstanding > 50000 ? "warning" : "info",
        ),
        buildCard(
          "Total Expenses",
          formatCurrency(data.total_expense),
          Receipt,
          "danger",
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
        ),
        buildCard(
          "Service Completion Rate",
          `${data.service_completion_rate}%`,
          CheckCircle2,
          data.service_completion_rate >= 80 ? "success" : "warning",
        ),
        buildCard(
          "Today's Schedules",
          `${data.pending_schedules} / ${data.today_schedules}`,
          Calendar,
          data.pending_schedules > 0 ? "warning" : "success",
        ),
        buildCard(
          "Inventory Alerts",
          <div className="space-y-1">
            <div className="text-xl font-bold text-foreground">
              {formatNumber(data.inventory_alerts)}
            </div>
            <div className="text-xs text-muted-foreground">
              {formatNumber(data.no_stock_items)} out of stock,{" "}
              {formatNumber(data.low_stock_items)} low stock
            </div>
          </div>,
          Ban,
          data.no_stock_items > 0
            ? "danger"
            : data.low_stock_items > 0
              ? "warning"
              : "success",
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
        ),
        buildCard(
          "New Clients",
          formatNumber(data.new_clients),
          UserPlus,
          "success",
        ),
      ],
    },
  ]
}

const SummaryCards = () => {
  const { start_date, end_date, stall } = useDateParamsFromForm()
  const { data, isLoading } = useGetSummary({ start_date, end_date, stall })

  const summaryGroups = useMemo(() => {
    if (!data) return []
    return getSummaryGroups(data)
  }, [data])

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
                    value={
                      typeof card.value === "string" ||
                      typeof card.value === "number"
                        ? card.value
                        : "N/A"
                    }
                    icon={card.icon}
                    variant={card.variant}
                    trend={card.trend}
                  />
                ))}
              </div>
            </div>
          ))}
    </div>
  )
}

export default SummaryCards
