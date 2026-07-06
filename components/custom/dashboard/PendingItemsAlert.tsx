"use client"

import { EmptyState } from "@/components/custom/EmptyState"
import { AnimatedNumber } from "@/components/custom/shared/AnimatedNumber"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { usePendingItemsStats } from "@/lib/queries/services/usePendingItemsStats"
import { ArrowRight, CheckCircle, Package } from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"

const tint = (cssVar: string, pct = 12) =>
    `color-mix(in srgb, var(${cssVar}) ${pct}%, transparent)`

export function PendingItemsAlert() {
    const router = useRouter()
    const { data } = usePendingItemsStats()

    if (!data || data.total_pending_services === 0) {
        return (
            <EmptyState
                title="No pending items"
                description="All items have been reviewed and processed."
                icon={CheckCircle}
            />
        )
    }

    return (
        <Card className="@container overflow-hidden">
            <CardHeader>
                <CardTitle className="text-sm @sm:text-base flex items-center gap-2 min-w-0">
                    <div
                        className="p-2 rounded-lg shrink-0"
                        style={{ backgroundColor: tint("--warning") }}
                    >
                        <Package className="size-4" style={{ color: "var(--warning)" }} />
                    </div>
                    <span className="truncate min-w-0">Items Pending Review</span>
                    <Badge
                        variant="destructive"
                        className="ml-auto text-xs shrink-0"
                    >
                        <AnimatedNumber value={data.total_pending_services ?? data.total_unchecked_appliances} className="text-xs" />
                    </Badge>
                </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 px-3 @sm:px-6">
                <div className="space-y-2">
                    {data.services.slice(0, 5).map((svc) => (
                        <button
                            key={svc.service_id}
                            type="button"
                            onClick={() => router.push(`/services?view=${svc.service_id}`)}
                            className="group flex items-center gap-2 @sm:gap-3 p-2.5 rounded-lg border hover:bg-muted/50 transition-all w-full text-left cursor-pointer min-w-0"
                        >
                            <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium truncate capitalize">
                                    {svc.client_name || "Unknown Client"}
                                </p>
                                <p className="text-xs text-muted-foreground mt-0.5 truncate">
                                    {svc.service_type}
                                    {svc.unchecked_appliances > 0 && (
                                        <>
                                            {" "}
                                            · <AnimatedNumber value={svc.unchecked_appliances} className="text-xs text-muted-foreground" /> of <AnimatedNumber value={svc.total_appliances} className="text-xs text-muted-foreground" /> unchecked
                                        </>
                                    )}
                                    {svc.has_service_level_pending && <> · Parts pending</>}
                                </p>
                            </div>
                            {(svc.unchecked_appliances > 0 || svc.has_service_level_pending) && (
                                <Badge
                                    variant="outline"
                                    className="shrink-0 text-[10px] @sm:text-xs px-1.5 @sm:px-2"
                                    style={{
                                        borderColor: tint("--warning", 30),
                                        color: "var(--warning)",
                                    }}
                                >
                                    <AnimatedNumber value={svc.unchecked_appliances > 0 ? svc.unchecked_appliances : 1} className="text-xs" />
                                </Badge>
                            )}
                            <ArrowRight className="size-3.5 text-muted-foreground shrink-0 transition-transform duration-200 group-hover:translate-x-0.5" />
                        </button>
                    ))}
                </div>

                {data.total_pending_services > 5 && (
                    <Link
                        href="/services"
                        className="group flex items-center justify-center gap-1 text-xs text-primary hover:underline pt-1"
                    >
                        <span className="truncate">View All <AnimatedNumber value={data.total_pending_services} className="text-xs" /> Services</span>
                        <ArrowRight className="size-3 shrink-0 transition-transform duration-200 group-hover:translate-x-0.5" />
                    </Link>
                )}
            </CardContent>
        </Card>
    )
}
