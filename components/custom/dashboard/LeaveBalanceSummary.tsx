"use client"

import { AnimatedNumber } from "@/components/custom/shared/AnimatedNumber"
import RedirectRoute from "@/components/custom/navigation/RedirectRoute"
import { StatCardSkeleton } from "@/components/custom/shared/skeletons"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useMyLeaveBalance } from "@/lib/queries/useAttendance"
import { cn } from "@/lib/utils/helpers"
import { HeartPulse, Plane, TriangleAlert } from "lucide-react"
import type { LucideIcon } from "lucide-react"

type LeaveRowProps = {
    icon: LucideIcon
    label: string
    used: number
    total: number
    remaining: number
    tone: "info" | "warning"
}

const toneClasses: Record<LeaveRowProps["tone"], { icon: string; bar: string; number: string }> = {
    info: {
        icon: "bg-info/15 text-info",
        bar: "bg-info",
        number: "text-info",
    },
    warning: {
        icon: "bg-warning/15 text-warning",
        bar: "bg-warning",
        number: "text-warning",
    },
}

function LeaveRow({ icon: Icon, label, used, total, remaining, tone }: LeaveRowProps) {
    const classes = toneClasses[tone]
    const usedPct = total > 0 ? Math.min(100, Math.round((used / total) * 100)) : 0

    return (
        <div className="rounded-lg border p-3 space-y-3">
            <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-3 min-w-0">
                    <div className={cn("p-2 rounded-lg shrink-0", classes.icon)}>
                        <Icon className="h-4 w-4" />
                    </div>
                    <div className="min-w-0">
                        <p className="text-sm font-medium truncate">{label}</p>
                        <p className="text-xs text-muted-foreground">
                            {used} used / {total} total
                        </p>
                    </div>
                </div>
                <div className={cn("text-2xl font-bold tabular-nums shrink-0", classes.number)}>
                    <AnimatedNumber value={remaining} format={{ maximumFractionDigits: 0 }} />
                </div>
            </div>
            <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                <div
                    className={cn("h-full rounded-full transition-all", classes.bar)}
                    style={{ width: `${usedPct}%` }}
                />
            </div>
        </div>
    )
}

export function LeaveBalanceSummary() {
    const { data: balance, isLoading } = useMyLeaveBalance()

    if (isLoading) {
        return <StatCardSkeleton rows={2} />
    }

    return (
        <Card className="relative h-full">
            <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                    <Plane className="size-4 text-primary" />
                    Leave Balance
                    <RedirectRoute href="/attendance/leaves" />
                </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
                <LeaveRow
                    icon={HeartPulse}
                    label="Sick Leave"
                    used={Number(balance?.sick_leave_used) || 0}
                    total={Number(balance?.sick_leave_total) || 0}
                    remaining={Number(balance?.sick_leave_remaining) || 0}
                    tone="info"
                />
                <LeaveRow
                    icon={TriangleAlert}
                    label="Emergency Leave"
                    used={Number(balance?.emergency_leave_used) || 0}
                    total={Number(balance?.emergency_leave_total) || 0}
                    remaining={Number(balance?.emergency_leave_remaining) || 0}
                    tone="warning"
                />
            </CardContent>
        </Card>
    )
}
