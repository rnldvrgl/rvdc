"use client"

import { EmptyState } from "@/components/custom/EmptyState"
import { ListCardSkeleton } from "@/components/custom/shared/skeletons"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useDateParamsFromForm } from "@/lib/hooks/useDateParamsFromForm"
import { useEmployeePerformance } from "@/lib/queries/analytics/useGetAnalytics"
import { formatCurrency } from "@/lib/utils/helpers"
import { getServiceTypeLabel } from "@/lib/utils/helpers/service"
import {
    Award,
    CheckCircle,
    Clock,
    Crown,
    Medal,
    Timer,
    TrendingUp,
    Trophy,
    Users,
    Wrench,
} from "lucide-react"

// ── Theme helpers ────────────────────────────────────────────────────────────
// All colors resolve through CSS custom properties so the component follows
// the active theme (light/dark/brand) instead of baking in fixed Tailwind hues.

const tint = (cssVar: string, pct = 12) =>
    `color-mix(in srgb, var(${cssVar}) ${pct}%, transparent)`

const rankColorVars = ["--chart-4", "--muted-foreground", "--chart-5"] // gold/silver/bronze-ish via theme chart slots
const rankIcons = [Crown, Medal, Award]

function rankIconStyle(index: number) {
    const v = rankColorVars[index] ?? "--muted-foreground"
    return { color: `var(${v})` }
}

function rankBadgeBgStyle(index: number) {
    const v = rankColorVars[index] ?? "--muted-foreground"
    return { backgroundColor: tint(v, 14) }
}

export function EmployeePerformanceStats() {
    const { start_date, end_date } = useDateParamsFromForm()

    const { data, isLoading } = useEmployeePerformance({
        start_date,
        end_date,
        enabled: !!start_date && !!end_date,
    })

    if (isLoading) {
        return (
            <div className="grid lg:grid-cols-2 gap-6">
                <ListCardSkeleton rows={4} />
                <ListCardSkeleton rows={4} />
                <ListCardSkeleton rows={4} />
                <ListCardSkeleton rows={4} />
            </div>
        )
    }

    if (!data) return null

    return (
        <div className="grid lg:grid-cols-2 gap-6">

            {/* Top Technicians */}
            <Card>
                <CardHeader className="pb-3">
                    <CardTitle className="text-sm sm:text-base flex items-center gap-2 flex-wrap">
                        <div
                            className="p-2 rounded-lg shrink-0"
                            style={{ backgroundColor: tint("--warning") }}
                        >
                            <Trophy className="size-4" style={{ color: "var(--warning)" }} />
                        </div>
                        <span className="truncate">Top Technicians</span>
                        <Badge
                            variant="outline"
                            className="ml-auto text-xs shrink-0"
                            style={{ borderColor: tint("--warning", 30), color: "var(--warning)" }}
                        >
                            By Assignments
                        </Badge>
                    </CardTitle>
                    <p className="text-xs text-muted-foreground">
                        Technicians with the most service assignments
                    </p>
                </CardHeader>
                <CardContent className="space-y-2">
                    {data.top_technicians.length === 0 ? (
                        <EmptyState
                            title="No technicians found"
                            description="No service assignments recorded in this period"
                            icon={Users}
                        />
                    ) : (
                        data.top_technicians.map((tech, index) => {
                            const RankIcon = rankIcons[index] || Users
                            return (
                                <div
                                    key={tech.employee_id}
                                    className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/50 transition-colors"
                                >
                                    <div
                                        className="flex items-center justify-center w-8 h-8 rounded-full"
                                        style={index < 3 ? rankBadgeBgStyle(index) : { backgroundColor: "var(--muted)" }}
                                    >
                                        <RankIcon
                                            className="size-4"
                                            style={index < 3 ? rankIconStyle(index) : { color: "var(--muted-foreground)" }}
                                        />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm font-medium truncate">
                                            {tech.employee_name}
                                        </p>
                                        <div className="flex items-center gap-1.5 sm:gap-2 text-xs text-muted-foreground flex-wrap">
                                            <span>{tech.total_assignments} assigned</span>
                                            <span>·</span>
                                            <span>{tech.completed} done</span>
                                            <span className="hidden sm:inline">·</span>
                                            <span className="hidden sm:inline">
                                                {formatCurrency(tech.total_revenue)}
                                            </span>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <Badge
                                            variant={tech.completion_rate >= 80 ? "default" : tech.completion_rate >= 50 ? "secondary" : "outline"}
                                            className="text-xs tabular-nums"
                                            style={
                                                tech.completion_rate >= 80
                                                    ? {
                                                        backgroundColor: tint("--success", 12),
                                                        color: "var(--success)",
                                                        borderColor: tint("--success", 25),
                                                    }
                                                    : undefined
                                            }
                                        >
                                            {tech.completion_rate}%
                                        </Badge>
                                    </div>
                                </div>
                            )
                        })
                    )}
                </CardContent>
            </Card>

            {/* Most Punctual */}
            <Card>
                <CardHeader className="pb-3">
                    <CardTitle className="text-sm sm:text-base flex items-center gap-2 flex-wrap">
                        <div
                            className="p-2 rounded-lg shrink-0"
                            style={{ backgroundColor: tint("--success") }}
                        >
                            <TrendingUp className="size-4" style={{ color: "var(--success)" }} />
                        </div>
                        <span className="truncate">Most Punctual</span>
                        <Badge
                            variant="outline"
                            className="ml-auto text-xs shrink-0"
                            style={{ borderColor: tint("--success", 30), color: "var(--success)" }}
                        >
                            On-Time
                        </Badge>
                    </CardTitle>
                    <p className="text-xs text-muted-foreground">
                        Employees with the best on-time attendance
                    </p>
                </CardHeader>
                <CardContent className="space-y-2">
                    {data.most_punctual.length === 0 ? (
                        <EmptyState
                            title="No punctuality data"
                            description="No attendance records found in this period"
                            icon={Users}
                        />
                    ) : (
                        data.most_punctual.map((emp, index) => {
                            const RankIcon = rankIcons[index] || Users
                            const badgeStyle =
                                emp.punctuality_rate >= 90
                                    ? { borderColor: tint("--success", 30), color: "var(--success)" }
                                    : emp.punctuality_rate >= 70
                                        ? { borderColor: tint("--warning", 30), color: "var(--warning)" }
                                        : { borderColor: tint("--destructive", 30), color: "var(--destructive)" }
                            return (
                                <div
                                    key={emp.employee_id}
                                    className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/50 transition-colors"
                                >
                                    <div
                                        className="flex items-center justify-center w-8 h-8 rounded-full"
                                        style={{ backgroundColor: tint("--success", 14) }}
                                    >
                                        <RankIcon
                                            className="size-4"
                                            style={index < 3 ? rankIconStyle(index) : { color: "var(--success)" }}
                                        />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm font-medium truncate">
                                            {emp.employee_name}
                                        </p>
                                        <div className="flex items-center gap-1.5 sm:gap-2 text-xs text-muted-foreground flex-wrap">
                                            <span>{emp.on_time_days} on-time</span>
                                            <span>·</span>
                                            <span>{emp.total_days} total</span>
                                            <span className="hidden sm:inline">·</span>
                                            <span className="hidden sm:inline">
                                                {emp.total_paid_hours.toFixed(1)}h paid
                                            </span>
                                        </div>
                                    </div>
                                    <Badge variant="outline" className="text-xs tabular-nums" style={badgeStyle}>
                                        {emp.punctuality_rate}%
                                    </Badge>
                                </div>
                            )
                        })
                    )}
                </CardContent>
            </Card>

            {/* Most Late */}
            <Card>
                <CardHeader className="pb-3">
                    <CardTitle className="text-sm sm:text-base flex items-center gap-2 flex-wrap">
                        <div
                            className="p-2 rounded-lg shrink-0"
                            style={{ backgroundColor: tint("--destructive") }}
                        >
                            <Timer className="size-4" style={{ color: "var(--destructive)" }} />
                        </div>
                        <span className="truncate">Most Late Arrivals</span>
                        <Badge
                            variant="outline"
                            className="ml-auto text-xs shrink-0"
                            style={{ borderColor: tint("--destructive", 30), color: "var(--destructive)" }}
                        >
                            Attendance
                        </Badge>
                    </CardTitle>
                    <p className="text-xs text-muted-foreground">
                        Employees with the most late check-ins
                    </p>
                </CardHeader>
                <CardContent className="space-y-2">
                    {data.most_late.length === 0 ? (
                        <EmptyState
                            title="No late arrivals"
                            description="No employees have been recorded as late."
                            icon={Clock}
                        />
                    ) : (
                        data.most_late.map((emp) => {
                            const hours = Math.floor(emp.total_late_minutes / 60)
                            const mins = emp.total_late_minutes % 60
                            const lateTime = hours > 0 ? `${hours}h ${mins}m` : `${mins}m`
                            return (
                                <div
                                    key={emp.employee_id}
                                    className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/50 transition-colors"
                                >
                                    <div
                                        className="flex items-center justify-center w-8 h-8 rounded-full"
                                        style={{ backgroundColor: tint("--destructive", 14) }}
                                    >
                                        <Clock className="size-4" style={{ color: "var(--destructive)" }} />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm font-medium truncate">
                                            {emp.employee_name}
                                        </p>
                                        <p className="text-xs text-muted-foreground">
                                            Total late: {lateTime}
                                        </p>
                                    </div>
                                    <Badge
                                        variant="outline"
                                        className="text-xs tabular-nums"
                                        style={{ borderColor: tint("--destructive", 30), color: "var(--destructive)" }}
                                    >
                                        {emp.late_count} {emp.late_count === 1 ? "day" : "days"}
                                    </Badge>
                                </div>
                            )
                        })
                    )}
                </CardContent>
            </Card>

            {/* Top Service Types */}
            <Card>
                <CardHeader className="pb-3">
                    <CardTitle className="text-sm sm:text-base flex items-center gap-2 flex-wrap">
                        <div
                            className="p-2 rounded-lg shrink-0"
                            style={{ backgroundColor: tint("--chart-2") }}
                        >
                            <Wrench className="size-4" style={{ color: "var(--chart-2)" }} />
                        </div>
                        <span className="truncate">Top Service Types</span>
                        <Badge
                            variant="outline"
                            className="ml-auto text-xs shrink-0"
                            style={{ borderColor: tint("--chart-2", 30), color: "var(--chart-2)" }}
                        >
                            Completed
                        </Badge>
                    </CardTitle>
                    <p className="text-xs text-muted-foreground">
                        Most completed service types in this period
                    </p>
                </CardHeader>
                <CardContent className="space-y-3">
                    {data.top_service_types.length === 0 ? (
                        <EmptyState
                            title="No completed services"
                            description="No services have been completed in this period."
                            icon={CheckCircle}
                        />
                    ) : (
                        data.top_service_types.map((type, index) => {
                            const maxCount = data.top_service_types[0]?.count || 1
                            return (
                                <div
                                    key={type.service_type}
                                    className="space-y-1.5"
                                >
                                    <div className="flex items-center justify-between text-sm gap-2">
                                        <div className="flex items-center gap-2 min-w-0">
                                            <span className="text-xs font-bold text-muted-foreground w-5 shrink-0">
                                                #{index + 1}
                                            </span>
                                            <span className="font-medium truncate">
                                                {getServiceTypeLabel(type.service_type)}
                                            </span>
                                        </div>
                                        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
                                            <span className="text-xs text-muted-foreground hidden sm:inline">
                                                {formatCurrency(type.revenue)}
                                            </span>
                                            <Badge
                                                variant="outline"
                                                className="text-xs tabular-nums"
                                                style={{ borderColor: "var(--chart-2)", color: "var(--chart-2)" }}
                                            >
                                                {type.count} jobs
                                            </Badge>
                                        </div>
                                    </div>
                                    <div
                                        className="h-1.5 w-full rounded-full overflow-hidden"
                                        style={{ backgroundColor: "var(--muted)" }}
                                    >
                                        <div
                                            className="h-full rounded-full transition-all"
                                            style={{
                                                width: `${(type.count / maxCount) * 100}%`,
                                                backgroundColor: "var(--chart-2)",
                                            }}
                                        />
                                    </div>
                                    {type.top_technician && (
                                        <div className="flex items-center justify-between gap-2 rounded-md border border-dashed border-border/70 bg-muted/40 px-3 py-2 text-xs text-muted-foreground">
                                            <span className="truncate">
                                                Top tech: {type.top_technician.employee_name}
                                            </span>
                                            <span className="shrink-0 tabular-nums">
                                                {type.top_technician.completed_count} completed
                                            </span>
                                        </div>
                                    )}
                                </div>
                            )
                        })
                    )}
                </CardContent>
            </Card>

        </div>
    )
}
