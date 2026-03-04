"use client"

import { Card, CardContent } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { cn } from "@/lib/utils/helpers"
import {
  AlertTriangle,
  CheckCircle,
  Clock,
  type LucideIcon,
  TrendingUp,
  UserCheck,
  UserX,
  XCircle,
} from "lucide-react"

interface StatItem {
  label: string
  value: number
  icon: LucideIcon
  color: string
  bgColor: string
  borderColor: string
}

interface AttendanceOverviewStatsProps {
  stats: {
    totalCount: number
    approvedCount: number
    pendingCount: number
    rejectedCount: number
    presentCount: number
    absentCount: number
    lateCount: number
    leaveCount: number
    totalHours: number
  }
  isLoading: boolean
}

export function AttendanceOverviewStats({
  stats,
  isLoading,
}: AttendanceOverviewStatsProps) {
  const monthName = new Date().toLocaleDateString("en-US", { month: "long" })

  const primaryStats: StatItem[] = [
    {
      label: "Total Records",
      value: stats.totalCount,
      icon: TrendingUp,
      color: "text-blue-600 dark:text-blue-400",
      bgColor: "bg-blue-50 dark:bg-blue-950/50",
      borderColor: "border-blue-100 dark:border-blue-900/50",
    },
    {
      label: "Approved",
      value: stats.approvedCount,
      icon: CheckCircle,
      color: "text-emerald-600 dark:text-emerald-400",
      bgColor: "bg-emerald-50 dark:bg-emerald-950/50",
      borderColor: "border-emerald-100 dark:border-emerald-900/50",
    },
    {
      label: "Pending",
      value: stats.pendingCount,
      icon: Clock,
      color: "text-amber-600 dark:text-amber-400",
      bgColor: "bg-amber-50 dark:bg-amber-950/50",
      borderColor: "border-amber-100 dark:border-amber-900/50",
    },
    {
      label: "Rejected",
      value: stats.rejectedCount,
      icon: XCircle,
      color: "text-red-600 dark:text-red-400",
      bgColor: "bg-red-50 dark:bg-red-950/50",
      borderColor: "border-red-100 dark:border-red-900/50",
    },
  ]

  const secondaryStats: StatItem[] = [
    {
      label: "Present",
      value: stats.presentCount,
      icon: UserCheck,
      color: "text-emerald-600 dark:text-emerald-400",
      bgColor: "bg-emerald-50 dark:bg-emerald-950/50",
      borderColor: "border-emerald-100 dark:border-emerald-900/50",
    },
    {
      label: "Absent",
      value: stats.absentCount,
      icon: UserX,
      color: "text-rose-600 dark:text-rose-400",
      bgColor: "bg-rose-50 dark:bg-rose-950/50",
      borderColor: "border-rose-100 dark:border-rose-900/50",
    },
    {
      label: "Late",
      value: stats.lateCount,
      icon: AlertTriangle,
      color: "text-amber-600 dark:text-amber-400",
      bgColor: "bg-amber-50 dark:bg-amber-950/50",
      borderColor: "border-amber-100 dark:border-amber-900/50",
    },
  ]

  if (isLoading) {
    return (
      <div className="space-y-3 md:space-y-4">
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-2 md:gap-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <Card
              key={i}
              className="border"
            >
              <CardContent className="p-3 md:p-4">
                <Skeleton className="h-4 w-20 mb-3" />
                <Skeleton className="h-8 w-14" />
              </CardContent>
            </Card>
          ))}
        </div>
        <div className="grid md:grid-cols-3 gap-2 md:gap-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Card
              key={i}
              className="border"
            >
              <CardContent className="p-3 md:p-4">
                <Skeleton className="h-4 w-16 mb-3" />
                <Skeleton className="h-8 w-12" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-2 md:space-y-3">
      {/* Month indicator */}
      <div className="flex items-center gap-2 px-1">
        <div className="h-1.5 w-1.5 rounded-full bg-primary" />
        <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
          {monthName} Overview
        </span>
      </div>

      {/* Primary stats - approval statuses */}
      <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-2 md:gap-3">
        {primaryStats.map((stat) => (
          <StatMiniCard
            key={stat.label}
            stat={stat}
          />
        ))}
      </div>

      {/* Secondary stats - attendance types */}
      <div className="grid md:grid-cols-3 gap-2 md:gap-3">
        {secondaryStats.map((stat) => (
          <StatMiniCard
            key={stat.label}
            stat={stat}
            variant="compact"
          />
        ))}
      </div>
    </div>
  )
}

function StatMiniCard({
  stat,
  variant = "default",
}: {
  stat: StatItem
  variant?: "default" | "compact"
}) {
  const Icon = stat.icon

  return (
    <Card
      className={cn(
        "group relative overflow-hidden border transition-all duration-200 hover:shadow-md",
        stat.borderColor,
      )}
    >
      {/* Subtle gradient overlay */}
      <div
        className={cn(
          "absolute inset-0 opacity-30 transition-opacity group-hover:opacity-50",
          stat.bgColor,
        )}
      />

      <CardContent
        className={cn(
          "relative",
          variant === "compact" ? "p-2.5 md:p-3 lg:p-4" : "p-3 md:p-4 lg:p-5",
        )}
      >
        <div className="flex items-center justify-between">
          <div className="space-y-0.5 md:space-y-1">
            <p className="text-[10px] md:text-xs font-medium text-muted-foreground">
              {stat.label}
            </p>
            <p
              className={cn(
                "font-bold tabular-nums",
                variant === "compact"
                  ? "text-lg md:text-xl lg:text-2xl"
                  : "text-xl md:text-2xl lg:text-3xl",
                stat.color,
              )}
            >
              {stat.value}
            </p>
          </div>
          <div
            className={cn(
              "rounded-lg p-1.5 md:p-2 transition-transform duration-200 group-hover:scale-110",
              stat.bgColor,
            )}
          >
            <Icon
              className={cn(
                stat.color,
                variant === "compact"
                  ? "h-3.5 w-3.5 md:h-4 md:w-4"
                  : "h-4 w-4 md:h-5 md:w-5",
              )}
            />
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
