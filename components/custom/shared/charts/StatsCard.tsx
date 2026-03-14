"use client"

import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { cn } from "@/lib/utils/helpers"
import { motion } from "framer-motion"
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
    bg: "bg-card",
    icon: "bg-secondary",
    iconColor: "text-foreground",
    border: "border-border",
    glow: "",
  },
  success: {
    bg: "bg-card",
    icon: "bg-primary/10 dark:bg-primary/20",
    iconColor: "text-primary",
    border: "border-border",
    glow: "",
  },
  warning: {
    bg: "bg-card",
    icon: "bg-accent",
    iconColor: "text-accent-foreground",
    border: "border-border",
    glow: "",
  },
  danger: {
    bg: "bg-card",
    icon: "bg-destructive/10 dark:bg-destructive/20",
    iconColor: "text-destructive",
    border: "border-border",
    glow: "",
  },
  info: {
    bg: "bg-card",
    icon: "bg-primary/10 dark:bg-primary/20",
    iconColor: "text-primary",
    border: "border-border",
    glow: "",
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
    <motion.div whileHover={{ y: -2, transition: { duration: 0.2 } }}>
      <Card
        className={cn(
          "group overflow-hidden border shadow-sm hover:shadow-lg transition-shadow duration-300",
          styles.bg,
          styles.border,
          styles.glow,
          href && "cursor-pointer",
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
          <motion.div
            className="text-3xl font-bold tracking-tight text-foreground"
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, ease: "easeOut" }}
            key={String(value)}
          >
            {typeof value === "string"
              ? value
              : typeof value === "number"
                ? value.toLocaleString()
                : value}
          </motion.div>
          {trend && (
            <motion.div
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.3, delay: 0.15 }}
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
            </motion.div>
          )}
        </CardContent>
      </Card>
    </motion.div>
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
