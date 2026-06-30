"use client"

import { EmptyState } from "@/components/custom/EmptyState"
import { ListCardSkeleton } from "@/components/custom/shared/skeletons"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Service } from "@/lib/constants/interface"
import { useUnclaimedEligibleServices } from "@/lib/queries/services/useCompanyAssets"
import { formatDateFull } from "@/lib/utils/helpers/date"
import { differenceInDays } from "date-fns"
import { AlertTriangle, Building2, CheckCircle } from "lucide-react"
import Link from "next/link"

function getDaysSinceCompletion(completedAt: string | null | undefined): number | null {
    if (!completedAt) return null
    return differenceInDays(new Date(), new Date(completedAt))
}

function getUrgencyClass(days: number) {
    if (days >= 90) return { border: "border-red-200", bg: "bg-red-50/50 dark:bg-red-900/10", text: "text-red-700 dark:text-red-300", label: "text-red-900 dark:text-red-100" }
    if (days >= 60) return { border: "border-amber-200", bg: "bg-amber-50/50 dark:bg-amber-900/10", text: "text-amber-700 dark:text-amber-300", label: "text-amber-900 dark:text-amber-100" }
    return { border: "border-yellow-200", bg: "bg-yellow-50/50 dark:bg-yellow-900/10", text: "text-yellow-700 dark:text-yellow-300", label: "text-yellow-900 dark:text-yellow-100" }
}

export function UnclaimedApplianceAlerts() {
    const { data: services, isLoading } = useUnclaimedEligibleServices()

    if (isLoading) {
        return <ListCardSkeleton rows={3} />
    }

    const totalCount = services?.length ?? 0
    const shown = services?.slice(0, 4) ?? []
    const remaining = totalCount - shown.length

    if (!services || services.length === 0) {
        return (
            <EmptyState
                title="No unclaimed appliances"
                description="All appliances have been claimed by their respective clients."
                icon={CheckCircle}
            />
        )
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle className="text-sm sm:text-base flex items-center gap-2">
                    <Building2 className="size-5 shrink-0" />
                    <span className="truncate">Unclaimed Appliances</span>
                    {totalCount > 0 && (
                        <Badge variant="warning" className="ml-auto shrink-0" suppressHydrationWarning>
                            {totalCount}
                        </Badge>
                    )}
                </CardTitle>
            </CardHeader>
            <CardContent>
                <div className="space-y-2">
                    {shown.map((service: Service) => {
                        const days = getDaysSinceCompletion(service.completed_at)
                        const urgency = getUrgencyClass(days ?? 60)
                        return (
                            <Link key={service.id} href={`/services?view=${service.id}`}>
                                <div
                                    className={`p-3 rounded-lg border ${urgency.border} ${urgency.bg} hover:opacity-80 transition-colors`}
                                >
                                    <div className="flex items-start gap-2">
                                        <AlertTriangle className={`size-4 mt-0.5 shrink-0 ${urgency.text}`} />
                                        <div className="flex-1 min-w-0">
                                            <p className={`text-sm font-medium ${urgency.label}`}>
                                                SVC-{service.id}
                                                {service.client?.full_name ? ` · ${service.client.full_name}` : ""}
                                            </p>
                                            <p className={`text-xs ${urgency.text} mt-0.5`}>
                                                {days !== null ? `${days} days since completion` : "Completed"}
                                                {service.completed_at
                                                    ? ` · ${formatDateFull(service.completed_at)}`
                                                    : ""}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </Link>
                        )
                    })}
                    {remaining > 0 && (
                        <Link href="/company-assets">
                            <p className="text-xs text-muted-foreground text-center py-1 hover:underline">
                                +{remaining} more — view Company Assets
                            </p>
                        </Link>
                    )}
                </div>
            </CardContent>
        </Card>
    )
}
