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

const tone = {
    success: "bg-success/15 text-success dark:bg-success/20",
    destructive: "bg-destructive/15 text-destructive dark:bg-destructive/20",
    warning: "bg-warning/15 text-warning dark:bg-warning/20",
    info: "bg-info/15 text-info dark:bg-info/20",
    muted: "bg-muted text-muted-foreground",
    primary: "bg-primary/15 text-primary dark:text-primary/80",
} as const

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
            className: tone.warning,
            label: "Pending",
        },
        APPROVED: {
            icon: CheckCircle,
            className: tone.success,
            label: "Approved",
        },
        REJECTED: {
            icon: XCircle,
            className: tone.destructive,
            label: "Rejected",
        },
        NONE: {
            icon: Clock,
            className: tone.muted,
            label: "No Status",
        },
    }

    const { icon: Icon, className: statusClassName, label } = config[status]

    return (
        <Badge
            className={cn("border-transparent font-medium", statusClassName, className)}
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
            className: tone.info,
            label: "Full Day",
        },
        HALF_DAY: {
            icon: Clock,
            className: tone.primary,
            label: "Half Day",
        },
        PARTIAL: {
            icon: AlertCircle,
            className: tone.warning,
            label: "Partial",
        },
        ABSENT: {
            icon: XCircle,
            className: tone.destructive,
            label: "Absent",
        },
        LEAVE: {
            icon: AlertCircle,
            className: tone.primary,
            label: "On Leave",
        },
        SHOP_CLOSED: {
            icon: AlertCircle,
            className: tone.muted,
            label: "Shop Closed",
        },
        PENDING: {
            icon: AlertCircle,
            className: tone.warning,
            label: "Pending",
        },
        INVALID: {
            icon: AlertCircle,
            className: tone.destructive,
            label: "Invalid",
        },
    }

    const { icon: Icon, className: typeClassName, label } = config[type]

    return (
        <Badge
            className={cn("border-transparent font-medium", typeClassName, className)}
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
            className={cn("border-transparent font-medium", tone.warning, className)}
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
                "border-transparent font-medium",
                tone.warning,
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
            className={cn("border-transparent font-semibold", tone.destructive, className)}
            variant="outline"
        >
            <XCircle className="mr-1 h-3 w-3" />
            AWOL ({consecutiveAbsences} days)
        </Badge>
    )
}
