import { AlertTriangle, CheckCircle, Clock, Users, XCircle } from "lucide-react"

export const STAT_CARD_CONFIGS = [
  {
    key: "total",
    title: "Total",
    icon: Users,
    iconBgColor: "bg-blue-50 dark:bg-blue-950",
    iconColor: "text-blue-600 dark:text-blue-400",
    valueColor: "text-blue-600 dark:text-blue-400",
    getSubtitle: () => "Records this month",
  },
  {
    key: "approved",
    title: "Approved",
    icon: CheckCircle,
    iconBgColor: "bg-green-50 dark:bg-green-950",
    iconColor: "text-green-600 dark:text-green-400",
    valueColor: "text-green-600 dark:text-green-400",
    getSubtitle: (value: number, total: number) =>
      total > 0
        ? `${Math.round((value / total) * 100)}% of total`
        : "0% of total",
  },
  {
    key: "pending",
    title: "Pending",
    icon: AlertTriangle,
    iconBgColor: "bg-amber-50 dark:bg-amber-950",
    iconColor: "text-amber-600 dark:text-amber-400",
    valueColor: "text-amber-600 dark:text-amber-400",
    getSubtitle: () => "Awaiting review",
  },
  {
    key: "rejected",
    title: "Rejected",
    icon: XCircle,
    iconBgColor: "bg-red-50 dark:bg-red-950",
    iconColor: "text-red-600 dark:text-red-400",
    valueColor: "text-red-600 dark:text-red-400",
    getSubtitle: () => "Needs attention",
  },
] as const

export const GRADIENT_CARD_CONFIGS = [
  {
    key: "present",
    title: "Present",
    subtitle: "On-time arrivals",
    icon: CheckCircle,
    gradientFrom: "from-emerald-50",
    gradientTo: "to-teal-50 dark:from-emerald-950/20 dark:to-teal-950/20",
    borderColor: "border-emerald-200 dark:border-emerald-800",
    iconBgColor: "bg-emerald-100 dark:bg-emerald-900/30",
    iconColor: "text-emerald-600 dark:text-emerald-400",
    titleColor: "text-emerald-700 dark:text-emerald-300",
    valueColor: "text-emerald-900 dark:text-emerald-100",
    subtitleColor: "text-emerald-600/70 dark:text-emerald-400/70",
  },
  {
    key: "absent",
    title: "Absent",
    subtitle: "absences",
    icon: AlertTriangle,
    gradientFrom: "from-rose-50",
    gradientTo: "to-pink-50 dark:from-rose-950/20 dark:to-pink-950/20",
    borderColor: "border-rose-200 dark:border-rose-800",
    iconBgColor: "bg-rose-100 dark:bg-rose-900/30",
    iconColor: "text-rose-600 dark:text-rose-400",
    titleColor: "text-rose-700 dark:text-rose-300",
    valueColor: "text-rose-900 dark:text-rose-100",
    subtitleColor: "text-rose-600/70 dark:text-rose-400/70",
  },
  {
    key: "late",
    title: "Late",
    subtitle: "late arrivals",
    icon: Clock,
    gradientFrom: "from-amber-50",
    gradientTo: "to-yellow-50 dark:from-amber-950/20 dark:to-yellow-950/20",
    borderColor: "border-amber-200 dark:border-amber-800",
    iconBgColor: "bg-amber-100 dark:bg-amber-900/30",
    iconColor: "text-amber-600 dark:text-amber-400",
    titleColor: "text-amber-700 dark:text-amber-300",
    valueColor: "text-amber-900 dark:text-amber-100",
    subtitleColor: "text-amber-600/70 dark:text-amber-400/70",
  },
] as const
