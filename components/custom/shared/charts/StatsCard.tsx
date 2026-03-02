"use client"

import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { cn } from "@/lib/utils/helpers"
import { LucideIcon, Minus, TrendingDown, TrendingUp } from "lucide-react"
import Link from "next/link"

interface StatsCardProps {
  title: string
  value: string | number | React.ReactNode
  icon: LucideIcon
  trend?: {
    value: number
    label: string
  }
  isLoading?: boolean
  variant?: "default" | "success" | "warning" | "danger" | "info"
  className?: string
  href?: string
}

const variantStyles = {
  default: {
    bg: "bg-linear-to-br from-slate-50/80 to-slate-100/60 dark:from-slate-900/50 dark:to-slate-800/30",
    icon: "bg-slate-100/80 dark:bg-slate-800/60",
    iconColor: "text-slate-600 dark:text-slate-400",
    border: "border-slate-200/60 dark:border-slate-700/40",
  },
  success: {
    bg: "bg-linear-to-br from-emerald-50/70 to-emerald-100/50 dark:from-emerald-950/30 dark:to-emerald-900/20",
    icon: "bg-emerald-100/70 dark:bg-emerald-900/40",
    iconColor: "text-emerald-600 dark:text-emerald-400",
    border: "border-emerald-200/50 dark:border-emerald-700/30",
  },
  warning: {
    bg: "bg-linear-to-br from-amber-50/70 to-orange-100/50 dark:from-amber-950/30 dark:to-orange-900/20",
    icon: "bg-amber-100/70 dark:bg-amber-900/40",
    iconColor: "text-amber-600 dark:text-amber-400",
    border: "border-amber-200/50 dark:border-amber-700/30",
  },
  danger: {
    bg: "bg-linear-to-br from-red-50/70 to-rose-100/50 dark:from-red-950/30 dark:to-rose-900/20",
    icon: "bg-red-100/70 dark:bg-red-900/40",
    iconColor: "text-red-600 dark:text-red-400",
    border: "border-red-200/50 dark:border-red-700/30",
  },
  info: {
    bg: "bg-linear-to-br from-blue-50/70 to-indigo-100/50 dark:from-blue-950/30 dark:to-indigo-900/20",
    icon: "bg-blue-100/70 dark:bg-blue-900/40",
    iconColor: "text-blue-600 dark:text-blue-400",
    border: "border-blue-200/50 dark:border-blue-700/30",
  },
}

const getTrendIcon = (trendValue: number) => {
  if (trendValue > 0) return TrendingUp
  if (trendValue < 0) return TrendingDown
  return Minus
}

const getTrendColor = (trendValue: number) => {
  if (trendValue > 0) return "text-emerald-600 dark:text-emerald-400"
  if (trendValue < 0) return "text-red-600 dark:text-red-400"
  return "text-slate-500 dark:text-slate-400"
}

export default function StatsCard({
  title,
  value,
  icon: Icon,
  trend,
  isLoading = false,
  variant = "default",
  className,
  href,
}: StatsCardProps) {
  const styles = variantStyles[variant]
  const TrendIcon = trend ? getTrendIcon(trend.value) : null
  const trendColor = trend ? getTrendColor(trend.value) : ""

  if (isLoading) {
    return (
      <Card className={cn("overflow-hidden border-0 shadow-sm", className)}>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <Skeleton className="h-4 w-28" />
          <Skeleton className="size-11 rounded-lg" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-7 w-32 mb-2" />
          {trend && <Skeleton className="h-4 w-20" />}
        </CardContent>
      </Card>
    )
  }

  const card = (
    <Card
      className={cn(
        "overflow-hidden border shadow-sm hover:shadow-md transition-all duration-200",
        styles.bg,
        styles.border,
        href && "cursor-pointer",
        className,
      )}
    >
      <CardHeader className="flex flex-row items-center justify-between space-y-0 ">
        <div className="space-y-0.5">
          <p className="text-sm font-medium text-muted-foreground/90">
            {title}
          </p>
        </div>
        <div className={cn("p-2.5 rounded-lg shadow-sm/50", styles.icon)}>
          <Icon className={cn("size-5", styles.iconColor)} />
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          <div className="text-2xl font-semibold text-foreground">
            {typeof value === "string"
              ? value
              : typeof value === "number"
                ? value.toLocaleString()
                : value}
          </div>
          {trend && (
            <div className="flex items-center space-x-2">
              {TrendIcon && <TrendIcon className={cn("size-4", trendColor)} />}
              <span className={cn("text-sm font-medium", trendColor)}>
                {trend.value > 0 ? "+" : ""}
                {trend.value}%
              </span>
              <span className="text-xs text-muted-foreground">
                {trend.label}
              </span>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )

  if (href) {
    return (
      <Link
        href={href}
        className="block no-underline"
      >
        {card}
      </Link>
    )
  }

  return card
}
