"use client"

import { CalendarEvent } from "@/lib/queries/calendar/useCalendarEvents"
import { cn } from "@/lib/utils/helpers"
import {
  AlertTriangle,
  Briefcase,
  Brush,
  Building,
  Cake,
  Calendar,
  CalendarDays,
  CheckCircle,
  GraduationCap,
  Package,
  Plane,
  Store,
  Thermometer,
  Timer,
  Wrench,
  XCircle,
} from "lucide-react"

interface EventIconProps {
  event: CalendarEvent
  size?: "xs" | "sm" | "md" | "lg"
  className?: string
}

const sizeClasses = {
  xs: "size-2.5",
  sm: "size-3",
  md: "size-4",
  lg: "size-5",
}

export function EventIcon({ event, size = "sm", className }: EventIconProps) {
  const { type, leave_type } = event.extendedProps
  const baseClasses = cn(sizeClasses[size], "shrink-0", className)

  // If event has a specific icon component, use it
  if (event.extendedProps.iconComponent) {
    const IconComponent = event.extendedProps.iconComponent
    return <IconComponent className={baseClasses} />
  }

  switch (type) {
    case "attendance": {
      const status =
        event.extendedProps.status || event.extendedProps.attendance_status
      switch (status) {
        case "present":
          return (
            <CheckCircle
              className={cn(baseClasses, "text-green-600 dark:text-green-400")}
            />
          )
        case "late":
          return (
            <AlertTriangle
              className={cn(
                baseClasses,
                "text-yellow-600 dark:text-yellow-400",
              )}
            />
          )
        case "absent":
          return (
            <XCircle
              className={cn(baseClasses, "text-red-600 dark:text-red-400")}
            />
          )
        case "leave":
          if (leave_type === "SICK") {
            return (
              <Thermometer
                className={cn(baseClasses, "text-blue-600 dark:text-blue-400")}
              />
            )
          } else {
            return (
              <AlertTriangle
                className={cn(
                  baseClasses,
                  "text-orange-600 dark:text-orange-400",
                )}
              />
            )
          }
        default:
          return (
            <CheckCircle
              className={cn(baseClasses, "text-blue-600 dark:text-blue-400")}
            />
          )
      }
    }
    case "birthday":
      return (
        <Cake
          className={cn(baseClasses, "text-green-600 dark:text-green-400")}
        />
      )
    case "holiday": {
      const isRegular = event.extendedProps.holiday_type === "regular"
      return isRegular ? (
        <Building
          className={cn(baseClasses, "text-red-600 dark:text-red-400")}
        />
      ) : (
        <CalendarDays
          className={cn(baseClasses, "text-orange-600 dark:text-orange-400")}
        />
      )
    }
    case "leave": {
      const leaveType = event.extendedProps.leave_type
      switch (leaveType) {
        case "SICK":
          return (
            <Thermometer
              className={cn(
                baseClasses,
                "text-purple-600 dark:text-purple-400",
              )}
            />
          )
        case "EMERGENCY":
          return (
            <AlertTriangle
              className={cn(baseClasses, "text-amber-600 dark:text-amber-400")}
            />
          )
        default:
          return (
            <Plane
              className={cn(
                baseClasses,
                "text-indigo-600 dark:text-indigo-400",
              )}
            />
          )
      }
    }
    case "schedule": {
      const serviceType = event.extendedProps.service_type
      if (serviceType === "cleaning") {
        return (
          <Brush
            className={cn(baseClasses, "text-cyan-600 dark:text-cyan-400")}
          />
        )
      } else if (serviceType === "on_site") {
        return (
          <Wrench
            className={cn(baseClasses, "text-cyan-600 dark:text-cyan-400")}
          />
        )
      } else {
        return (
          <Store
            className={cn(baseClasses, "text-cyan-600 dark:text-cyan-400")}
          />
        )
      }
    }
    case "delivery":
      return (
        <Package
          className={cn(baseClasses, "text-teal-600 dark:text-teal-400")}
        />
      )
    case "custom_event": {
      const eventType = event.extendedProps.event_type
      switch (eventType) {
        case "meeting":
          return (
            <Briefcase
              className={cn(baseClasses, "text-blue-600 dark:text-blue-400")}
            />
          )
        case "maintenance":
          return (
            <Wrench
              className={cn(
                baseClasses,
                "text-yellow-600 dark:text-yellow-400",
              )}
            />
          )
        case "training":
          return (
            <GraduationCap
              className={cn(
                baseClasses,
                "text-purple-600 dark:text-purple-400",
              )}
            />
          )
        case "deadline":
          return (
            <Timer
              className={cn(
                baseClasses,
                "text-orange-600 dark:text-orange-400",
              )}
            />
          )
        case "other":
        default:
          return (
            <Calendar
              className={cn(baseClasses, "text-gray-600 dark:text-gray-400")}
            />
          )
      }
    }
    default:
      return null
  }
}
