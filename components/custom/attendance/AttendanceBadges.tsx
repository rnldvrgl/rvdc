"use client"

import { Badge } from "@/components/ui/badge"
import { AttendanceStatus, AttendanceType } from "@/lib/constants/types"
import { cn, formatMinutesToHours } from "@/lib/utils/helpers"
import {
  AlertCircle,
  AlertTriangle,
  CheckCircle,
  Clock,
  XCircle,
} from "lucide-react"

type AttendanceStatusBadgeProps = {
  status: AttendanceStatus
  className?: string
  showIcon?: boolean
}

export function AttendanceStatusBadge({
  status,
  className,
  showIcon = true,
}: AttendanceStatusBadgeProps) {
  const config = {
    PENDING: {
      icon: AlertCircle,
      className:
        "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200",
      label: "Pending",
    },
    APPROVED: {
      icon: CheckCircle,
      className:
        "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
      label: "Approved",
    },
    REJECTED: {
      icon: XCircle,
      className: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200",
      label: "Rejected",
    },
    NONE: {
      icon: Clock,
      className:
        "bg-slate-100 text-slate-800 dark:bg-slate-900 dark:text-slate-200",
      label: "No Status",
    },
  }

  const { icon: Icon, className: statusClassName, label } = config[status]

  return (
    <Badge
      className={cn(statusClassName, className)}
      variant="outline"
    >
      {showIcon && <Icon className="mr-1 h-3 w-3" />}
      {label}
    </Badge>
  )
}

type AttendanceTypeBadgeProps = {
  type: AttendanceType
  className?: string
  showIcon?: boolean
}

export function AttendanceTypeBadge({
  type,
  className,
  showIcon = true,
}: AttendanceTypeBadgeProps) {
  const config: Record<
    AttendanceType,
    { icon: typeof Clock; className: string; label: string }
  > = {
    FULL_DAY: {
      icon: Clock,
      className:
        "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
      label: "Full Day",
    },
    HALF_DAY: {
      icon: Clock,
      className:
        "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200",
      label: "Half Day",
    },
    PARTIAL: {
      icon: AlertCircle,
      className:
        "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200",
      label: "Partial",
    },
    ABSENT: {
      icon: XCircle,
      className: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200",
      label: "Absent",
    },
    LEAVE: {
      icon: AlertCircle,
      className:
        "bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-200",
      label: "On Leave",
    },
    PENDING: {
      icon: AlertCircle,
      className:
        "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200",
      label: "Pending",
    },
    INVALID: {
      icon: AlertCircle,
      className: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200",
      label: "Invalid",
    },
  }

  const { icon: Icon, className: typeClassName, label } = config[type]

  return (
    <Badge
      className={cn(typeClassName, className)}
      variant="outline"
    >
      {showIcon && <Icon className="mr-1 h-3 w-3" />}
      {label}
    </Badge>
  )
}
type LateBadgeProps = {
  isLate: boolean
  lateMinutes?: number
  className?: string
}

export function LateBadge({
  isLate,
  lateMinutes = 0,
  className,
}: LateBadgeProps) {
  if (!isLate || lateMinutes === 0) {
    return null
  }

  return (
    <Badge
      className={cn(
        "bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200",
        className,
      )}
      variant="outline"
    >
      <AlertTriangle className="mr-1 h-3 w-3" />
      Late {formatMinutesToHours(lateMinutes)}
    </Badge>
  )
}

type AutoCloseWarningBadgeProps = {
  autoCloseWarningCount: number
  showIfZero?: boolean
  className?: string
  size?: "sm" | "md" | "lg"
}

export function AutoCloseWarningBadge({
  autoCloseWarningCount,
  showIfZero = false,
  className,
  size = "md",
}: AutoCloseWarningBadgeProps) {
  if (!showIfZero && autoCloseWarningCount === 0) {
    return null
  }

  const sizeClasses = {
    sm: "text-xs px-2 py-0.5",
    md: "text-sm px-3 py-1",
    lg: "text-base px-4 py-2 font-semibold",
  }

  return (
    <Badge
      className={cn(
        "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200 border-yellow-200 dark:border-yellow-800",
        sizeClasses[size],
        className,
      )}
      variant="outline"
    >
      <AlertTriangle className="mr-1.5 h-4 w-4" />
      {autoCloseWarningCount} Auto-Close Warning
      {autoCloseWarningCount !== 1 ? "s" : ""}
    </Badge>
  )
}

type AwolBadgeProps = {
  isAwol: boolean
  consecutiveAbsences?: number
  className?: string
}

export function AwolBadge({
  isAwol,
  consecutiveAbsences = 0,
  className,
}: AwolBadgeProps) {
  if (!isAwol) {
    return null
  }

  return (
    <Badge
      className={cn(
        "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200 border-red-300 dark:border-red-700 font-semibold",
        className,
      )}
      variant="outline"
    >
      <XCircle className="mr-1 h-3 w-3" />
      AWOL ({consecutiveAbsences} days)
    </Badge>
  )
}
