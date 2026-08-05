"use client"

import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { useDateParamsFromForm } from "@/lib/hooks/useDateParamsFromForm"
import { useBusinessInsights } from "@/lib/queries/analytics/useGetAnalytics"
import { Lightbulb, Sparkles, Target, TrendingUp, type LucideIcon } from "lucide-react"

const priorityVariant = {
    high: "destructive",
    medium: "warning",
    low: "secondary",
} as const

export function BusinessInsightsCard() {
    const { start_date, end_date, stall } = useDateParamsFromForm()
    const { data, isLoading } = useBusinessInsights({ start_date, end_date, stall })

    if (isLoading) {
        return (
            <Card className="overflow-hidden border border-border shadow-sm">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-base">
                        <Sparkles className="size-4" />
                        AI Business Insights
                    </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                    <Skeleton className="h-4 w-40" />
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-5/6" />
                    <div className="space-y-3 pt-2">
                        <Skeleton className="h-24 w-full rounded-xl" />
                        <Skeleton className="h-24 w-full rounded-xl" />
                    </div>
                </CardContent>
            </Card>
        )
    }

    if (!data) {
        return null
    }

    return (
        <Card className="overflow-hidden border border-border shadow-sm bg-card">
            <CardHeader className="border-b border-border/60 bg-linear-to-r from-primary/8 via-background to-background">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <CardTitle className="flex items-center gap-2 text-base">
                        <Sparkles className="size-4 text-primary" />
                        AI Business Insights
                    </CardTitle>
                    <Badge variant={data.source === "ai" ? "success" : "secondary"}>
                        {data.source === "ai" ? "AI powered" : "Rule-based fallback"}
                    </Badge>
                </div>
                <p className="text-sm text-muted-foreground max-w-3xl">
                    {data.headline}
                </p>
                {data.summary && (
                    <p className="text-sm leading-6 text-foreground/90 max-w-4xl">
                        {data.summary}
                    </p>
                )}
            </CardHeader>

            <CardContent className="space-y-5 p-5">
                <div className="grid gap-3 sm:grid-cols-3">
                    <InsightChip label="Confidence" value={data.confidence} icon={Target} />
                    <InsightChip label="Risks" value={String(data.risks.length)} icon={TrendingUp} />
                    <InsightChip
                        label="Recommendations"
                        value={String(data.recommendations.length)}
                        icon={Lightbulb}
                    />
                </div>

                <div className="space-y-3">
                    {data.recommendations.map((item, index) => (
                        <div
                            key={`${item.title}-${index}`}
                            className="rounded-2xl border border-border/70 bg-muted/30 p-4"
                        >
                            <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                                <div className="space-y-1">
                                    <div className="flex items-center gap-2">
                                        <h3 className="font-semibold text-sm sm:text-base">
                                            {item.title}
                                        </h3>
                                        <Badge variant={priorityVariant[item.priority]}>
                                            {item.priority}
                                        </Badge>
                                    </div>
                                    <p className="text-sm text-muted-foreground">
                                        {item.reason}
                                    </p>
                                </div>
                            </div>
                            <p className="mt-3 text-sm leading-6 text-foreground">
                                {item.action}
                            </p>
                        </div>
                    ))}
                </div>

                {(data.opportunities.length > 0 || data.risks.length > 0) && (
                    <div className="grid gap-3 lg:grid-cols-2">
                        {data.opportunities.length > 0 && (
                            <div className="rounded-2xl border border-success/30 bg-success/5 p-4">
                                <p className="mb-2 text-xs font-semibold uppercase tracking-[0.14em] text-success">
                                    Opportunities
                                </p>
                                <ul className="space-y-2 text-sm text-foreground/90">
                                    {data.opportunities.map((item) => (
                                        <li key={item} className="flex gap-2">
                                            <span className="mt-1.5 size-1.5 rounded-full bg-success shrink-0" />
                                            <span>{item}</span>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        )}

                        {data.risks.length > 0 && (
                            <div className="rounded-2xl border border-destructive/30 bg-destructive/5 p-4">
                                <p className="mb-2 text-xs font-semibold uppercase tracking-[0.14em] text-destructive">
                                    Risks
                                </p>
                                <ul className="space-y-2 text-sm text-foreground/90">
                                    {data.risks.map((item) => (
                                        <li key={item} className="flex gap-2">
                                            <span className="mt-1.5 size-1.5 rounded-full bg-destructive shrink-0" />
                                            <span>{item}</span>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        )}
                    </div>
                )}
            </CardContent>
        </Card>
    )
}

function InsightChip({
    label,
    value,
    icon: Icon,
}: {
    label: string
    value: string
    icon: LucideIcon
}) {
    return (
        <div className="flex items-center gap-3 rounded-2xl border border-border/70 bg-background p-3">
            <div className="rounded-xl bg-primary/10 p-2">
                <Icon className="size-4 text-primary" />
            </div>
            <div>
                <p className="text-[11px] uppercase tracking-[0.14em] text-muted-foreground">
                    {label}
                </p>
                <p className="text-sm font-semibold text-foreground capitalize">{value}</p>
            </div>
        </div>
    )
}
