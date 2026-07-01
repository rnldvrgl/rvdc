"use client"

import { ModernStatCardSkeleton } from "@/components/custom/shared/skeletons"
import { Card, CardContent } from "@/components/ui/card"
import { AnalyticsSummary } from "@/lib/constants/interface"
import { useDateParamsFromForm } from "@/lib/hooks/useDateParamsFromForm"
import { useGetSummary } from "@/lib/queries/analytics/useGetAnalytics"
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
import { AnimatedNumber, FadeUpItem, StaggerGrid } from "./MotionWrappers"
import { Badge } from "@/components/ui/badge"

interface MetricCard {
    title: string
    value: ReactNode
    icon: LucideIcon
    href?: string
    trend?: { value: number; label: string }
    accent: {
        iconBg: string
        iconColor: string
        border: string
    }
}

const metricAccents = {
    warning: {
        iconBg: "bg-warning/10",
        iconColor: "text-warning",
        border: "border-warning/30",
    },
    destructive: {
        iconBg: "bg-destructive/10",
        iconColor: "text-destructive",
        border: "border-destructive/30",
    },
    info: {
        iconBg: "bg-info/10",
        iconColor: "text-info",
        border: "border-info/30",
    },
    success: {
        iconBg: "bg-success/10",
        iconColor: "text-success",
        border: "border-success/30",
    },
    primary: {
        iconBg: "bg-primary/10",
        iconColor: "text-primary",
        border: "border-primary/30",
    },
    neutral: {
        iconBg: "bg-muted",
        iconColor: "text-foreground",
        border: "border-border",
    },
} as const

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
            value: <AnimatedNumber value={data.total_outstanding} prefix="₱" />,
            icon: AlertCircle,
            href: "/receivables/payment-collection",
            trend: trend(data.total_outstanding, prev?.total_outstanding),
            accent: metricAccents.warning,
        },
        {
            title: "Expenses",
            value: <AnimatedNumber value={data.total_expense} prefix="₱" />,
            icon: Receipt,
            href: "/expenses/manage",
            trend: trend(data.total_expense, prev?.total_expense),
            accent: metricAccents.destructive,
        },
        {
            title: "Active Services",
            value: <AnimatedNumber value={data.active_services} />,
            icon: Clock,
            href: "/services",
            trend: trend(data.active_services, prev?.active_services),
            accent: metricAccents.info,
        },
        {
            title: "Completion Rate",
            value: <AnimatedNumber value={data.service_completion_rate} suffix="%" />,
            icon: CheckCircle2,
            href: "/services",
            trend: trend(data.service_completion_rate, prev?.service_completion_rate),
            accent: metricAccents.success,
        },
        {
            title: "Payment Collection",
            value: <AnimatedNumber value={data.payment_collection_rate} suffix="%" />,
            icon: DollarSign,
            href: "/receivables/payment-collection",
            trend: trend(data.payment_collection_rate, prev?.payment_collection_rate),
            accent: metricAccents.success,
        },
        ...(data.top_service_technician
            ? [
                {
                    title: "Top Service Tech",
                    value: data.top_service_technician.name,
                    icon: TrendingUp,
                    trend: {
                        value: data.top_service_technician.services_completed,
                        label: "services completed",
                    },
                    accent: metricAccents.neutral,
                },
            ]
            : []),
        {
            title: "New Clients",
            value: <AnimatedNumber value={data.new_clients} />,
            icon: UserPlus,
            href: "/clients",
            trend: trend(data.new_clients, prev?.new_clients),
            accent: metricAccents.primary,
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
        return buildMetricCards(data, prevData)
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
                            <Badge
                                variant={card.trend.value > 0 ? "success" : card.trend.value < 0 ? "destructive" : "secondary"}
                            >
                                <AnimatedNumber value={card.trend.value} suffix="%" prefix={card.trend.value > 0 ? "+" : ""} />
                            </Badge>
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
