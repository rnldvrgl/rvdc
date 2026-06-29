"use client"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import {
    addDays,
    addMonths,
    addWeeks,
    eachDayOfInterval,
    endOfMonth,
    endOfWeek,
    format,
    isSameMonth,
    isToday,
    startOfMonth,
    startOfWeek,
    subDays,
    subMonths,
    subWeeks,
} from "date-fns"
import {
    Calendar,
    ChevronLeft,
    ChevronRight,
    Clock,
    FileText,
    Plane,
    User,
} from "lucide-react"
import { useEffect, useMemo, useState } from "react"

import { Skeleton } from "@/components/ui/skeleton"
import { useIsMobile } from "@/lib/hooks"
import { useCalendarPreferences } from "@/lib/hooks/useCalendarPreferences"
import {
    CalendarEvent,
    useCalendarEvents,
} from "@/lib/queries/calendar/useCalendarEvents"
import { cn, formatDateToYMD } from "@/lib/utils/helpers"
import { CalendarEventItem } from "./CalendarEventItem"
import CalendarSettings from "./CalendarSettings"
import { DayViewEventItem } from "./DayViewEventItem"
import { EventIcon } from "./EventIcon"

// ============================================================================
// TYPES & CONSTANTS
// ============================================================================

type CalendarView = "month" | "week" | "day"

type AttendanceStatus = "present" | "late" | "absent" | "leave" | "invalid"

type EventType =
    | "birthday"
    | "holiday"
    | "attendance"
    | "leave"
    | "schedule"
    | "service"
    | "half_day"
    | "shop_closed"
    | "custom_event"
interface EventColors {
    bg: string
    border: string
    text: string
    lightBg?: string
    hoverBg?: string
}

interface AttendanceRecord {
    id: string
    employeeName: string
    date: string
    status: AttendanceStatus
    checkIn?: string
    checkOut?: string
    hours: number
}

interface DashboardCalendarProps {
    className?: string
    mode?: "default" | "attendance"
    attendanceData?: AttendanceRecord[]
    useCustomData?: boolean
    title?: string
    description?: string
    height?: string
    weekStartsOn?: 0 | 1
    onEventClick?: (event: CalendarEvent) => void
    onDateClick?: (date: Date) => void
    withSettings?: boolean
    withRefresh?: boolean
    eventTypes?: EventType[]
}

// ============================================================================
// COLOR THEME CONFIGURATION
// ============================================================================

const EVENT_COLORS: Record<string, EventColors> = {
    // Attendance statuses
    present: {
        bg: "var(--success)",
        border: "var(--success)",
        text: "var(--success-foreground)",
        lightBg: "bg-success/10 dark:bg-success/15",
        hoverBg: "hover:bg-success/15 dark:hover:bg-success/20",
    },
    late: {
        bg: "var(--warning)",
        border: "var(--warning)",
        text: "var(--warning-foreground)",
        lightBg: "bg-warning/10 dark:bg-warning/15",
        hoverBg: "hover:bg-warning/15 dark:hover:bg-warning/20",
    },
    absent: {
        bg: "var(--destructive)",
        border: "var(--destructive)",
        text: "var(--destructive-foreground)",
        lightBg: "bg-destructive/10 dark:bg-destructive/15",
        hoverBg: "hover:bg-destructive/15 dark:hover:bg-destructive/20",
    },
    leave: {
        bg: "var(--chart-5)",
        border: "var(--chart-5)",
        text: "var(--primary-foreground)",
        lightBg: "bg-primary/10 dark:bg-primary/15",
        hoverBg: "hover:bg-primary/15 dark:hover:bg-primary/20",
    },
    invalid: {
        bg: "var(--muted-foreground)",
        border: "var(--muted-foreground)",
        text: "var(--background)",
        lightBg: "bg-muted/60",
        hoverBg: "hover:bg-muted/80",
    },

    // Event types
    birthday: {
        bg: "var(--success)",
        border: "var(--success)",
        text: "var(--success-foreground)",
    },
    regularHoliday: {
        bg: "var(--destructive)",
        border: "var(--destructive)",
        text: "var(--destructive-foreground)",
    },
    specialHoliday: {
        bg: "var(--warning)",
        border: "var(--warning)",
        text: "var(--warning-foreground)",
    },
    sickLeave: {
        bg: "var(--chart-5)",
        border: "var(--chart-5)",
        text: "var(--primary-foreground)",
    },
    emergencyLeave: {
        bg: "var(--warning)",
        border: "var(--warning)",
        text: "var(--warning-foreground)",
    },
    schedule: {
        bg: "var(--info)",
        border: "var(--info)",
        text: "var(--info-foreground)",
    },
    // Custom calendar event types - distinguished colors
    meeting: {
        bg: "var(--chart-1)",
        border: "var(--chart-1)",
        text: "var(--primary-foreground)",
    },
    maintenance: {
        bg: "var(--warning)",
        border: "var(--warning)",
        text: "var(--warning-foreground)",
    },
    training: {
        bg: "var(--chart-5)",
        border: "var(--chart-5)",
        text: "var(--primary-foreground)",
    },
    deadline: {
        bg: "var(--destructive)",
        border: "var(--destructive)",
        text: "var(--destructive-foreground)",
    },
    other: {
        bg: "var(--muted-foreground)",
        border: "var(--muted-foreground)",
        text: "var(--background)",
    },
    // Delivery schedule
    delivery: {
        bg: "var(--success)",
        border: "var(--success)",
        text: "var(--success-foreground)",
    },
    // Half-day schedule
    halfDay: {
        bg: "var(--warning)",
        border: "var(--warning)",
        text: "var(--warning-foreground)",
    },
    // Shop closed
    shopClosed: {
        bg: "var(--destructive)",
        border: "var(--destructive)",
        text: "var(--destructive-foreground)",
    },
    default: {
        bg: "var(--muted-foreground)",
        border: "var(--muted-foreground)",
        text: "var(--background)",
    },
}

const LEGEND_ITEMS = [
    { type: "birthday", label: "Birthdays", color: EVENT_COLORS.birthday.bg },
    {
        type: "holiday",
        label: "Regular Holidays",
        color: EVENT_COLORS.regularHoliday.bg,
    },
    {
        type: "holiday",
        label: "Special Holidays",
        color: EVENT_COLORS.specialHoliday.bg,
    },
    { type: "schedule", label: "Schedules", color: EVENT_COLORS.schedule.bg },
    { type: "leave", label: "Sick Leave", color: EVENT_COLORS.sickLeave.bg },
    {
        type: "leave",
        label: "Emergency Leave",
        color: EVENT_COLORS.emergencyLeave.bg,
    },
    { type: "custom_event", label: "Meetings", color: EVENT_COLORS.meeting.bg },
    {
        type: "custom_event",
        label: "Maintenance",
        color: EVENT_COLORS.maintenance.bg,
    },
    { type: "custom_event", label: "Training", color: EVENT_COLORS.training.bg },
    { type: "custom_event", label: "Deadlines", color: EVENT_COLORS.deadline.bg },
    { type: "half_day", label: "Half Days", color: EVENT_COLORS.halfDay.bg },
    {
        type: "shop_closed",
        label: "Shop Closed",
        color: EVENT_COLORS.shopClosed.bg,
    },
] as const

const COLOR_CLASS_MAP: Record<string, string> = {
    "var(--success)": "bg-[var(--success)]",
    "var(--warning)": "bg-[var(--warning)]",
    "var(--destructive)": "bg-[var(--destructive)]",
    "var(--chart-5)": "bg-[var(--chart-5)]",
    "var(--muted-foreground)": "bg-[var(--muted-foreground)]",
    "var(--info)": "bg-[var(--info)]",
    "var(--chart-1)": "bg-[var(--chart-1)]",
}

function getColorClass(color?: string) {
    if (!color) return "bg-muted"
    return COLOR_CLASS_MAP[color] ?? "bg-muted"
}

const ATTENDANCE_LEGEND_ITEMS: Array<{
    value: AttendanceStatus
    label: string
}> = [
        { value: "present", label: "Present" },
        { value: "late", label: "Late" },
        { value: "absent", label: "Absent" },
        { value: "leave", label: "Leave" },
        { value: "invalid", label: "Invalid" },
    ]

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

const getEventColors = (event: CalendarEvent): EventColors => {
    const { type } = event.extendedProps

    switch (type) {
        case "attendance": {
            const status =
                event.extendedProps.status || event.extendedProps.attendance_status
            return EVENT_COLORS[status as string] || EVENT_COLORS.default
        }

        case "birthday":
            return EVENT_COLORS.birthday

        case "holiday": {
            const isRegular = event.extendedProps.holiday_type === "regular"
            return isRegular
                ? EVENT_COLORS.regularHoliday
                : EVENT_COLORS.specialHoliday
        }

        case "leave": {
            const leaveType = event.extendedProps.leave_type
            switch (leaveType) {
                case "SICK":
                    return EVENT_COLORS.sickLeave
                case "EMERGENCY":
                    return EVENT_COLORS.emergencyLeave
                default:
                    return EVENT_COLORS.default
            }
        }

        case "schedule":
            return EVENT_COLORS.schedule

        case "delivery":
            return EVENT_COLORS.delivery

        case "half_day":
            return EVENT_COLORS.halfDay

        case "shop_closed":
            return EVENT_COLORS.shopClosed

        case "custom_event": {
            const eventType = event.extendedProps.event_type
            switch (eventType) {
                case "meeting":
                    return EVENT_COLORS.meeting
                case "maintenance":
                    return EVENT_COLORS.maintenance
                case "training":
                    return EVENT_COLORS.training
                case "deadline":
                    return EVENT_COLORS.deadline
                case "other":
                    return EVENT_COLORS.other
                default:
                    return EVENT_COLORS.default
            }
        }

        default:
            return EVENT_COLORS.default
    }
}

// Priority order: higher = wins when multiple employees share a day
const STATUS_PRIORITY: Record<string, number> = {
    present: 4,
    late: 3,
    leave: 2,
    absent: 1,
    invalid: 0,
}

const getDayBackgroundColor = (
    day: Date,
    eventsByDate: Record<string, CalendarEvent[]>,
    mode: "default" | "attendance",
): string => {
    if (mode !== "attendance") return ""

    const dayEvents = eventsByDate[day.toDateString()] || []
    const attendanceEvents = dayEvents.filter(
        (event) => event.extendedProps?.type === "attendance",
    )

    if (attendanceEvents.length === 0) return ""

    // Pick the dominant (highest-priority) status across all employees
    let bestStatus = ""
    let bestPriority = -1

    for (const event of attendanceEvents) {
        const status =
            (event.extendedProps?.status ||
                event.extendedProps?.attendance_status) as string
        const priority = STATUS_PRIORITY[status] ?? 0
        if (priority > bestPriority) {
            bestPriority = priority
            bestStatus = status
        }
    }

    const colors = EVENT_COLORS[bestStatus]
    return colors ? `${colors.lightBg} ${colors.hoverBg}` : ""
}

// ============================================================================
// MODAL COMPONENTS
// ============================================================================

interface EventDetailModalProps {
    event: CalendarEvent | null
    isOpen: boolean
    onClose: () => void
}

const EventDetailModal = ({
    event,
    isOpen,
    onClose,
}: EventDetailModalProps) => {
    if (!event) return null

    const { extendedProps } = event

    const renderEventContent = () => {
        switch (extendedProps.type) {
            case "attendance":
                return (
                    <div className="space-y-4">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                                <EventIcon
                                    event={event}
                                    size="lg"
                                />
                            </div>
                            <div>
                                <h3 className="font-semibold">
                                    {extendedProps.employeeName || extendedProps.employee_name}
                                </h3>
                                <p className="text-sm text-muted-foreground capitalize">
                                    {extendedProps.status || extendedProps.attendance_status}
                                </p>
                            </div>
                        </div>
                        <div className="space-y-2">
                            <div className="flex items-center gap-2 text-sm">
                                <Clock className="w-4 h-4 text-muted-foreground" />
                                <span className="text-muted-foreground">
                                    {event.allDay
                                        ? format(new Date(event.start), "EEEE, MMMM dd, yyyy") +
                                        " (All Day)"
                                        : format(
                                            new Date(event.start),
                                            "EEEE, MMMM dd, yyyy 'at' hh:mm a",
                                        )}
                                </span>
                            </div>
                            {(extendedProps.checkIn || extendedProps.check_in) && (
                                <div className="text-sm">
                                    <span className="font-medium">Check In:</span>{" "}
                                    {extendedProps.checkIn || extendedProps.check_in}
                                </div>
                            )}
                            {(extendedProps.checkOut || extendedProps.check_out) && (
                                <div className="text-sm">
                                    <span className="font-medium">Check Out:</span>{" "}
                                    {extendedProps.checkOut || extendedProps.check_out}
                                </div>
                            )}
                            {extendedProps.hours && extendedProps.hours > 0 && (
                                <div className="text-sm">
                                    <span className="font-medium">Hours:</span>{" "}
                                    {extendedProps.hours}
                                </div>
                            )}
                        </div>
                    </div>
                )

            case "birthday":
                return (
                    <div className="space-y-4">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                                <EventIcon
                                    event={event}
                                    size="lg"
                                />
                            </div>
                            <div>
                                <h3 className="font-semibold">
                                    {extendedProps.user_name}&apos;s Birthday
                                </h3>
                                <p className="text-sm text-muted-foreground">
                                    Employee Birthday
                                </p>
                            </div>
                        </div>
                        <div className="flex items-center gap-2 text-sm">
                            <Clock className="w-4 h-4 text-muted-foreground" />
                            <span className="text-muted-foreground">
                                {format(new Date(event.start), "EEEE, MMMM dd, yyyy")} (All Day)
                            </span>
                        </div>
                    </div>
                )

            case "holiday": {
                const isRegular = extendedProps.holiday_type === "regular"
                return (
                    <div className="space-y-4">
                        <div className="flex items-center gap-3">
                            <div
                                className={cn(
                                    "w-10 h-10 rounded-full flex items-center justify-center",
                                    isRegular
                                        ? "bg-red-100 dark:bg-red-900/30"
                                        : "bg-orange-100 dark:bg-orange-900/30",
                                )}
                            >
                                <EventIcon
                                    event={event}
                                    size="lg"
                                />
                            </div>
                            <div>
                                <h3 className="font-semibold">{event.title}</h3>
                                <Badge variant={isRegular ? "destructive" : "secondary"}>
                                    {isRegular ? "Regular Holiday" : "Special Holiday"}
                                </Badge>
                            </div>
                        </div>
                        <div className="flex items-center gap-2 text-sm">
                            <Clock className="w-4 h-4 text-muted-foreground" />
                            <span className="text-muted-foreground">
                                {format(new Date(event.start), "EEEE, MMMM dd, yyyy")} (All Day)
                            </span>
                        </div>
                    </div>
                )
            }

            case "leave":
                return (
                    <div className="space-y-4">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center">
                                <Plane className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
                            </div>
                            <div>
                                <h3 className="font-semibold">{extendedProps.employee_name}</h3>
                                <Badge variant="secondary">
                                    {extendedProps.leave_type_display}
                                </Badge>
                            </div>
                        </div>
                        <div className="space-y-2">
                            <div className="flex items-center gap-2 text-sm">
                                <Clock className="w-4 h-4 text-muted-foreground" />
                                <span className="text-muted-foreground">
                                    {extendedProps.is_multi_day &&
                                        event.end &&
                                        event.start !== event.end ? (
                                        <>
                                            {format(new Date(event.start), "EEEE, MMMM dd")} -{" "}
                                            {format(new Date(event.end), "EEEE, MMMM dd, yyyy")}
                                        </>
                                    ) : (
                                        format(new Date(event.start), "EEEE, MMMM dd, yyyy")
                                    )}
                                </span>
                            </div>
                            <div className="flex items-center gap-2 text-sm">
                                <span className="font-medium">Duration:</span>{" "}
                                {extendedProps.is_multi_day && extendedProps.days_count
                                    ? `${extendedProps.days_count} Day${parseFloat(extendedProps.days_count) !== 1 ? "s" : ""}`
                                    : extendedProps.is_half_day
                                        ? `Half Day - ${extendedProps.shift_period_display || "Morning"}`
                                        : "Full Day"}
                            </div>
                            {extendedProps.reason && (
                                <div className="text-sm">
                                    <span className="font-medium">Reason:</span>{" "}
                                    {extendedProps.reason}
                                </div>
                            )}
                        </div>
                    </div>
                )

            case "schedule":
                return (
                    <div className="space-y-4">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-cyan-100 dark:bg-cyan-900/30 flex items-center justify-center">
                                <EventIcon
                                    event={event}
                                    size="lg"
                                />
                            </div>
                            <div>
                                <h3 className="font-semibold">
                                    {extendedProps.schedule_type_display ||
                                        extendedProps.schedule_type
                                            ?.replace("_", " ")
                                            .replace(/\b\w/g, (l) => l.toUpperCase())}
                                </h3>
                                <p className="text-sm text-muted-foreground">
                                    Scheduled Service
                                </p>
                            </div>
                        </div>
                        <div className="space-y-2">
                            <div className="flex items-center gap-2 text-sm">
                                <User className="w-4 h-4 text-muted-foreground" />
                                <span>Client: {extendedProps.client_name}</span>
                            </div>
                            {extendedProps.service_type_display && (
                                <div className="flex items-center gap-2 text-sm">
                                    <FileText className="w-4 h-4 text-muted-foreground" />
                                    <span>
                                        Service Type: {extendedProps.service_type_display}
                                    </span>
                                </div>
                            )}
                            <div className="flex items-center gap-2 text-sm">
                                <User className="w-4 h-4 text-muted-foreground" />
                                <span>
                                    Technician/s:{" "}
                                    {extendedProps.technician_names?.join(", ") || "Unassigned"}
                                </span>
                            </div>
                            <div className="flex items-center gap-2 text-sm">
                                <Clock className="w-4 h-4 text-muted-foreground" />
                                <span>
                                    {format(
                                        new Date(event.start),
                                        "EEEE, MMMM dd, yyyy 'at' hh:mm a",
                                    )}
                                </span>
                            </div>
                            {extendedProps.notes && (
                                <div className="flex items-start gap-2 text-sm">
                                    <FileText className="w-4 h-4 mt-0.5 text-muted-foreground" />
                                    <div>
                                        <span className="font-medium">Notes: </span>
                                        <span className="text-muted-foreground">
                                            {extendedProps.notes}
                                        </span>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                )

            case "delivery":
                return (
                    <div className="space-y-4">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-teal-100 dark:bg-teal-900/30 flex items-center justify-center">
                                <EventIcon
                                    event={event}
                                    size="lg"
                                />
                            </div>
                            <div>
                                <h3 className="font-semibold">Delivery</h3>
                                <p className="text-sm text-muted-foreground">
                                    Service Delivery
                                </p>
                            </div>
                        </div>
                        <div className="space-y-2">
                            <div className="flex items-center gap-2 text-sm">
                                <User className="w-4 h-4 text-muted-foreground" />
                                <span>Client: {extendedProps.client_name}</span>
                            </div>
                            {extendedProps.service_type_display && (
                                <div className="flex items-center gap-2 text-sm">
                                    <FileText className="w-4 h-4 text-muted-foreground" />
                                    <span>
                                        Service Type: {extendedProps.service_type_display}
                                    </span>
                                </div>
                            )}
                            {extendedProps.technician_names &&
                                extendedProps.technician_names.length > 0 && (
                                    <div className="flex items-center gap-2 text-sm">
                                        <User className="w-4 h-4 text-muted-foreground" />
                                        <span>
                                            Technician/s: {extendedProps.technician_names.join(", ")}
                                        </span>
                                    </div>
                                )}
                            <div className="flex items-center gap-2 text-sm">
                                <Clock className="w-4 h-4 text-muted-foreground" />
                                <span>
                                    {event.allDay
                                        ? format(new Date(event.start), "EEEE, MMMM dd, yyyy") +
                                        " (All Day)"
                                        : format(
                                            new Date(event.start),
                                            "EEEE, MMMM dd, yyyy 'at' hh:mm a",
                                        )}
                                </span>
                            </div>
                            {extendedProps.notes && (
                                <div className="flex items-start gap-2 text-sm">
                                    <FileText className="w-4 h-4 mt-0.5 text-muted-foreground" />
                                    <div>
                                        <span className="font-medium">Notes: </span>
                                        <span className="text-muted-foreground">
                                            {extendedProps.notes}
                                        </span>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                )

            case "custom_event": {
                const eventTypeLabels: Record<string, string> = {
                    meeting: "Meeting",
                    maintenance: "Maintenance",
                    training: "Training",
                    deadline: "Deadline",
                    other: "Other",
                }
                const eventTypeColors: Record<string, string> = {
                    meeting: "bg-blue-100 dark:bg-blue-900/30",
                    maintenance: "bg-yellow-100 dark:bg-yellow-900/30",
                    training: "bg-purple-100 dark:bg-purple-900/30",
                    deadline: "bg-orange-100 dark:bg-orange-900/30",
                    other: "bg-gray-100 dark:bg-gray-900/30",
                }
                const eventType = extendedProps.event_type || "other"
                return (
                    <div className="space-y-4">
                        <div className="flex items-center gap-3">
                            <div
                                className={cn(
                                    "w-10 h-10 rounded-full flex items-center justify-center",
                                    eventTypeColors[eventType] || eventTypeColors.other,
                                )}
                            >
                                <EventIcon
                                    event={event}
                                    size="lg"
                                />
                            </div>
                            <div>
                                <h3 className="font-semibold">{event.title}</h3>
                                <Badge variant="secondary">
                                    {eventTypeLabels[eventType] || "Other"}
                                </Badge>
                            </div>
                        </div>
                        <div className="space-y-2">
                            <div className="flex items-center gap-2 text-sm">
                                <Clock className="w-4 h-4 text-muted-foreground" />
                                <span className="text-muted-foreground">
                                    {event.allDay
                                        ? format(new Date(event.start), "EEEE, MMMM dd, yyyy") +
                                        " (All Day)"
                                        : format(
                                            new Date(event.start),
                                            "EEEE, MMMM dd, yyyy 'at' hh:mm a",
                                        )}
                                </span>
                            </div>
                            {extendedProps.description && (
                                <div className="text-sm">
                                    <span className="font-medium">Description:</span>{" "}
                                    {extendedProps.description}
                                </div>
                            )}
                            {extendedProps.created_by && (
                                <div className="text-sm">
                                    <span className="font-medium">Created by:</span>{" "}
                                    {extendedProps.created_by}
                                </div>
                            )}
                        </div>
                    </div>
                )
            }

            case "half_day":
                return (
                    <div className="space-y-4">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-orange-100 dark:bg-orange-900/30 flex items-center justify-center">
                                <EventIcon
                                    event={event}
                                    size="lg"
                                />
                            </div>
                            <div>
                                <h3 className="font-semibold">{event.title}</h3>
                                <Badge className="bg-orange-100 text-orange-800 dark:bg-orange-900/50 dark:text-orange-200">
                                    Half Day
                                </Badge>
                            </div>
                        </div>
                        <div className="space-y-2">
                            <div className="flex items-center gap-2 text-sm">
                                <Clock className="w-4 h-4 text-muted-foreground" />
                                <span className="text-muted-foreground">
                                    {format(new Date(event.start), "EEEE, MMMM dd, yyyy")} (All
                                    Day)
                                </span>
                            </div>
                            {extendedProps.reason && (
                                <div className="text-sm">
                                    <span className="font-medium">Reason:</span>{" "}
                                    {extendedProps.reason}
                                </div>
                            )}
                            {extendedProps.created_by && (
                                <div className="text-sm">
                                    <span className="font-medium">Set by:</span>{" "}
                                    {extendedProps.created_by}
                                </div>
                            )}
                        </div>
                    </div>
                )

            case "shop_closed":
                return (
                    <div className="space-y-4">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
                                <EventIcon
                                    event={event}
                                    size="lg"
                                />
                            </div>
                            <div>
                                <h3 className="font-semibold">Shop Closed</h3>
                                <Badge className="bg-red-100 text-destructive dark:bg-red-900/50">
                                    All Day
                                </Badge>
                            </div>
                        </div>
                        <div className="space-y-2">
                            <div className="flex items-center gap-2 text-sm">
                                <Clock className="w-4 h-4 text-muted-foreground" />
                                <span className="text-muted-foreground">
                                    {format(new Date(event.start), "EEEE, MMMM dd, yyyy")}
                                </span>
                            </div>
                            {extendedProps.reason &&
                                extendedProps.reason.toLowerCase() !== "shop closed" && (
                                    <div className="text-sm">
                                        <span className="font-medium">Reason:</span>{" "}
                                        {extendedProps.reason}
                                    </div>
                                )}
                            {extendedProps.created_by && (
                                <div className="text-sm">
                                    <span className="font-medium">Set by:</span>{" "}
                                    {extendedProps.created_by}
                                </div>
                            )}
                        </div>
                    </div>
                )

            default:
                return null
        }
    }

    return (
        <Dialog
            open={isOpen}
            onOpenChange={onClose}
        >
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle>Event Details</DialogTitle>
                </DialogHeader>
                {renderEventContent()}
            </DialogContent>
        </Dialog>
    )
}

interface DayEventsModalProps {
    date: Date
    events: CalendarEvent[]
    isOpen: boolean
    onClose: () => void
    onEventClick: (event: CalendarEvent) => void
}

const DayEventsModal = ({
    date,
    events,
    isOpen,
    onClose,
    onEventClick,
}: DayEventsModalProps) => {
    return (
        <Dialog
            open={isOpen}
            onOpenChange={onClose}
        >
            <DialogContent className="sm:max-w-lg">
                <DialogHeader>
                    <DialogTitle>{format(date, "EEEE, MMMM dd, yyyy")}</DialogTitle>
                    <DialogDescription>
                        {events.length} event{events.length !== 1 ? "s" : ""} on this day
                    </DialogDescription>
                </DialogHeader>
                <div className="space-y-3 max-h-96 overflow-y-auto">
                    {events.map((event, index) => (
                        <button
                            key={index}
                            onClick={() => onEventClick(event)}
                            className="w-full p-3 rounded-lg border hover:bg-muted/50 transition-colors text-left"
                        >
                            <div className="flex items-start gap-3">
                                <div
                                    className={cn(
                                        "size-3 rounded-full mt-1.5 shrink-0",
                                        getColorClass(event.backgroundColor),
                                    )}
                                />
                                <div className="flex-1 min-w-0">
                                    <h4 className="font-medium text-sm">{event.title}</h4>
                                    <p className="text-sm text-muted-foreground mt-1 capitalize">
                                        {event.extendedProps.type === "birthday" &&
                                            "Employee Birthday"}
                                        {event.extendedProps.type === "holiday" &&
                                            `${event.extendedProps.holiday_type === "regular" ? "Regular" : "Special"} Holiday`}
                                        {event.extendedProps.type === "leave" &&
                                            `${event.extendedProps.leave_type_display} Leave${event.extendedProps.is_multi_day &&
                                                event.extendedProps.days_count
                                                ? ` (${event.extendedProps.days_count} Days)`
                                                : event.extendedProps.is_half_day
                                                    ? " (Half Day)"
                                                    : " (Full Day)"
                                            }`}
                                        {event.extendedProps.type === "schedule" &&
                                            `${event.extendedProps.service_type?.replace("_", " ")} - ${event.extendedProps.client_name}`}
                                        {event.extendedProps.type === "delivery" &&
                                            `Service Delivery - ${event.extendedProps.client_name}`}
                                        {event.extendedProps.type === "custom_event" &&
                                            `${event.extendedProps.event_type?.charAt(0).toUpperCase()}${event.extendedProps.event_type?.slice(1)} Event`}
                                        {event.extendedProps.type === "half_day" &&
                                            `Half Day${event.extendedProps.reason ? ` - ${event.extendedProps.reason}` : ""}`}
                                        {event.extendedProps.type === "shop_closed" &&
                                            `Shop Closed${event.extendedProps.reason && event.extendedProps.reason.toLowerCase() !== "shop closed" ? ` - ${event.extendedProps.reason}` : ""}`}
                                    </p>
                                    {event.extendedProps.type === "schedule" && !event.allDay && (
                                        <p className="text-sm text-muted-foreground">
                                            {format(new Date(event.start), "hh:mm a")}
                                        </p>
                                    )}
                                </div>
                            </div>
                        </button>
                    ))}
                    {events.length === 0 && (
                        <div className="text-center py-8 text-muted-foreground">
                            No events scheduled for this day
                        </div>
                    )}
                </div>
            </DialogContent>
        </Dialog>
    )
}

// ============================================================================
// MAIN CALENDAR COMPONENT
// ============================================================================

const DashboardCalendar = ({
    className,
    mode = "default",
    attendanceData = [],
    useCustomData = false,
    title,
    description,
    weekStartsOn,
    onEventClick,
    onDateClick,
    withSettings = true,
    withRefresh = true,
    eventTypes,
}: DashboardCalendarProps) => {
    const isMobile = useIsMobile()
    const { preferences, isLoaded } = useCalendarPreferences()
    const [currentDate, setCurrentDate] = useState(new Date())
    const [view, setView] = useState<CalendarView>(isMobile ? "week" : "month")
    const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null)
    const [isEventModalOpen, setIsEventModalOpen] = useState(false)
    const [selectedDate, setSelectedDate] = useState<Date>(new Date())
    const [selectedDateEvents, setSelectedDateEvents] = useState<CalendarEvent[]>(
        [],
    )
    const [isDayEventsModalOpen, setIsDayEventsModalOpen] = useState(false)

    const effectiveWeekStartsOn = weekStartsOn ?? preferences.weekStartsOn

    useEffect(() => {
        if (isMobile) {
            setView("week")
        }
    }, [isMobile])

    // ============================================================================
    // DATA FETCHING & PROCESSING
    // ============================================================================

    const { dateRange, title: dateTitle } = useMemo(() => {
        const weekStartOptions = { weekStartsOn: effectiveWeekStartsOn as 0 | 1 }

        switch (view) {
            case "month": {
                const monthStart = startOfMonth(currentDate)
                const monthEnd = endOfMonth(currentDate)
                const calendarStart = startOfWeek(monthStart, weekStartOptions)
                const calendarEnd = endOfWeek(monthEnd, weekStartOptions)
                return {
                    dateRange: { start: calendarStart, end: calendarEnd },
                    title: format(currentDate, "MMMM yyyy"),
                }
            }
            case "week": {
                const weekStart = startOfWeek(currentDate, weekStartOptions)
                const weekEnd = endOfWeek(currentDate, weekStartOptions)
                return {
                    dateRange: { start: weekStart, end: weekEnd },
                    title: `${format(weekStart, "MMM dd")} - ${format(weekEnd, "MMM dd, yyyy")}`,
                }
            }
            case "day":
                return {
                    dateRange: { start: currentDate, end: currentDate },
                    title: format(currentDate, "EEEE, MMMM dd, yyyy"),
                }
        }
    }, [view, currentDate, effectiveWeekStartsOn])

    const attendanceEvents = useMemo(() => {
        if (!useCustomData || mode !== "attendance" || !attendanceData) return []

        return attendanceData.map((record) => ({
            id: record.id,
            title: record.employeeName,
            start: record.date,
            end: record.date,
            allDay: true,
            extendedProps: {
                type: "attendance" as const,
                employeeName: record.employeeName,
                status: record.status,
                checkIn: record.checkIn,
                checkOut: record.checkOut,
                hours: record.hours,
            },
        }))
    }, [useCustomData, mode, attendanceData])

    const {
        data: apiEvents,
        isLoading,
        error,
        refetch,
    } = useCalendarEvents({
        start: formatDateToYMD(dateRange.start),
        end: formatDateToYMD(dateRange.end),
        enabled: !useCustomData,
    })

    const eventsByDate = useMemo(() => {
        let events = useCustomData ? attendanceEvents : apiEvents || []

        if (eventTypes && eventTypes.length > 0) {
            events = events.filter((event) =>
                eventTypes.includes(event.extendedProps?.type as EventType),
            )
        }

        if (!events || events.length === 0) return {}

        return events.reduce((acc: Record<string, CalendarEvent[]>, event) => {
            const colors = getEventColors(event)
            const coloredEvent = {
                ...event,
                backgroundColor: colors.bg,
                borderColor: colors.border,
                textColor: colors.text,
            }

            // For multi-day events (e.g. leave requests spanning multiple days),
            // add the event to each day in the range
            const startDate = new Date(event.start)
            const endDate = event.end ? new Date(event.end) : startDate

            // Normalize dates to start of day (ignore time component)
            const startDateOnly = new Date(
                startDate.getFullYear(),
                startDate.getMonth(),
                startDate.getDate(),
            )
            const endDateOnly = new Date(
                endDate.getFullYear(),
                endDate.getMonth(),
                endDate.getDate(),
            )

            const isMultiDay =
                (event.extendedProps?.type !== "attendance" &&
                    event.extendedProps?.is_multi_day) ||
                (event.allDay && startDateOnly.getTime() !== endDateOnly.getTime())

            if (isMultiDay) {
                const days = eachDayOfInterval({
                    start: startDateOnly,
                    end: endDateOnly,
                })
                for (const day of days) {
                    const dateKey = day.toDateString()
                    if (!acc[dateKey]) acc[dateKey] = []
                    acc[dateKey].push(coloredEvent)
                }
            } else {
                const dateKey = startDate.toDateString()
                if (!acc[dateKey]) acc[dateKey] = []
                acc[dateKey].push(coloredEvent)
            }

            return acc
        }, {})
    }, [useCustomData, attendanceEvents, apiEvents, eventTypes])

    // ============================================================================
    // EVENT HANDLERS
    // ============================================================================

    const handleNavigation = (direction: "prev" | "next" | "today") => {
        if (direction === "today") {
            setCurrentDate(new Date())
            return
        }

        switch (view) {
            case "month":
                setCurrentDate((prev) =>
                    direction === "next" ? addMonths(prev, 1) : subMonths(prev, 1),
                )
                break
            case "week":
                setCurrentDate((prev) =>
                    direction === "next" ? addWeeks(prev, 1) : subWeeks(prev, 1),
                )
                break
            case "day":
                setCurrentDate((prev) =>
                    direction === "next" ? addDays(prev, 1) : subDays(prev, 1),
                )
                break
        }
    }

    const handleEventClick = (event: CalendarEvent) => {
        if (onEventClick) {
            onEventClick(event)
        } else {
            setSelectedEvent(event)
            setIsEventModalOpen(true)
        }
    }

    const handleDayClick = (date: Date) => {
        if (onDateClick) onDateClick(date)

        const dayEvents = eventsByDate[date.toDateString()] || []
        if (dayEvents.length === 0) return

        setSelectedDate(date)
        setSelectedDateEvents(dayEvents)
        setIsDayEventsModalOpen(true)
    }

    // ============================================================================
    // RENDER FUNCTIONS
    // ============================================================================

    const renderMonthView = () => {
        const dayNames =
            effectiveWeekStartsOn === 0
                ? ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"]
                : ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]

        const days = eachDayOfInterval(dateRange)
        const weeks = []
        for (let i = 0; i < days.length; i += 7) {
            weeks.push(days.slice(i, i + 7))
        }

        return (
            <div className="border rounded-lg overflow-hidden">
                <div className="grid grid-cols-7 border-b bg-muted/30">
                    {dayNames.map((day) => (
                        <div
                            key={day}
                            className="py-1.5 px-1 sm:px-2 text-center text-sm sm:text-sm font-medium text-muted-foreground"
                        >
                            <span className="hidden sm:inline">{day}</span>
                            <span className="sm:hidden text-sm">{day[0]}</span>
                        </div>
                    ))}
                </div>

                <div className="divide-y">
                    {weeks.map((week, weekIndex) => (
                        <div
                            key={weekIndex}
                            className="grid grid-cols-7 divide-x"
                        >
                            {week.map((day) => {
                                const dayEvents = eventsByDate[day.toDateString()] || []
                                const isCurrentMonth = isSameMonth(day, currentDate)
                                const isTodayDate = isToday(day)
                                const dayBgColor = getDayBackgroundColor(
                                    day,
                                    eventsByDate,
                                    mode,
                                )

                                return (
                                    <div
                                        key={day.toDateString()}
                                        className={cn(
                                            "aspect-square p-1 sm:p-1.5 cursor-pointer transition-colors overflow-hidden",
                                            !isCurrentMonth &&
                                            "bg-muted text-muted-foreground hover:bg-muted!",
                                            isTodayDate &&
                                            "ring-2 ring-primary ring-inset bg-primary/5",
                                            dayBgColor || "hover:bg-muted/50",
                                        )}
                                        onClick={() => handleDayClick(day)}
                                    >
                                        <div className="flex items-center justify-between mb-0.5 sm:mb-1">
                                            <span
                                                className={cn(
                                                    "text-sm sm:text-sm font-medium leading-none",
                                                    isTodayDate && "text-primary font-semibold",
                                                )}
                                            >
                                                {format(day, "d")}
                                            </span>
                                            {dayEvents.length > 0 && (
                                                <div className="flex items-center gap-0.5">
                                                    <div className="size-1.5 sm:size-2 rounded-full bg-primary" />
                                                    {dayEvents.length > 1 && (
                                                        <span className="text-[10px] sm:text-sm text-muted-foreground">
                                                            {dayEvents.length}
                                                        </span>
                                                    )}
                                                </div>
                                            )}
                                        </div>

                                        <div className="space-y-1">
                                            <div className="hidden lg:block">
                                                {dayEvents.slice(0, 2).map((event, eventIndex) => (
                                                    <CalendarEventItem
                                                        key={eventIndex}
                                                        event={event}
                                                        variant="compact"
                                                        onClick={handleEventClick}
                                                    />
                                                ))}
                                                {dayEvents.length > 2 && (
                                                    <div className="text-sm text-muted-foreground text-center mt-2">
                                                        +{dayEvents.length - 2} more
                                                    </div>
                                                )}
                                            </div>

                                            <div className="hidden sm:block lg:hidden">
                                                {dayEvents.slice(0, 2).map((event, eventIndex) => (
                                                    <CalendarEventItem
                                                        key={eventIndex}
                                                        event={event}
                                                        variant="dot"
                                                        onClick={handleEventClick}
                                                    />
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                )
                            })}
                        </div>
                    ))}
                </div>
            </div>
        )
    }

    const renderWeekView = () => {
        const days = eachDayOfInterval(dateRange)
        const timeSlots = Array.from({ length: 24 }, (_, i) => i)

        return (
            <div className="border rounded-lg">
                <div className="block sm:hidden">
                    <div className="divide-y">
                        {days.map((day) => {
                            const dayEvents = eventsByDate[day.toDateString()] || []
                            const isTodayDate = isToday(day)

                            if (dayEvents.length === 0) return null

                            return (
                                <div
                                    key={day.toDateString()}
                                    className={cn(
                                        "p-3 cursor-pointer hover:bg-muted/50",
                                        isTodayDate && "bg-primary/10",
                                    )}
                                    onClick={() => handleDayClick(day)}
                                >
                                    <div className="flex items-center justify-between mb-2">
                                        <div
                                            className={cn(
                                                "text-sm font-semibold",
                                                isTodayDate && "text-primary",
                                            )}
                                        >
                                            {format(day, "EEE, MMM d")}
                                        </div>
                                        <div className="text-sm text-muted-foreground">
                                            {dayEvents.length} event{dayEvents.length > 1 ? "s" : ""}
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        {dayEvents.slice(0, 3).map((event, eventIndex) => (
                                            <CalendarEventItem
                                                key={eventIndex}
                                                event={event}
                                                variant="compact"
                                                onClick={handleEventClick}
                                            />
                                        ))}
                                        {dayEvents.length > 3 && (
                                            <div className="text-sm text-muted-foreground text-center mt-2">
                                                +{dayEvents.length - 3} more
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )
                        })}
                    </div>
                </div>

                <div className="hidden sm:block overflow-x-auto">
                    <div className="min-w-full">
                        <div className="grid grid-cols-8 border-b bg-muted/30 min-w-[640px]">
                            <div className="p-1.5 sm:p-2" />
                            {days.map((day) => (
                                <div
                                    key={day.toDateString()}
                                    className="p-1.5 sm:p-2 text-center min-w-20"
                                >
                                    <div className="text-[10px] text-muted-foreground">
                                        {format(day, "EEE")}
                                    </div>
                                    <div
                                        className={cn(
                                            "text-sm sm:text-sm font-medium",
                                            isToday(day) && "text-primary",
                                        )}
                                    >
                                        {format(day, "d")}
                                    </div>
                                </div>
                            ))}
                        </div>

                        <div className="divide-y max-h-64 sm:max-h-80 overflow-y-auto min-w-[640px]">
                            {timeSlots.map((hour) => (
                                <div
                                    key={hour}
                                    className="grid grid-cols-8 divide-x min-h-8 sm:min-h-10"
                                >
                                    <div className="p-1 text-[10px] flex items-center justify-center text-muted-foreground text-center bg-muted/20">
                                        {format(new Date().setHours(hour, 0, 0, 0), "h:mm a")}
                                    </div>
                                    {days.map((day) => {
                                        const dayEvents =
                                            eventsByDate[day.toDateString()]?.filter((event) => {
                                                if (event.allDay) return hour === 0
                                                return new Date(event.start).getHours() === hour
                                            }) || []

                                        return (
                                            <div
                                                key={`${day.toDateString()}-${hour}`}
                                                className="p-1 hover:bg-muted/50 transition-colors cursor-pointer min-w-20"
                                                onClick={() => handleDayClick(day)}
                                            >
                                                {dayEvents.map((event, eventIndex) => (
                                                    <CalendarEventItem
                                                        key={eventIndex}
                                                        event={event}
                                                        variant="compact"
                                                        onClick={handleEventClick}
                                                        className="mb-0.5 text-sm"
                                                    />
                                                ))}
                                            </div>
                                        )
                                    })}
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        )
    }

    const renderDayView = () => {
        const dayEvents = eventsByDate[currentDate.toDateString()] || []
        const timeSlots = Array.from({ length: 24 }, (_, i) => i)

        return (
            <div className="space-y-4">
                {dayEvents.filter((e) => e.allDay).length > 0 && (
                    <div className="border rounded-lg p-4">
                        <h3 className="text-sm font-medium mb-3 text-muted-foreground">
                            All Day
                        </h3>
                        <div className="space-y-2">
                            {dayEvents
                                .filter((e) => e.allDay)
                                .map((event, index) => (
                                    <CalendarEventItem
                                        key={index}
                                        event={event}
                                        variant="compact"
                                        onClick={handleEventClick}
                                    />
                                ))}
                        </div>
                    </div>
                )}

                <div className="border rounded-lg overflow-hidden">
                    {timeSlots.map((hour) => {
                        const hourEvents = dayEvents.filter((event) => {
                            if (event.allDay) return false
                            return new Date(event.start).getHours() === hour
                        })

                        return (
                            <div
                                key={hour}
                                className="border-b last:border-b-0 min-h-10 sm:min-h-12 flex"
                            >
                                <div className="w-16 sm:w-20 p-2 sm:p-3 text-sm text-muted-foreground bg-muted/20 shrink-0">
                                    {format(new Date().setHours(hour, 0, 0, 0), "h:mm a")}
                                </div>
                                <div className="flex-1 p-2 sm:p-3 space-y-1">
                                    {hourEvents.map((event, eventIndex) => (
                                        <DayViewEventItem
                                            key={eventIndex}
                                            event={event}
                                            onClick={handleEventClick}
                                        />
                                    ))}
                                </div>
                            </div>
                        )
                    })}
                </div>
            </div>
        )
    }

    const renderLegend = () => {
        const items = eventTypes
            ? LEGEND_ITEMS.filter((item) =>
                eventTypes.includes(item.type as EventType),
            )
            : LEGEND_ITEMS

        return (
            <div className="flex flex-wrap gap-x-3 gap-y-1 px-3 py-2 bg-muted/30 rounded-lg">
                {items.map((item, index) => (
                    <div
                        key={`${item.type}-${item.label}-${index}`}
                        className="flex items-center gap-1.5"
                    >
                        <div
                            className={cn(
                                "size-2.5 rounded-sm shrink-0",
                                getColorClass(item.color),
                            )}
                        />
                        <span className="text-muted-foreground text-sm whitespace-nowrap">
                            {item.label}
                        </span>
                    </div>
                ))}

                {eventTypes?.includes("attendance") &&
                    ATTENDANCE_LEGEND_ITEMS.map((type) => {
                        const colors = EVENT_COLORS[type.value]
                        return (
                            <div
                                key={type.value}
                                className="flex items-center gap-1.5"
                            >
                                <div
                                    className={cn(
                                        "size-2.5 rounded-sm shrink-0",
                                        getColorClass(colors.bg),
                                    )}
                                />
                                <span className="text-muted-foreground text-sm whitespace-nowrap">
                                    {type.label}
                                </span>
                            </div>
                        )
                    })}
            </div>
        )
    }

    // ============================================================================
    // LOADING & ERROR STATES
    // ============================================================================

    if (!isLoaded && weekStartsOn === undefined) {
        return (
            <Card className={className}>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Calendar className="w-5 h-5" />
                        {title || "Calendar"}
                    </CardTitle>
                    <CardDescription>Loading calendar preferences...</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="space-y-3">
                        <div className="flex items-center justify-between">
                            <Skeleton className="h-8 w-32" />
                            <div className="flex gap-1">
                                <Skeleton className="size-8 rounded" />
                                <Skeleton className="size-8 rounded" />
                                <Skeleton className="size-8 rounded" />
                            </div>
                        </div>
                        <div className="grid grid-cols-7 gap-1">
                            {Array.from({ length: 7 }).map((_, i) => (
                                <Skeleton
                                    key={`h-${i}`}
                                    className="h-6 w-full"
                                />
                            ))}
                            {Array.from({ length: 35 }).map((_, i) => (
                                <Skeleton
                                    key={`d-${i}`}
                                    className="h-10 w-full"
                                />
                            ))}
                        </div>
                    </div>
                </CardContent>
            </Card>
        )
    }

    if (error) {
        return (
            <Card className={className}>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Calendar className="w-5 h-5" />
                        Calendar
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="text-center py-8">
                        <p className="text-muted-foreground mb-4">
                            Failed to load calendar events
                        </p>
                        <Button
                            onClick={() => refetch()}
                            variant="outline"
                        >
                            Try Again
                        </Button>
                    </div>
                </CardContent>
            </Card>
        )
    }

    // ============================================================================
    // MAIN RENDER
    // ============================================================================

    return (
        <>
            <Card
                key={`calendar-${effectiveWeekStartsOn}-${view}`}
                className={className}
            >
                <CardHeader className="pb-3">
                    <div className="flex flex-col space-y-3 sm:flex-row sm:items-center sm:justify-between sm:space-y-0">
                        <div className="space-y-0.5">
                            <CardTitle className="flex items-center gap-2 text-base">
                                <Calendar className="w-4 h-4" />
                                {title || "Calendar"}
                            </CardTitle>
                            <CardDescription className="text-sm">
                                {description ||
                                    "View birthdays, holidays, and scheduled services"}
                            </CardDescription>
                        </div>
                        {(withSettings || withRefresh) && (
                            <div className="flex flex-col md:flex-row items-center justify-center md:justify-end gap-2">
                                {withSettings && <CalendarSettings />}
                                {withRefresh && (
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => refetch()}
                                        disabled={isLoading}
                                        className="text-sm"
                                    >
                                        {isLoading ? "Loading..." : "Refresh"}
                                    </Button>
                                )}
                            </div>
                        )}
                    </div>
                </CardHeader>

                <CardContent className="space-y-3 pt-0">
                    {/* Mobile Controls */}
                    <div className="flex flex-col space-y-2 sm:hidden">
                        <h2 className="text-sm font-semibold text-center px-2">
                            {dateTitle}
                        </h2>

                        <div className="flex items-center justify-center gap-1.5">
                            {(["month", "week", "day"] as const).map((v) => (
                                <Button
                                    key={v}
                                    variant={view === v ? "default" : "outline"}
                                    size="sm"
                                    onClick={() => setView(v)}
                                    className="capitalize text-sm h-7 px-2"
                                >
                                    {v}
                                </Button>
                            ))}
                        </div>

                        <div className="flex items-center justify-center gap-1.5">
                            <Button
                                variant="outline"
                                size="sm"
                                className="h-7 w-7 p-0"
                                onClick={() => handleNavigation("prev")}
                            >
                                <ChevronLeft className="w-4 h-4" />
                            </Button>
                            <Button
                                variant={
                                    currentDate.toDateString() === new Date().toDateString()
                                        ? "default"
                                        : "outline"
                                }
                                size="sm"
                                onClick={() => handleNavigation("today")}
                                disabled={
                                    currentDate.toDateString() === new Date().toDateString()
                                }
                                className="text-sm h-7 px-3"
                            >
                                Today
                            </Button>
                            <Button
                                variant="outline"
                                size="sm"
                                className="h-7 w-7 p-0"
                                onClick={() => handleNavigation("next")}
                            >
                                <ChevronRight className="w-4 h-4" />
                            </Button>
                        </div>
                    </div>

                    {/* Desktop Controls */}
                    <div className="hidden sm:flex sm:items-center justify-between gap-3">
                        <div className="flex items-center gap-1">
                            <Button
                                variant="outline"
                                size="sm"
                                className="h-7 w-7 p-0"
                                onClick={() => handleNavigation("prev")}
                            >
                                <ChevronLeft className="w-3.5 h-3.5" />
                            </Button>
                            <Button
                                variant="outline"
                                size="sm"
                                className="h-7 w-7 p-0"
                                onClick={() => handleNavigation("next")}
                            >
                                <ChevronRight className="w-3.5 h-3.5" />
                            </Button>
                            <Button
                                variant={
                                    currentDate.toDateString() === new Date().toDateString()
                                        ? "default"
                                        : "outline"
                                }
                                size="sm"
                                onClick={() => handleNavigation("today")}
                                disabled={
                                    currentDate.toDateString() === new Date().toDateString()
                                }
                                className="h-7 text-sm px-2.5"
                            >
                                Today
                            </Button>
                        </div>

                        <h2 className="text-sm font-semibold text-center flex-1">
                            {dateTitle}
                        </h2>

                        <div className="flex items-center gap-1">
                            {(["month", "week", "day"] as const).map((v) => (
                                <Button
                                    key={v}
                                    variant={view === v ? "default" : "outline"}
                                    size="sm"
                                    onClick={() => setView(v)}
                                    className="capitalize h-7 text-sm px-2.5"
                                >
                                    {v}
                                </Button>
                            ))}
                        </div>
                    </div>

                    {renderLegend()}

                    {view === "month" && renderMonthView()}
                    {view === "week" && renderWeekView()}
                    {view === "day" && renderDayView()}
                </CardContent>
            </Card>

            <EventDetailModal
                event={selectedEvent}
                isOpen={isEventModalOpen}
                onClose={() => setIsEventModalOpen(false)}
            />

            <DayEventsModal
                date={selectedDate}
                events={selectedDateEvents}
                isOpen={isDayEventsModalOpen}
                onClose={() => setIsDayEventsModalOpen(false)}
                onEventClick={handleEventClick}
            />
        </>
    )
}

export default DashboardCalendar
