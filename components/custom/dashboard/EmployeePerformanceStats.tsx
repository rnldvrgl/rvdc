"use client"

import { ListCardSkeleton } from "@/components/custom/shared/skeletons"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useDateParamsFromForm } from "@/lib/hooks/useDateParamsFromForm"
import { useEmployeePerformance } from "@/lib/queries/analytics/useGetAnalytics"
import { formatCurrency } from "@/lib/utils/helpers"
import { getServiceTypeLabel } from "@/lib/utils/helpers/service"
import {
  Award,
  Clock,
  Crown,
  Medal,
  Timer,
  TrendingUp,
  Trophy,
  Users,
  Wrench,
} from "lucide-react"

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

  const rankColors = ["text-yellow-500", "text-slate-400", "text-amber-600"]

  const rankIcons = [Crown, Medal, Award]

  return (
    <div className="grid lg:grid-cols-2 gap-6">
      {/* Top Service Types */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm sm:text-base flex items-center gap-2 flex-wrap">
            <div className="p-2 rounded-lg bg-purple-100 dark:bg-purple-950 shrink-0">
              <Wrench className="size-4 text-purple-600 dark:text-purple-400" />
            </div>
            <span className="truncate">Top Service Types</span>
            <Badge
              variant="secondary"
              className="ml-auto text-xs shrink-0"
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
            <p className="text-sm text-muted-foreground text-center py-4">
              No completed services in this period
            </p>
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
                      >
                        {type.count} jobs
                      </Badge>
                    </div>
                  </div>
                  <div className="h-1.5 w-full bg-muted rounded-full overflow-hidden">
                    <div
                      className="h-full bg-purple-500 rounded-full transition-all"
                      style={{ width: `${(type.count / maxCount) * 100}%` }}
                    />
                  </div>
                </div>
              )
            })
          )}
        </CardContent>
      </Card>

      {/* Top Technicians */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm sm:text-base flex items-center gap-2 flex-wrap">
            <div className="p-2 rounded-lg bg-yellow-100 dark:bg-yellow-950 shrink-0">
              <Trophy className="size-4 text-warning" />
            </div>
            <span className="truncate">Top Technicians</span>
            <Badge
              variant="secondary"
              className="ml-auto text-xs shrink-0"
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
            <p className="text-sm text-muted-foreground text-center py-4">
              No technician assignments in this period
            </p>
          ) : (
            data.top_technicians.map((tech, index) => {
              const RankIcon = rankIcons[index] || Users
              const rankColor = rankColors[index] || "text-muted-foreground"
              return (
                <div
                  key={tech.employee_id}
                  className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/50 transition-colors"
                >
                  <div className="flex items-center justify-center w-8 h-8 rounded-full bg-muted">
                    <RankIcon className={`size-4 ${rankColor}`} />
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
                      variant={
                        tech.completion_rate >= 80
                          ? "default"
                          : tech.completion_rate >= 50
                            ? "secondary"
                            : "outline"
                      }
                      className={`text-xs tabular-nums ${
                        tech.completion_rate >= 80
                          ? "bg-green-500/10 text-success border-green-500/20"
                          : ""
                      }`}
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

      {/* Most Late */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm sm:text-base flex items-center gap-2 flex-wrap">
            <div className="p-2 rounded-lg bg-red-100 dark:bg-red-950 shrink-0">
              <Timer className="size-4 text-destructive" />
            </div>
            <span className="truncate">Most Late Arrivals</span>
            <Badge
              variant="outline"
              className="ml-auto text-xs shrink-0 border-red-200 text-destructive dark:border-red-800"
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
            <p className="text-sm text-muted-foreground text-center py-4">
              No late arrivals recorded — great job everyone! 🎉
            </p>
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
                  <div className="flex items-center justify-center w-8 h-8 rounded-full bg-red-100 dark:bg-red-950/50">
                    <Clock className="size-4 text-red-500" />
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
                    className="text-xs tabular-nums border-red-200 text-destructive dark:border-red-800"
                  >
                    {emp.late_count} {emp.late_count === 1 ? "day" : "days"}
                  </Badge>
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
            <div className="p-2 rounded-lg bg-green-100 dark:bg-green-950 shrink-0">
              <TrendingUp className="size-4 text-success" />
            </div>
            <span className="truncate">Most Punctual</span>
            <Badge
              variant="outline"
              className="ml-auto text-xs shrink-0 border-green-200 text-success dark:border-green-800"
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
            <p className="text-sm text-muted-foreground text-center py-4">
              No attendance records in this period
            </p>
          ) : (
            data.most_punctual.map((emp, index) => {
              const RankIcon = rankIcons[index] || Users
              const rankColor = rankColors[index] || "text-muted-foreground"
              return (
                <div
                  key={emp.employee_id}
                  className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/50 transition-colors"
                >
                  <div className="flex items-center justify-center w-8 h-8 rounded-full bg-green-100 dark:bg-green-950/50">
                    <RankIcon className={`size-4 ${rankColor}`} />
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
                  <Badge
                    variant="outline"
                    className={`text-xs tabular-nums ${
                      emp.punctuality_rate >= 90
                        ? "border-green-200 text-success dark:border-green-800"
                        : emp.punctuality_rate >= 70
                          ? "border-yellow-200 text-yellow-600 dark:border-yellow-800 dark:text-yellow-400"
                          : "border-red-200 text-destructive dark:border-red-800"
                    }`}
                  >
                    {emp.punctuality_rate}%
                  </Badge>
                </div>
              )
            })
          )}
        </CardContent>
      </Card>
    </div>
  )
}
