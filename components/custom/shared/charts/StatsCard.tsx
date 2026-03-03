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
    bg: "bg-gradient-to-br from-slate-50/90 to-slate-100/70 dark:from-slate-900/60 dark:to-slate-800/40",
    icon: "bg-gradient-to-br from-slate-100 to-slate-200/80 dark:from-slate-800 dark:to-slate-700/60",
    iconColor: "text-slate-700 dark:text-slate-300",
    border: "border-slate-200/80 dark:border-slate-700/50",
    glow: "hover:shadow-slate-200/50 dark:hover:shadow-slate-800/30",
  },
  success: {
    bg: "bg-gradient-to-br from-emerald-50/80 to-emerald-100/60 dark:from-emerald-950/40 dark:to-emerald-900/30",
    icon: "bg-gradient-to-br from-emerald-100 to-emerald-200/80 dark:from-emerald-900 dark:to-emerald-800/60",
    iconColor: "text-emerald-700 dark:text-emerald-300",
    border: "border-emerald-200/70 dark:border-emerald-700/40",
    glow: "hover:shadow-emerald-200/50 dark:hover:shadow-emerald-800/30",
  },
  warning: {
    bg: "bg-gradient-to-br from-amber-50/80 to-orange-100/60 dark:from-amber-950/40 dark:to-orange-900/30",
    icon: "bg-gradient-to-br from-amber-100 to-amber-200/80 dark:from-amber-900 dark:to-amber-800/60",
    iconColor: "text-amber-700 dark:text-amber-300",
    border: "border-amber-200/70 dark:border-amber-700/40",
    glow: "hover:shadow-amber-200/50 dark:hover:shadow-amber-800/30",
  },
  danger: {
    bg: "bg-gradient-to-br from-red-50/80 to-rose-100/60 dark:from-red-950/40 dark:to-rose-900/30",
    icon: "bg-gradient-to-br from-red-100 to-red-200/80 dark:from-red-900 dark:to-red-800/60",
    iconColor: "text-red-700 dark:text-red-300",
    border: "border-red-200/70 dark:border-red-700/40",
    glow: "hover:shadow-red-200/50 dark:hover:shadow-red-800/30",
  },
  info: {
    bg: "bg-gradient-to-br from-blue-50/80 to-indigo-100/60 dark:from-blue-950/40 dark:to-indigo-900/30",
    icon: "bg-gradient-to-br from-blue-100 to-blue-200/80 dark:from-blue-900 dark:to-blue-800/60",
    iconColor: "text-blue-700 dark:text-blue-300",
    border: "border-blue-200/70 dark:border-blue-700/40",
    glow: "hover:shadow-blue-200/50 dark:hover:shadow-blue-800/30",
  },
}

const getTrendIcon = (trendValue: number) => {
  if (trendValue > 0) return TrendingUp
  if (trendValue < 0) return TrendingDown
  return Minus
}

const getTrendColor = (trendValue: number) => {
  if (trendValue > 0)
    return "text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/50"
  if (trendValue < 0)
    return "text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950/50"
  return "text-slate-500 dark:text-slate-400 bg-slate-50 dark:bg-slate-950/50"
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
      <Card className={cn("overflow-hidden border shadow-sm", className)}>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
          <Skeleton className="h-4 w-32" />
          <Skeleton className="size-12 rounded-xl" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-8 w-36 mb-3" />
          <Skeleton className="h-4 w-24" />
        </CardContent>
      </Card>
    )
  }

  const card = (
    <Card
      className={cn(
        "group overflow-hidden border shadow-sm hover:shadow-lg transition-all duration-300",
        styles.bg,
        styles.border,
        styles.glow,
        href && "cursor-pointer hover:-translate-y-0.5",
        className,
      )}
    >
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
        <div className="space-y-1">
          <p className="text-sm font-medium text-muted-foreground">{title}</p>
        </div>
        <div
          className={cn(
            "p-3 rounded-xl shadow-sm transition-transform duration-300 group-hover:scale-110",
            styles.icon,
          )}
        >
          <Icon className={cn("size-5", styles.iconColor)} />
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="text-3xl font-bold tracking-tight text-foreground">
          {typeof value === "string"
            ? value
            : typeof value === "number"
              ? value.toLocaleString()
              : value}
        </div>
        {trend && (
          <div
            className={cn(
              "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium",
              trendColor,
            )}
          >
            {TrendIcon && <TrendIcon className="size-3.5" />}
            <span>
              {trend.value > 0 ? "+" : ""}
              {trend.value}%
            </span>
            <span className="opacity-70">{trend.label}</span>
          </div>
        )}
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
