"use client"

import { ModernStatCardSkeleton } from "@/components/custom/shared/skeletons"
import { Card, CardContent } from "@/components/ui/card"
import { AnalyticsSummary } from "@/lib/constants/interface"
import { useDateParamsFromForm } from "@/lib/hooks/useDateParamsFromForm"
import { useGetSummary } from "@/lib/queries/analytics/useGetAnalytics"
import { formatCurrency, formatNumber } from "@/lib/utils/helpers"
import { motion } from "framer-motion"
import {
  AlertCircle,
  CheckCircle2,
  Clock,
  DollarSign,
  LucideIcon,
  Receipt,
  TrendingUp,
  UserPlus,
} from "lucide-react"
import Link from "next/link"
import { type ReactNode, useMemo } from "react"
import { FadeUpItem, StaggerGrid } from "./MotionWrappers"

function isMetricCard(card: MetricCard | null): card is MetricCard {
  return card !== null
}

interface MetricCard {
  title: string
  value: string
  icon: LucideIcon
  href?: string
  trend?: { value: number; label: string }
  accent: {
    iconBg: string
    iconColor: string
    border: string
    ring: string
  }
}

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

function buildMetricCards(
  data: AnalyticsSummary,
  prev?: AnalyticsSummary | null,
): MetricCard[] {
  const trendLabel = "vs prev"
  const trend = (current: number, previous?: number) =>
    previous !== undefined
      ? { value: pctChange(current, previous), label: trendLabel }
      : undefined

  return [
    {
      title: "Outstanding",
      value: formatCurrency(data.total_outstanding),
      icon: AlertCircle,
      href: "/receivables/payment-collection",
      trend: trend(data.total_outstanding, prev?.total_outstanding),
      accent: {
        iconBg: "bg-amber-100 dark:bg-amber-950/50",
        iconColor: "text-warning",
        border: "border-amber-300 dark:border-amber-700",
        ring: "ring-amber-200/50 dark:ring-amber-800/30",
      },
    },
    {
      title: "Expenses",
      value: formatCurrency(data.total_expense),
      icon: Receipt,
      href: "/expenses/manage",
      trend: trend(data.total_expense, prev?.total_expense),
      accent: {
        iconBg: "bg-rose-100 dark:bg-rose-950/50",
        iconColor: "text-rose-600 dark:text-rose-400",
        border: "border-rose-300 dark:border-rose-700",
        ring: "ring-rose-200/50 dark:ring-rose-800/30",
      },
    },
    {
      title: "Active Services",
      value: formatNumber(data.active_services),
      icon: Clock,
      href: "/services",
      trend: trend(data.active_services, prev?.active_services),
      accent: {
        iconBg: "bg-sky-100 dark:bg-sky-950/50",
        iconColor: "text-sky-600 dark:text-sky-400",
        border: "border-sky-300 dark:border-sky-700",
        ring: "ring-sky-200/50 dark:ring-sky-800/30",
      },
    },
    {
      title: "Completion Rate",
      value: `${data.service_completion_rate}%`,
      icon: CheckCircle2,
      href: "/services",
      trend: trend(data.service_completion_rate, prev?.service_completion_rate),
      accent: {
        iconBg: "bg-emerald-100 dark:bg-emerald-950/50",
        iconColor: "text-success",
        border: "border-emerald-300 dark:border-emerald-700",
        ring: "ring-emerald-200/50 dark:ring-emerald-800/30",
      },
    },
    {
      title: "Payment Collection",
      value: `${data.payment_collection_rate}%`,
      icon: DollarSign,
      href: "/receivables/payment-collection",
      trend: trend(data.payment_collection_rate, prev?.payment_collection_rate),
      accent: {
        iconBg: "bg-emerald-100 dark:bg-emerald-950/50",
        iconColor: "text-success",
        border: "border-emerald-300 dark:border-emerald-700",
        ring: "ring-emerald-200/50 dark:ring-emerald-800/30",
      },
    },
    data.top_service_technician
      ? {
          title: "Top Service Tech",
          value: data.top_service_technician.name,
          icon: TrendingUp,
          trend: {
            value: data.top_service_technician.services_completed,
            label: "services completed",
          },
          accent: {
            iconBg: "bg-slate-100 dark:bg-slate-900/60",
            iconColor: "text-foreground",
            border: "border-slate-300 dark:border-slate-700",
            ring: "ring-slate-200/50 dark:ring-slate-800/30",
          },
        }
      : null,
    {
      title: "New Clients",
      value: formatNumber(data.new_clients),
      icon: UserPlus,
      href: "/clients",
      trend: trend(data.new_clients, prev?.new_clients),
      accent: {
        iconBg: "bg-violet-100 dark:bg-violet-950/50",
        iconColor: "text-violet-600 dark:text-violet-400",
        border: "border-violet-300 dark:border-violet-700",
        ring: "ring-violet-200/50 dark:ring-violet-800/30",
      },
    },
  ]
}

export default function GradientMetricCards({
  children,
}: {
  children?: ReactNode
}) {
  const { start_date, end_date, stall } = useDateParamsFromForm()
  const { data, isLoading } = useGetSummary({ start_date, end_date, stall })

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

  const cards = useMemo(() => {
    if (!data) return []
    return buildMetricCards(data, prevData).filter(isMetricCard)
  }, [data, prevData])

  if (isLoading) {
    return <ModernStatCardSkeleton count={5} />
  }

  return (
    <StaggerGrid className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
      {cards.map((card, i) => (
        <FadeUpItem key={i}>
          <MetricCardItem card={card} />
        </FadeUpItem>
      ))}
      {children && <FadeUpItem className="h-full">{children}</FadeUpItem>}
    </StaggerGrid>
  )
}

function MetricCardItem({ card }: { card: MetricCard }) {
  const content = (
    <motion.div
      whileHover={{ y: -4, transition: { duration: 0.2, ease: "easeOut" } }}
    >
      <Card
        className={`overflow-hidden border ${card.accent.border} shadow-sm hover:shadow-md transition-shadow duration-300 bg-card h-full`}
      >
        <CardContent className="p-5">
          <div className="flex items-start justify-between mb-3">
            <div className={`p-2.5 rounded-lg ${card.accent.iconBg}`}>
              <card.icon className={`size-5 ${card.accent.iconColor}`} />
            </div>
            {card.trend && (
              <span
                className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                  card.trend.value >= 0
                    ? "bg-muted text-foreground"
                    : "bg-destructive/10 text-destructive"
                }`}
              >
                {card.trend.value > 0 ? "+" : ""}
                {card.trend.value}%
              </span>
            )}
          </div>

          <p className="text-xl sm:text-2xl font-bold text-foreground tracking-tight break-all sm:break-normal">
            {card.value}
          </p>
          <p className="text-sm font-medium text-muted-foreground mt-1">
            {card.title}
          </p>
        </CardContent>
      </Card>
    </motion.div>
  )

  if (card.href) {
    return (
      <Link
        href={card.href}
        className="block no-underline"
      >
        {content}
      </Link>
    )
  }

  return content
}
