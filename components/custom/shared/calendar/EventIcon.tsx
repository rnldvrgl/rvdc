"use client"

import { CalendarEvent } from "@/lib/queries/calendar/useCalendarEvents"
import { cn } from "@/lib/utils/helpers"
import {
    AlertTriangle, Briefcase, Brush, Building, Cake, Calendar,
    CalendarDays, CheckCircle, Clock4, GraduationCap, Package,
    Plane, Store, Thermometer, Timer, Wrench, XCircle, type LucideIcon,
} from "lucide-react"

interface EventIconProps {
    event: CalendarEvent
    size?: "xs" | "sm" | "md" | "lg"
    className?: string
    forceColorClassName?: string
}

const sizeClasses = {
    xs: "size-2.5",
    sm: "size-3",
    md: "size-4",
    lg: "size-5",
}

type IconDef = { Icon: LucideIcon; colorClass: string }

function resolveIcon(event: CalendarEvent): IconDef | null {
    const { type, leave_type } = event.extendedProps

    switch (type) {
        case "attendance": {
            const status = event.extendedProps.status || event.extendedProps.attendance_status
            switch (status) {
                case "present": return { Icon: CheckCircle, colorClass: "text-success" }
                case "late": return { Icon: AlertTriangle, colorClass: "text-warning" }
                case "absent": return { Icon: XCircle, colorClass: "text-destructive" }
                case "leave":
                    return leave_type === "SICK"
                        ? { Icon: Thermometer, colorClass: "text-blue-600 dark:text-blue-400" }
                        : { Icon: AlertTriangle, colorClass: "text-orange-600 dark:text-orange-400" }
                default: return { Icon: CheckCircle, colorClass: "text-blue-600 dark:text-blue-400" }
            }
        }
        case "birthday":
            return { Icon: Cake, colorClass: "text-success" }
        case "holiday":
            return event.extendedProps.holiday_type === "regular"
                ? { Icon: Building, colorClass: "text-destructive" }
                : { Icon: CalendarDays, colorClass: "text-orange-600 dark:text-orange-400" }
        case "leave": {
            switch (event.extendedProps.leave_type) {
                case "SICK": return { Icon: Thermometer, colorClass: "text-purple-600 dark:text-purple-400" }
                case "EMERGENCY": return { Icon: AlertTriangle, colorClass: "text-warning" }
                default: return { Icon: Plane, colorClass: "text-indigo-600 dark:text-indigo-400" }
            }
        }
        case "schedule": {
            const serviceType = event.extendedProps.service_type
            const Icon = serviceType === "cleaning" ? Brush : serviceType === "on_site" ? Wrench : Store
            return { Icon, colorClass: "text-cyan-600 dark:text-cyan-400" }
        }
        case "delivery":
            return { Icon: Package, colorClass: "text-teal-600 dark:text-teal-400" }
        case "custom_event": {
            switch (event.extendedProps.event_type) {
                case "meeting": return { Icon: Briefcase, colorClass: "text-blue-600 dark:text-blue-400" }
                case "maintenance": return { Icon: Wrench, colorClass: "text-warning" }
                case "training": return { Icon: GraduationCap, colorClass: "text-purple-600 dark:text-purple-400" }
                case "deadline": return { Icon: Timer, colorClass: "text-orange-600 dark:text-orange-400" }
                default: return { Icon: Calendar, colorClass: "text-gray-600 dark:text-gray-400" }
            }
        }
        case "half_day":
            return { Icon: Clock4, colorClass: "text-orange-600 dark:text-orange-400" }
        case "shop_closed":
            return { Icon: Store, colorClass: "text-destructive" }
        default:
            return null
    }
}

export function EventIcon({ event, size = "sm", className, forceColorClassName }: EventIconProps) {
    if (event.extendedProps.iconComponent) {
        const IconComponent = event.extendedProps.iconComponent
        return <IconComponent className={cn(sizeClasses[size], "shrink-0", forceColorClassName, className)} />
    }

    const def = resolveIcon(event)
    if (!def) return null

    const { Icon } = def
    return (
        <Icon className={cn(sizeClasses[size], "shrink-0", forceColorClassName ?? def.colorClass, className)} />
    )
}
