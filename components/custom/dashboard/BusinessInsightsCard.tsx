"use client"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { useDateParamsFromForm } from "@/lib/hooks/useDateParamsFromForm"
import { useBusinessInsights } from "@/lib/queries/analytics/useGetAnalytics"
import { Sparkles, TrendingDown, TrendingUp } from "lucide-react"

const priorityVariant = {
    high: "destructive",
    medium: "warning",
    low: "secondary",
} as const

// Left edge of each recommendation shows how urgent it is.
const priorityBar = {
    high: "border-l-destructive",
    medium: "border-l-amber-500",
    low: "border-l-border",
} as const

const pesoFull = new Intl.NumberFormat("en-PH", {
    style: "currency",
    currency: "PHP",
    maximumFractionDigits: 0,
})

const pesoShort = new Intl.NumberFormat("en-PH", {
    style: "currency",
    currency: "PHP",
    notation: "compact",
    maximumFractionDigits: 2,
})

function formatUpdatedAt(value?: string | null) {
    if (!value) return null
    const date = new Date(value)
    if (Number.isNaN(date.getTime())) return null
    return date.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })
}

export function BusinessInsightsCard() {
    const { start_date, end_date, stall } = useDateParamsFromForm()
    const { data, isLoading, isError, refetch, isFetching } = useBusinessInsights({
        start_date,
        end_date,
        stall,
    })

    if (isLoading) {
        return (
            <Card className="overflow-hidden border border-border shadow-sm">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-base">
                        <Sparkles className="size-4" />
                        AI Business Insights
                    </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <Skeleton className="h-6 w-2/3" />
                    <Skeleton className="h-4 w-1/2" />
                    <Skeleton className="h-20 w-full rounded-xl" />
                    <Skeleton className="h-16 w-full rounded-xl" />
                    <Skeleton className="h-16 w-full rounded-xl" />
                </CardContent>
            </Card>
        )
    }

    // Show a visible error instead of hiding the card, so a broken backend
    // doesn't look like the feature simply isn't there.
    if (isError || !data) {
        return (
            <Card className="overflow-hidden border border-border shadow-sm">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-base">
                        <Sparkles className="size-4" />
                        AI Business Insights
                    </CardTitle>
                </CardHeader>
                <CardContent className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <p className="text-sm text-muted-foreground">
                        Couldn&apos;t load insights. Check your connection and try again.
                    </p>
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => refetch()}
                        disabled={isFetching}
                    >
                        {isFetching ? "Retrying..." : "Retry"}
                    </Button>
                </CardContent>
            </Card>
        )
    }

    const isAi = data.source === "ai"
    const updatedAt = formatUpdatedAt(data.generated_at)
    const metrics = data.metrics
    const recommendations = data.recommendations ?? []
    const risks = data.risks ?? []
    const opportunities = data.opportunities ?? []

    return (
        <Card className="overflow-hidden border border-border shadow-sm bg-card">
            <CardHeader className="space-y-3 pb-4">
                <div className="flex items-start justify-between gap-3">
                    <div className="space-y-0.5">
                        <CardTitle className="flex items-center gap-2 text-base">
                            <Sparkles className="size-4 text-primary" />
                            AI Business Insights
                        </CardTitle>
                        {data.period_label && (
                            <p className="text-xs text-muted-foreground">{data.period_label}</p>
                        )}
                    </div>
                    <Badge variant={isAi ? "success" : "secondary"} className="shrink-0">
                        {isAi ? "AI powered" : "Rule-based"}
                    </Badge>
                </div>

                <div className="space-y-1">
                    <p className="text-lg font-semibold leading-snug text-foreground">
                        {data.headline}
                    </p>
                    {data.summary && (
                        <p className="text-sm text-muted-foreground max-w-2xl">{data.summary}</p>
                    )}
                </div>
            </CardHeader>

            <CardContent className="space-y-6 pt-0">
                {metrics && (
                    <div className="grid grid-cols-2 gap-px overflow-hidden rounded-xl border border-border bg-border lg:grid-cols-4">
                        <Metric
                            label="Revenue"
                            value={pesoShort.format(metrics.total_revenue)}
                            full={pesoFull.format(metrics.total_revenue)}
                        />
                        <Metric
                            label="Net income"
                            value={pesoShort.format(metrics.net_income)}
                            full={pesoFull.format(metrics.net_income)}
                            valueClassName={metrics.net_income < 0 ? "text-destructive" : undefined}
                        />
                        <Metric
                            label="Collected"
                            value={`${Math.round(metrics.collection_rate)}%`}
                            full={`${metrics.collection_rate.toFixed(1)}% of billed amounts collected`}
                        />
                        <Metric
                            label="Unpaid"
                            value={pesoShort.format(metrics.outstanding)}
                            full={pesoFull.format(metrics.outstanding)}
                            valueClassName={metrics.outstanding > 0 ? "text-amber-500" : undefined}
                        />
                    </div>
                )}

                {recommendations.length > 0 && (
                    <section className="space-y-2">
                        <h3 className="text-sm font-medium text-foreground">What to do next</h3>
                        <ul className="space-y-2">
                            {recommendations.map((item, index) => (
                                <li
                                    key={`${item.title}-${index}`}
                                    className={`rounded-lg border border-border/70 border-l-2 bg-muted/20 px-4 py-3 ${priorityBar[item.priority] ?? "border-l-border"
                                        }`}
                                >
                                    <div className="flex items-center justify-between gap-3">
                                        <p className="text-sm font-medium text-foreground">
                                            {item.title}
                                        </p>
                                        <Badge
                                            variant={priorityVariant[item.priority] ?? "secondary"}
                                            className="shrink-0"
                                        >
                                            {item.priority}
                                        </Badge>
                                    </div>
                                    <p className="mt-1 text-sm text-muted-foreground">
                                        {item.action}
                                    </p>
                                    {item.reason && (
                                        <details className="mt-1.5">
                                            <summary className="w-fit cursor-pointer text-xs text-muted-foreground hover:text-foreground">
                                                Why this matters
                                            </summary>
                                            <p className="mt-1 text-xs text-muted-foreground">
                                                {item.reason}
                                            </p>
                                        </details>
                                    )}
                                </li>
                            ))}
                        </ul>
                    </section>
                )}

                {(opportunities.length > 0 || risks.length > 0) && (
                    <div className="grid gap-6 sm:grid-cols-2">
                        {opportunities.length > 0 && (
                            <BulletSection
                                title="Opportunities"
                                items={opportunities}
                                tone="success"
                            />
                        )}
                        {risks.length > 0 && (
                            <BulletSection title="Risks" items={risks} tone="destructive" />
                        )}
                    </div>
                )}

                <div className="flex flex-wrap items-center gap-x-4 gap-y-1 border-t border-border/60 pt-3 text-xs text-muted-foreground">
                    {isAi && data.model && (
                        <span>
                            Generated by {data.model}
                            {updatedAt ? ` at ${updatedAt}` : ""}
                        </span>
                    )}
                    {!isAi && (
                        <span>AI is unavailable right now, so these insights come from built-in rules.</span>
                    )}
                    {data.confidence && (
                        <span className="capitalize">Confidence: {data.confidence}</span>
                    )}
                </div>
            </CardContent>
        </Card>
    )
}

function Metric({
    label,
    value,
    full,
    valueClassName,
}: {
    label: string
    value: string
    full?: string
    valueClassName?: string
}) {
    return (
        <div className="bg-card p-4" title={full}>
            <p className="text-xs text-muted-foreground">{label}</p>
            <p
                className={`mt-1 text-xl font-semibold tabular-nums text-foreground ${valueClassName ?? ""
                    }`}
            >
                {value}
            </p>
        </div>
    )
}

function BulletSection({
    title,
    items,
    tone,
}: {
    title: string
    items: string[]
    tone: "success" | "destructive"
}) {
    const Icon = tone === "success" ? TrendingUp : TrendingDown
    const color = tone === "success" ? "text-success" : "text-destructive"
    const dot = tone === "success" ? "bg-success" : "bg-destructive"

    return (
        <section className="space-y-2">
            <h3 className={`flex items-center gap-1.5 text-sm font-medium ${color}`}>
                <Icon className="size-4" />
                {title}
            </h3>
            <ul className="space-y-1.5 text-sm text-foreground/90">
                {items.map((item, index) => (
                    <li key={`${item}-${index}`} className="flex gap-2">
                        <span className={`mt-2 size-1.5 shrink-0 rounded-full ${dot}`} />
                        <span>{item}</span>
                    </li>
                ))}
            </ul>
        </section>
    )
}
