"use client"

import {
  FadeUpItem,
  SectionReveal,
  StaggerGrid,
} from "@/components/custom/shared/charts/MotionWrappers"
import { ModernStatCardSkeleton } from "@/components/custom/shared/skeletons"
import { AnalyticsSummary } from "@/lib/constants/interface"
import { useDateParamsFromForm } from "@/lib/hooks/useDateParamsFromForm"
import { useGetSummary } from "@/lib/queries/analytics/useGetAnalytics"
import {
  AlertCircle,
  CheckCircle2,
  Clock,
  DollarSign,
  LucideIcon,
  Package,
  Receipt,
  TrendingUp,
  UserPlus,
  Users,
} from "lucide-react"
import { useMemo } from "react"
import StatsCard from "./StatsCard"

interface CardConfig {
  title: string
  value: string | number | React.ReactNode
  icon: LucideIcon
  valueFormat?: Intl.NumberFormatOptions
  valueSuffix?: string
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

function isCardConfig(card: CardConfig | null): card is CardConfig {
  return card !== null
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
  value: string | number | React.ReactNode,
  icon: LucideIcon,
  variant: "default" | "success" | "warning" | "danger" | "info",
  trend?: { value: number; label: string },
  href?: string,
  valueFormat?: Intl.NumberFormatOptions,
  valueSuffix?: string,
): CardConfig {
  return { title, value, icon, variant, trend, href, valueFormat, valueSuffix }
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
          data.total_revenue,
          DollarSign,
          "success",
          trend(data.total_revenue, prev?.total_revenue),
          "/reports",
          { style: "currency", currency: "PHP", minimumFractionDigits: 2, maximumFractionDigits: 2 },
        ),
        buildCard(
          "Net Income",
          data.net_income,
          TrendingUp,
          data.net_income >= 0 ? "success" : "danger",
          trend(data.net_income, prev?.net_income),
          "/reports",
          { style: "currency", currency: "PHP", minimumFractionDigits: 2, maximumFractionDigits: 2 },
        ),
        buildCard(
          "Outstanding Receivables",
          data.total_outstanding,
          AlertCircle,
          data.total_outstanding > 50000 ? "warning" : "info",
          trend(data.total_outstanding, prev?.total_outstanding),
          "/receivables/payment-collection",
          { style: "currency", currency: "PHP", minimumFractionDigits: 2, maximumFractionDigits: 2 },
        ),
        buildCard(
          "Total Expenses",
          data.total_expense,
          Receipt,
          "danger",
          trend(data.total_expense, prev?.total_expense),
          "/expenses/manage",
          { style: "currency", currency: "PHP", minimumFractionDigits: 2, maximumFractionDigits: 2 },
        ),
        buildCard(
          "Unit Cost (Aircon)",
          data.unit_cost_deduction,
          Package,
          "danger",
          trend(data.unit_cost_deduction, prev?.unit_cost_deduction),
          undefined,
          { style: "currency", currency: "PHP", minimumFractionDigits: 2, maximumFractionDigits: 2 },
        ),
      ],
    },
    {
      title: "Operations",
      cards: [
        buildCard(
          "Active Services",
          data.active_services,
          Clock,
          "info",
          trend(data.active_services, prev?.active_services),
          "/services",
        ),
        buildCard(
          "Service Completion Rate",
          data.service_completion_rate,
          CheckCircle2,
          data.service_completion_rate >= 80 ? "success" : "warning",
          trend(data.service_completion_rate, prev?.service_completion_rate),
          "/services",
          undefined,
          "%",
        ),
        buildCard(
          "Payment Collection Rate",
          data.payment_collection_rate,
          DollarSign,
          data.payment_collection_rate >= 80 ? "success" : "warning",
          trend(data.payment_collection_rate, prev?.payment_collection_rate),
          "/receivables/payment-collection",
          undefined,
          "%",
        ),
        data.top_service_technician
          ? buildCard(
              "Top Service Technician",
              data.top_service_technician.name,
              Users,
              "info",
              {
                value: data.top_service_technician.services_completed,
                label: "services completed",
              },
            )
          : null,
      ].filter(isCardConfig),
    },
    {
      title: "Business Growth",
      cards: [
        buildCard(
          "Total Clients",
          data.total_clients,
          Users,
          "info",
          trend(data.total_clients, prev?.total_clients),
          "/clients",
        ),
        buildCard(
          "New Clients",
          data.new_clients,
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
      {summaryGroups.map((group, idx) => (
        <SectionReveal
          key={idx}
          delay={idx * 0.1}
        >
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <div className="h-8 w-1 bg-linear-to-b from-primary to-primary/50 rounded-full" />
              <h3 className="text-lg font-semibold text-foreground">
                {group.title}
              </h3>
            </div>
            {isLoading ? (
              <ModernStatCardSkeleton count={group.cards.length} />
            ) : (
              <StaggerGrid className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-5">
                {group.cards.map((card, i) => (
                  <FadeUpItem key={i}>
                    <StatsCard {...card} />
                  </FadeUpItem>
                ))}
              </StaggerGrid>
            )}
          </div>
        </SectionReveal>
      ))}
    </div>
  )
}

export default SummaryCards
