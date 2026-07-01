"use client"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Skeleton } from "@/components/ui/skeleton"
import { useIsMobile } from "@/lib/hooks"
import { useCalendarPreferences } from "@/lib/hooks/useCalendarPreferences"
import { CalendarEvent, useCalendarEvents } from "@/lib/queries/calendar/useCalendarEvents"
import { cn, formatDateToYMD } from "@/lib/utils/helpers"
import {
    addDays, addMonths, addWeeks,
    eachDayOfInterval, endOfMonth, endOfWeek,
    format, isSameMonth, isToday,
    startOfMonth, startOfWeek,
    subDays, subMonths, subWeeks,
} from "date-fns"
import { Calendar, ChevronLeft, ChevronRight, Clock, FileText, User } from "lucide-react"
import { useEffect, useMemo, useState } from "react"
import { CalendarEventItem } from "./CalendarEventItem"
import CalendarSettings from "./CalendarSettings"
import { DayViewEventItem } from "./DayViewEventItem"
import { EventIcon } from "./EventIcon"
import { AnimatedNumber } from "@/components/custom/shared/AnimatedNumber"

// ── Types ────────────────────────────────────────────────────────────────────

export type CalendarView = "month" | "week" | "day"
export type EventType =
    | "birthday" | "holiday" | "attendance" | "leave"
    | "schedule" | "service" | "half_day" | "shop_closed" | "custom_event"
type EventExtendedProps = CalendarEvent["extendedProps"]

type AttendanceStatus = "present" | "late" | "absent" | "leave" | "invalid"

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

// ── Color config ─────────────────────────────────────────────────────────────

const C = {
    success: "var(--success)",
    warning: "var(--warning)",
    destructive: "var(--destructive)",
    info: "var(--info)",
    chart1: "var(--chart-1)",
    chart5: "var(--chart-5)",
    muted: "var(--muted-foreground)",
} as const

const fg = {
    success: "var(--success-foreground)",
    warning: "var(--warning-foreground)",
    destructive: "var(--destructive-foreground)",
    info: "var(--info-foreground)",
    primary: "var(--primary-foreground)",
    bg: "var(--background)",
} as const

const mkColor = (bg: string, text: string, lightBg?: string, hoverBg?: string): EventColors =>
    ({ bg, border: bg, text, lightBg, hoverBg })

const EVENT_COLORS: Record<string, EventColors> = {
    // Attendance
    present: mkColor(C.success, fg.success, "bg-success/10 dark:bg-success/15", "hover:bg-success/15 dark:hover:bg-success/20"),
    late: mkColor(C.warning, fg.warning, "bg-warning/10 dark:bg-warning/15", "hover:bg-warning/15 dark:hover:bg-warning/20"),
    absent: mkColor(C.destructive, fg.destructive, "bg-destructive/10 dark:bg-destructive/15", "hover:bg-destructive/15 dark:hover:bg-destructive/20"),
    leave: mkColor(C.chart5, fg.primary, "bg-primary/10 dark:bg-primary/15", "hover:bg-primary/15 dark:hover:bg-primary/20"),
    invalid: mkColor(C.muted, fg.bg, "bg-muted/60", "hover:bg-muted/80"),

    // Event types
    birthday: mkColor(C.success, fg.success),
    regularHoliday: mkColor(C.destructive, fg.destructive),
    specialHoliday: mkColor(C.warning, fg.warning),
    sickLeave: mkColor(C.chart5, fg.primary),
    emergencyLeave: mkColor(C.warning, fg.warning),
    schedule: mkColor(C.info, fg.info),
    meeting: mkColor(C.chart1, fg.primary),
    maintenance: mkColor(C.warning, fg.warning),
    training: mkColor(C.chart5, fg.primary),
    deadline: mkColor(C.destructive, fg.destructive),
    other: mkColor(C.muted, fg.bg),
    delivery: mkColor(C.success, fg.success),
    halfDay: mkColor(C.warning, fg.warning),
    shopClosed: mkColor(C.destructive, fg.destructive),
    default: mkColor(C.muted, fg.bg),
}

const COLOR_CLASS_MAP: Record<string, string> = {
    [C.success]: "bg-[var(--success)]",
    [C.warning]: "bg-[var(--warning)]",
    [C.destructive]: "bg-[var(--destructive)]",
    [C.chart5]: "bg-[var(--chart-5)]",
    [C.muted]: "bg-[var(--muted-foreground)]",
    [C.info]: "bg-[var(--info)]",
    [C.chart1]: "bg-[var(--chart-1)]",
}

const getColorClass = (color?: string) => COLOR_CLASS_MAP[color ?? ""] ?? "bg-muted"

const LEGEND_ITEMS = [
    { type: "birthday", label: "Birthdays", color: EVENT_COLORS.birthday.bg },
    { type: "holiday", label: "Regular Holidays", color: EVENT_COLORS.regularHoliday.bg },
    { type: "holiday", label: "Special Holidays", color: EVENT_COLORS.specialHoliday.bg },
    { type: "schedule", label: "Schedules", color: EVENT_COLORS.schedule.bg },
    { type: "leave", label: "Sick Leave", color: EVENT_COLORS.sickLeave.bg },
    { type: "leave", label: "Emergency Leave", color: EVENT_COLORS.emergencyLeave.bg },
    { type: "custom_event", label: "Meetings", color: EVENT_COLORS.meeting.bg },
    { type: "custom_event", label: "Maintenance", color: EVENT_COLORS.maintenance.bg },
    { type: "custom_event", label: "Training", color: EVENT_COLORS.training.bg },
    { type: "custom_event", label: "Deadlines", color: EVENT_COLORS.deadline.bg },
    { type: "half_day", label: "Half Days", color: EVENT_COLORS.halfDay.bg },
    { type: "shop_closed", label: "Shop Closed", color: EVENT_COLORS.shopClosed.bg },
] as const

const ATTENDANCE_LEGEND: Array<{ value: AttendanceStatus; label: string }> = [
    { value: "present", label: "Present" },
    { value: "late", label: "Late" },
    { value: "absent", label: "Absent" },
    { value: "leave", label: "Leave" },
    { value: "invalid", label: "Invalid" },
]

const TYPE_LABELS: Record<string, (ep: EventExtendedProps) => string> = {
    attendance: (ep) => (ep.status || ep.attendance_status || "").replace(/^\w/, (c: string) => c.toUpperCase()),
    birthday: () => "Employee Birthday",
    holiday: (ep) => (ep.holiday_type === "regular" ? "Regular Holiday" : "Special Holiday"),
    leave: (ep) => ep.leave_type_display ?? "Leave",
    schedule: () => "Scheduled Service",
    delivery: () => "Service Delivery",
    custom_event: (ep) => {
        const labels: Record<string, string> = { meeting: "Meeting", maintenance: "Maintenance", training: "Training", deadline: "Deadline", other: "Other" }
        return labels[ep.event_type ?? "other"] ?? "Other"
    },
    half_day: () => "Half Day",
    shop_closed: () => "Shop Closed",
}

// ── Utilities ─────────────────────────────────────────────────────────────────

const getEventColors = (event: CalendarEvent): EventColors => {
    const { type, status, attendance_status, holiday_type, leave_type, event_type } = event.extendedProps

    switch (type) {
        case "attendance":
            return EVENT_COLORS[(status || attendance_status) as string] ?? EVENT_COLORS.default
        case "birthday":
            return EVENT_COLORS.birthday
        case "holiday":
            return holiday_type === "regular" ? EVENT_COLORS.regularHoliday : EVENT_COLORS.specialHoliday
        case "leave":
            return leave_type === "SICK" ? EVENT_COLORS.sickLeave
                : leave_type === "EMERGENCY" ? EVENT_COLORS.emergencyLeave
                    : EVENT_COLORS.default
        case "schedule": return EVENT_COLORS.schedule
        case "delivery": return EVENT_COLORS.delivery
        case "half_day": return EVENT_COLORS.halfDay
        case "shop_closed": return EVENT_COLORS.shopClosed
        case "custom_event":
            return EVENT_COLORS[event_type as string] ?? EVENT_COLORS.default
        default:
            return EVENT_COLORS.default
    }
}

const STATUS_PRIORITY: Record<string, number> = { present: 4, late: 3, leave: 2, absent: 1, invalid: 0 }

const getDayBgColor = (
    day: Date,
    eventsByDate: Record<string, CalendarEvent[]>,
    mode: "default" | "attendance",
): string => {
    if (mode !== "attendance") return ""
    const events = (eventsByDate[day.toDateString()] ?? []).filter(e => e.extendedProps?.type === "attendance")
    if (!events.length) return ""

    let best = "", bestPrio = -1
    for (const e of events) {
        const s = (e.extendedProps?.status || e.extendedProps?.attendance_status) as string
        const p = STATUS_PRIORITY[s] ?? 0
        if (p > bestPrio) { bestPrio = p; best = s }
    }

    const colors = EVENT_COLORS[best]
    return colors ? `${colors.lightBg} ${colors.hoverBg}` : ""
}

const formatEventDate = (start: string, end?: string, allDay?: boolean): string => {
    const s = new Date(start)
    if (allDay) return format(s, "EEEE, MMMM dd, yyyy") + " (All Day)"
    if (end && start !== end) return `${format(s, "EEEE, MMMM dd")} – ${format(new Date(end), "EEEE, MMMM dd, yyyy")}`
    return format(s, "EEEE, MMMM dd, yyyy 'at' hh:mm a")
}

// ── Shared, render-prop UI (hoisted — no closures, so stable across re-renders) ──

function NavButton({ dir, onNavigate, icon }: { dir: "prev" | "next"; onNavigate: (dir: "prev" | "next") => void; icon: React.ReactNode }) {
    return (
        <Button variant="outline" size="icon-sm" onClick={() => onNavigate(dir)}>{icon}</Button>
    )
}

function ViewToggle({ view, onChange, size }: { view: CalendarView; onChange: (v: CalendarView) => void; size?: "sm" }) {
    return (
        <>
            {(["month", "week", "day"] as const).map((v) => (
                <Button key={v} variant={view === v ? "default" : "outline"} size={size ?? "sm"}
                    onClick={() => onChange(v)} className="capitalize">
                    {v}
                </Button>
            ))}
        </>
    )
}

function InfoRow({ icon, text, label }: { icon: React.ReactNode; text?: string; label?: string }) {
    if (!text) return null
    return (
        <div className="flex items-center gap-2 text-sm">
            <span className="text-muted-foreground shrink-0">{icon}</span>
            {label ? <div><span className="font-medium">{label}: </span><span className="text-muted-foreground">{text}</span></div> : <span>{text}</span>}
        </div>
    )
}

// ── Modals ───────────────────────────────────────────────────────────────────
function EventDetailModal({ event, isOpen, onClose }: {
    event: CalendarEvent | null
    isOpen: boolean
    onClose: () => void
}) {
    if (!event) return null
    const ep = event.extendedProps
    const epType = ep.type
    const colors = getEventColors(event)
    const label = TYPE_LABELS[epType]?.(ep) ?? epType

    const headerTitle =
        epType === "attendance" ? (ep.employeeName || ep.employee_name)
            : epType === "birthday" ? `${ep.user_name}'s Birthday`
                : epType === "schedule" ? (ep.schedule_type_display ?? ep.schedule_type?.replace("_", " ").replace(/\b\w/g, (l: string) => l.toUpperCase()))
                    : epType === "delivery" ? "Delivery"
                        : epType === "leave" ? ep.employee_name
                            : epType === "shop_closed" ? "Shop Closed"
                                : event.title

    const dateLine = (() => {
        if (epType === "leave" && event.end && event.start !== event.end) {
            return formatEventDate(event.start, event.end)
        }
        if (event.allDay) return format(new Date(event.start), "EEEE, MMMM dd, yyyy") + " (All Day)"
        return formatEventDate(event.start, event.end, event.allDay)
    })()

    const renderBody = () => {
        switch (epType) {
            case "attendance":
                return (
                    <div className="space-y-2">
                        {(ep.checkIn || ep.check_in) && <InfoRow icon={<Clock className="size-4" />} label="Check In" text={ep.checkIn || ep.check_in} />}
                        {(ep.checkOut || ep.check_out) && <InfoRow icon={<Clock className="size-4" />} label="Check Out" text={ep.checkOut || ep.check_out} />}
                        {(ep.hours ?? 0) > 0 && <InfoRow icon={<Clock className="size-4" />} label="Hours" text={String(ep.hours)} />}
                    </div>
                )
            case "leave": {
                const duration = ep.is_multi_day && ep.days_count
                    ? `${ep.days_count} Day${parseFloat(ep.days_count) !== 1 ? "s" : ""}`
                    : ep.is_half_day ? `Half Day – ${ep.shift_period_display ?? "Morning"}` : "Full Day"
                return (
                    <div className="space-y-2">
                        <InfoRow icon={<Clock className="size-4" />} label="Duration" text={duration} />
                        {ep.reason && <InfoRow icon={<FileText className="size-4" />} label="Reason" text={ep.reason} />}
                    </div>
                )
            }
            case "schedule":
                return (
                    <div className="space-y-2">
                        <InfoRow icon={<User className="size-4" />} label="Client" text={ep.client_name} />
                        {ep.service_type_display && <InfoRow icon={<FileText className="size-4" />} label="Service Type" text={ep.service_type_display} />}
                        <InfoRow icon={<User className="size-4" />} label="Technician/s" text={ep.technician_names?.join(", ") ?? "Unassigned"} />
                        {ep.notes && <InfoRow icon={<FileText className="size-4" />} label="Notes" text={ep.notes} />}
                    </div>
                )
            case "delivery": {
                const techs = ep.technician_names ?? []
                return (
                    <div className="space-y-2">
                        <InfoRow icon={<User className="size-4" />} label="Client" text={ep.client_name} />
                        {ep.service_type_display && <InfoRow icon={<FileText className="size-4" />} label="Service Type" text={ep.service_type_display} />}
                        {techs.length > 0 && <InfoRow icon={<User className="size-4" />} label="Technician/s" text={techs.length > 1 ? techs.join(", ") : techs[0]} />}
                        {ep.notes && <InfoRow icon={<FileText className="size-4" />} label="Notes" text={ep.notes} />}
                    </div>
                )
            }
            case "custom_event":
                return (
                    <div className="space-y-2">
                        {ep.description && <InfoRow icon={<FileText className="size-4" />} label="Description" text={ep.description} />}
                        {ep.created_by && <InfoRow icon={<User className="size-4" />} label="Created by" text={ep.created_by} />}
                    </div>
                )
            case "half_day":
            case "shop_closed":
                return (
                    <div className="space-y-2">
                        {ep.reason && !(epType === "shop_closed" && ep.reason.toLowerCase() === "shop closed") &&
                            <InfoRow icon={<FileText className="size-4" />} label="Reason" text={ep.reason} />}
                        {ep.created_by && <InfoRow icon={<User className="size-4" />} label="Set by" text={ep.created_by} />}
                    </div>
                )
            default:
                return null
        }
    }

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-md p-0 overflow-hidden gap-0">
                <div
                    className="px-5 py-4 flex items-start gap-3 border-b"
                    style={{ backgroundColor: `color-mix(in srgb, ${colors.bg} 12%, transparent)` }}
                >
                    <div
                        className="size-11 rounded-full flex items-center justify-center shrink-0"
                    >
                        <EventIcon event={event} size="md" />
                    </div>
                    <div className="min-w-0 flex-1 pt-0.5">
                        <DialogHeader className="space-y-0.5 text-left">
                            <DialogTitle className="text-base leading-snug wrap-break-words">{headerTitle}</DialogTitle>
                        </DialogHeader>
                        <Badge className="capitalize mt-1.5 rounded-2xl" style={{ backgroundColor: colors.bg, color: colors.text }}>{label}</Badge>
                    </div>
                </div>

                <div className="px-5 py-4 space-y-3">
                    <InfoRow icon={<Clock className="size-4" />} text={dateLine} />
                    {renderBody()}
                </div>
            </DialogContent>
        </Dialog>
    )
}

function DayEventsModal({ date, events, isOpen, onClose, onEventClick }: {
    date: Date
    events: CalendarEvent[]
    isOpen: boolean
    onClose: () => void
    onEventClick: (event: CalendarEvent) => void
}) {
    const describeEvent = (event: CalendarEvent) => {
        const ep = event.extendedProps
        switch (ep.type) {
            case "birthday": return "Employee Birthday"
            case "holiday": return `${ep.holiday_type === "regular" ? "Regular" : "Special"} Holiday`
            case "leave": return `${ep.leave_type_display} Leave${ep.is_multi_day && ep.days_count ? ` (${ep.days_count} Days)` : ep.is_half_day ? " (Half Day)" : " (Full Day)"}`
            case "schedule": return `${ep.service_type?.replace("_", " ")} – ${ep.client_name}`
            case "delivery": return `Service Delivery – ${ep.client_name}`
            case "custom_event": return `${ep.event_type?.charAt(0).toUpperCase()}${ep.event_type?.slice(1)} Event`
            case "half_day": return `Half Day${ep.reason ? ` – ${ep.reason}` : ""}`
            case "shop_closed": return `Shop Closed${ep.reason && ep.reason.toLowerCase() !== "shop closed" ? ` – ${ep.reason}` : ""}`
            default: return ep.type
        }
    }

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-lg">
                <DialogHeader>
                    <DialogTitle className="font-mono">{format(date, "EEEE, MMMM dd, yyyy")}</DialogTitle>
                    <DialogDescription className="font-mono tabular-nums">
                        <AnimatedNumber value={events.length} /> event{events.length !== 1 ? "s" : ""} on this day
                    </DialogDescription>
                </DialogHeader>
                <div className="space-y-2 max-h-96 overflow-y-auto">
                    {events.length === 0
                        ? <p className="text-center py-8 text-muted-foreground">No events scheduled for this day</p>
                        : events.map((event, i) => (
                            <button
                                key={i}
                                onClick={() => onEventClick(event)}
                                className="w-full p-3 rounded-lg border hover:bg-muted/50 transition-colors text-left"
                            >
                                <div className="flex items-start gap-3">
                                    <span
                                        className="size-6 rounded-full flex items-center justify-center mt-0.5 shrink-0"
                                        style={{ backgroundColor: `${event.backgroundColor}26` }}
                                    >
                                        <EventIcon event={event} size="xs" />
                                    </span>
                                    <div className="flex-1 min-w-0">
                                        <h4 className="font-medium text-sm">{event.title}</h4>
                                        <p className="text-sm text-muted-foreground mt-0.5 capitalize">{describeEvent(event)}</p>
                                        {event.extendedProps.type === "schedule" && !event.allDay && (
                                            <p className="text-sm text-muted-foreground">{format(new Date(event.start), "hh:mm a")}</p>
                                        )}
                                    </div>
                                </div>
                            </button>
                        ))
                    }
                </div>
            </DialogContent>
        </Dialog>
    )
}

// ── Main component ────────────────────────────────────────────────────────────

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
    const [selectedDateEvents, setSelectedDateEvents] = useState<CalendarEvent[]>([])
    const [isDayEventsModalOpen, setIsDayEventsModalOpen] = useState(false)

    const effectiveWeekStartsOn = weekStartsOn ?? preferences.weekStartsOn

    useEffect(() => { if (isMobile) setView("week") }, [isMobile])

    // ── Date range & title ──

    const { dateRange, dateTitle } = useMemo(() => {
        const opts = { weekStartsOn: effectiveWeekStartsOn as 0 | 1 }
        switch (view) {
            case "month": {
                const s = startOfMonth(currentDate), e = endOfMonth(currentDate)
                return { dateRange: { start: startOfWeek(s, opts), end: endOfWeek(e, opts) }, dateTitle: format(currentDate, "MMMM yyyy") }
            }
            case "week": {
                const s = startOfWeek(currentDate, opts), e = endOfWeek(currentDate, opts)
                return { dateRange: { start: s, end: e }, dateTitle: `${format(s, "MMM dd")} – ${format(e, "MMM dd, yyyy")}` }
            }
            case "day":
                return { dateRange: { start: currentDate, end: currentDate }, dateTitle: format(currentDate, "EEEE, MMMM dd, yyyy") }
        }
    }, [view, currentDate, effectiveWeekStartsOn])

    // ── Events ──

    const attendanceEvents = useMemo(() => {
        if (!useCustomData || mode !== "attendance") return []
        return attendanceData.map((r) => ({
            id: r.id, title: r.employeeName, start: r.date, end: r.date, allDay: true,
            extendedProps: { type: "attendance" as const, employeeName: r.employeeName, status: r.status, checkIn: r.checkIn, checkOut: r.checkOut, hours: r.hours },
        }))
    }, [useCustomData, mode, attendanceData])

    const { data: apiEvents, isLoading, error, refetch } = useCalendarEvents({
        start: formatDateToYMD(dateRange.start),
        end: formatDateToYMD(dateRange.end),
        enabled: !useCustomData,
    })

    const eventsByDate = useMemo(() => {
        let events = useCustomData ? attendanceEvents : apiEvents ?? []
        if (eventTypes?.length) events = events.filter(e => eventTypes.includes(e.extendedProps?.type as EventType))
        if (!events.length) return {}

        return events.reduce((acc: Record<string, CalendarEvent[]>, event) => {
            const colors = getEventColors(event)
            const colored = { ...event, backgroundColor: colors.bg, borderColor: colors.border, textColor: colors.text }

            const s = new Date(event.start)
            const e = event.end ? new Date(event.end) : s
            const sDay = new Date(s.getFullYear(), s.getMonth(), s.getDate())
            const eDay = new Date(e.getFullYear(), e.getMonth(), e.getDate())
            const isMulti = (event.extendedProps?.type !== "attendance" && event.extendedProps?.is_multi_day)
                || (event.allDay && sDay.getTime() !== eDay.getTime())

            const days = isMulti ? eachDayOfInterval({ start: sDay, end: eDay }) : [s]
            for (const day of days) {
                const key = day.toDateString()
                if (!acc[key]) acc[key] = []
                acc[key].push(colored)
            }
            return acc
        }, {})
    }, [useCustomData, attendanceEvents, apiEvents, eventTypes])

    // ── Handlers ──

    const navigate = (dir: "prev" | "next" | "today") => {
        if (dir === "today") return setCurrentDate(new Date())
        const fns = {
            month: [addMonths, subMonths],
            week: [addWeeks, subWeeks],
            day: [addDays, subDays],
        }
        const [add, sub] = fns[view]
        setCurrentDate(prev => dir === "next" ? add(prev, 1) : sub(prev, 1))
    }

    const handleEventClick = (event: CalendarEvent) => {
        if (onEventClick) { onEventClick(event); return }
        setSelectedEvent(event)
        setIsEventModalOpen(true)
    }

    const handleDayClick = (date: Date) => {
        onDateClick?.(date)
        const dayEvents = eventsByDate[date.toDateString()] ?? []
        if (!dayEvents.length) return
        setSelectedDate(date)
        setSelectedDateEvents(dayEvents)
        setIsDayEventsModalOpen(true)
    }

    // ── Views ──
    const renderMonthView = () => {
        const dayNames = effectiveWeekStartsOn === 0
            ? ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"]
            : ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]

        const weeks: Date[][] = []
        const days = eachDayOfInterval(dateRange)
        for (let i = 0; i < days.length; i += 7) weeks.push(days.slice(i, i + 7))

        return (
            <div className="border rounded-xl overflow-hidden bg-card">
                <div className="grid grid-cols-7 border-b bg-muted/40">
                    {dayNames.map((d) => (
                        <div key={d} className="py-2 px-1 text-center text-[11px] sm:text-xs font-semibold tracking-wide text-muted-foreground uppercase">
                            <span className="hidden sm:inline">{d}</span>
                            <span className="sm:hidden">{d[0]}</span>
                        </div>
                    ))}
                </div>
                <div className="divide-y divide-border/60">
                    {weeks.map((week, wi) => (
                        <div key={wi} className="grid grid-cols-7 divide-x divide-border/60">
                            {week.map((day) => {
                                const dayEvents = eventsByDate[day.toDateString()] ?? []
                                const inMonth = isSameMonth(day, currentDate)
                                const today = isToday(day)
                                const weekend = day.getDay() === 0 || day.getDay() === 6
                                const dayBg = getDayBgColor(day, eventsByDate, mode)
                                const dotEvents = dayEvents.slice(0, 4)
                                const extraCount = dayEvents.length - dotEvents.length
                                const hasEvents = dayEvents.length > 0

                                return (
                                    <div
                                        key={day.toDateString()}
                                        role="button"
                                        tabIndex={0}
                                        onClick={() => handleDayClick(day)}
                                        onKeyDown={(e) => {
                                            if (e.key === "Enter" || e.key === " ") {
                                                e.preventDefault()
                                                handleDayClick(day)
                                            }
                                        }}
                                        aria-label={`${format(day, "EEEE, MMMM d, yyyy")}${hasEvents ? `, ${dayEvents.length} event${dayEvents.length > 1 ? "s" : ""}` : ""}`}
                                        className={cn(
                                            "group relative min-h-[68px] sm:min-h-24 lg:min-h-28 p-1.5 sm:p-2 transition-colors overflow-hidden flex flex-col text-left w-full cursor-pointer outline-none",
                                            "focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-inset focus-visible:z-10",
                                            !inMonth && "bg-muted text-muted-foreground/60",
                                            inMonth && weekend && !today && "bg-muted/30",
                                            today && "bg-primary/6",
                                            dayBg || (inMonth && "hover:bg-muted/40 active:bg-muted/60"),
                                        )}
                                    >
                                        {/* Date number */}
                                        <div className="flex items-center justify-between mb-1 shrink-0">
                                            <AnimatedNumber value={Number(format(day, "d"))} className={cn(
                                                "flex items-center justify-center size-6 rounded-full text-[10px] sm:text-xs font-mono tabular-nums font-medium leading-none transition-colors",
                                                today && "bg-primary text-primary-foreground font-semibold shadow-sm",
                                                !today && !inMonth && "text-muted-foreground/50",
                                            )} />
                                            {/* Count badge for sm/md where there's no room for a full list */}
                                            {hasEvents && (
                                                <span className="hidden sm:inline lg:hidden text-[10px] font-mono font-medium text-muted-foreground bg-muted rounded-full px-1.5 py-0.5 leading-none tabular-nums">
                                                    <AnimatedNumber value={dayEvents.length} />
                                                </span>
                                            )}
                                        </div>

                                        {/* Mobile: dot row only, pinned to bottom */}
                                        <div className="flex sm:hidden items-center gap-1 mt-auto pb-0.5 flex-wrap">
                                            {dotEvents.map((e, i) => (
                                                <span
                                                    key={i}
                                                    className={cn("size-1.5 rounded-full shrink-0", getColorClass(e.backgroundColor))}
                                                />
                                            ))}
                                            {extraCount > 0 && (
                                                <span className="text-[9px] leading-none font-mono font-medium text-muted-foreground tabular-nums">
                                                    <AnimatedNumber value={extraCount} prefix="+" />
                                                </span>
                                            )}
                                        </div>

                                        {/* Tablet: dot variant rows */}
                                        <div className="hidden sm:flex lg:hidden flex-wrap gap-1 min-h-0 flex-1 overflow-hidden content-start">
                                            {dayEvents.slice(0, 6).map((e, i) => (
                                                <CalendarEventItem key={i} event={e} variant="dot" onClick={handleEventClick} />
                                            ))}
                                        </div>

                                        {/* Desktop: compact list */}
                                        <div className="hidden lg:flex lg:flex-col gap-0.5 min-h-0 flex-1 overflow-hidden">
                                            {dayEvents.slice(0, 3).map((e, i) => (
                                                <CalendarEventItem key={i} event={e} variant="compact" onClick={handleEventClick} />
                                            ))}
                                            {dayEvents.length > 3 && (
                                                <span className="text-[10px] sm:text-[11px] font-mono font-medium text-center text-muted-foreground hover:text-foreground transition-colors px-1.5 pt-0.5 tabular-nums">
                                                    +<AnimatedNumber value={dayEvents.length - 3} /> more
                                                </span>
                                            )}
                                        </div>

                                        {/* Today: thin top accent line instead of relying solely on tint+circle */}
                                        {today && (
                                            <span className="absolute top-0 left-0 right-0 h-0.5 bg-primary" />
                                        )}
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
            <div className="border">
                {/* Mobile: list of days with events */}
                <div className="block sm:hidden divide-y">
                    {days.map((day) => {
                        const dayEvents = eventsByDate[day.toDateString()] ?? []
                        if (!dayEvents.length) return null
                        const today = isToday(day)
                        return (
                            <div key={day.toDateString()} onClick={() => handleDayClick(day)}
                                className={cn("p-3 cursor-pointer hover:bg-muted/50", today && "bg-primary/10")}
                            >
                                <div className="flex items-center justify-between mb-2">
                                    <span className={cn("text-sm font-mono font-semibold tabular-nums", today && "text-primary")}>{format(day, "EEE, MMM d")}</span>
                                    <span className="text-sm font-mono text-muted-foreground tabular-nums">
                                        <AnimatedNumber value={dayEvents.length} /> event{dayEvents.length > 1 ? "s" : ""}
                                    </span>
                                </div>
                                <div className="space-y-2">
                                    {dayEvents.slice(0, 3).map((e, i) => (
                                        <CalendarEventItem key={i} event={e} variant="compact" onClick={handleEventClick} />
                                    ))}
                                    {dayEvents.length > 3 && (
                                        <p className="text-sm font-mono text-muted-foreground text-center tabular-nums">
                                            <AnimatedNumber value={dayEvents.length - 3} prefix="+" /> more
                                        </p>
                                    )}
                                </div>
                            </div>
                        )
                    })}
                </div>

                {/* Desktop: time grid */}
                <div className="hidden sm:block overflow-x-auto">
                    <div className="min-w-full">
                        <div className="grid grid-cols-8 border-b bg-muted/30 min-w-[640px]">
                            <div className="p-2" />
                            {days.map((day) => (
                                <div key={day.toDateString()} className="p-2 text-center min-w-20">
                                    <p className="text-[10px] font-mono text-muted-foreground tabular-nums">{format(day, "EEE")}</p>
                                    <p className={cn("text-sm font-mono font-medium tabular-nums", isToday(day) && "text-primary")}>{format(day, "d")}</p>
                                </div>
                            ))}
                        </div>
                        <div className="divide-y max-h-80 overflow-y-auto min-w-[640px]">
                            {timeSlots.map((hour) => (
                                <div key={hour} className="grid grid-cols-8 divide-x min-h-10">
                                    <div className="p-1 text-[10px] flex items-center justify-center text-muted-foreground bg-muted/20">
                                        <span className="font-mono tabular-nums">{format(new Date().setHours(hour, 0, 0, 0), "h:mm a")}</span>
                                    </div>
                                    {days.map((day) => {
                                        const slotEvents = (eventsByDate[day.toDateString()] ?? []).filter(e =>
                                            e.allDay ? hour === 0 : new Date(e.start).getHours() === hour
                                        )
                                        return (
                                            <div key={`${day.toDateString()}-${hour}`}
                                                onClick={() => handleDayClick(day)}
                                                className="p-1 hover:bg-muted/50 transition-colors cursor-pointer min-w-20"
                                            >
                                                {slotEvents.map((e, i) => (
                                                    <CalendarEventItem key={i} event={e} variant="compact" onClick={handleEventClick} className="mb-0.5 text-sm" />
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
        const dayEvents = eventsByDate[currentDate.toDateString()] ?? []
        const allDayEvents = dayEvents.filter(e => e.allDay)
        const timeSlots = Array.from({ length: 24 }, (_, i) => i)

        return (
            <div className="space-y-4">
                {allDayEvents.length > 0 && (
                    <div className="border rounded-lg p-4">
                        <h3 className="text-sm font-medium mb-3 text-muted-foreground">All Day</h3>
                        <div className="space-y-2">
                            {allDayEvents.map((e, i) => (
                                <CalendarEventItem key={i} event={e} variant="compact" onClick={handleEventClick} />
                            ))}
                        </div>
                    </div>
                )}
                <div className="border rounded-lg overflow-hidden">
                    {timeSlots.map((hour) => {
                        const hourEvents = dayEvents.filter(e => !e.allDay && new Date(e.start).getHours() === hour)
                        return (
                            <div key={hour} className="border-b last:border-b-0 min-h-10 sm:min-h-12 flex">
                                <div className="w-16 sm:w-20 p-2 sm:p-3 text-sm text-muted-foreground bg-muted/20 shrink-0">
                                    {format(new Date().setHours(hour, 0, 0, 0), "h:mm a")}
                                </div>
                                <div className="flex-1 p-2 sm:p-3 space-y-1">
                                    {hourEvents.map((e, i) => (
                                        <DayViewEventItem key={i} event={e} onClick={handleEventClick} />
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
            ? LEGEND_ITEMS.filter(item => eventTypes.includes(item.type as EventType))
            : LEGEND_ITEMS

        return (
            <div className="flex flex-wrap gap-x-3 gap-y-1.5 px-3 py-2 bg-muted/30 rounded-lg">
                {items.map((item, i) => (
                    <div key={`${item.type}-${i}`} className="flex items-center gap-1.5">
                        <div className={cn("size-2 rounded-full shrink-0", getColorClass(item.color))} />
                        <span className="text-muted-foreground text-[11px] sm:text-xs whitespace-nowrap">{item.label}</span>
                    </div>
                ))}
                {eventTypes?.includes("attendance") && ATTENDANCE_LEGEND.map((t) => (
                    <div key={t.value} className="flex items-center gap-1.5">
                        <div className={cn("size-2 rounded-full shrink-0", getColorClass(EVENT_COLORS[t.value]?.bg))} />
                        <span className="text-muted-foreground text-[11px] sm:text-xs whitespace-nowrap">{t.label}</span>
                    </div>
                ))}
            </div>
        )
    }

    const isToday_ = currentDate.toDateString() === new Date().toDateString()

    // ── Loading / error ──

    if (!isLoaded && weekStartsOn === undefined) {
        return (
            <Card className={className}>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2"><Calendar className="w-5 h-5" />{title ?? "Calendar"}</CardTitle>
                    <CardDescription>Loading calendar preferences...</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="space-y-3">
                        <div className="flex items-center justify-between">
                            <Skeleton className="h-8 w-32" />
                            <div className="flex gap-1">{Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="size-8 rounded" />)}</div>
                        </div>
                        <div className="grid grid-cols-7 gap-1">
                            {Array.from({ length: 42 }).map((_, i) => <Skeleton key={i} className={i < 7 ? "h-6 w-full" : "h-10 w-full"} />)}
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
                    <CardTitle className="flex items-center gap-2"><Calendar className="w-5 h-5" />Calendar</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="text-center py-8">
                        <p className="text-muted-foreground mb-4">Failed to load calendar events</p>
                        <Button onClick={() => refetch()} variant="outline">Try Again</Button>
                    </div>
                </CardContent>
            </Card>
        )
    }

    // ── Main render ──

    return (
        <>
            <Card key={`calendar-${effectiveWeekStartsOn}-${view}`} className={className}>
                <CardHeader className="pb-3">
                    <div className="flex flex-col space-y-3 sm:flex-row sm:items-center sm:justify-between sm:space-y-0">
                        <div className="space-y-0.5">
                            <CardTitle className="flex items-center gap-2 text-base">
                                <Calendar className="w-4 h-4" />
                                {title ?? "Calendar"}
                            </CardTitle>
                            <CardDescription className="text-sm">
                                {description ?? "View birthdays, holidays, and scheduled services"}
                            </CardDescription>
                        </div>
                        {(withSettings || withRefresh) && (
                            <div className="flex items-center gap-2">
                                {withSettings && <CalendarSettings />}
                                {withRefresh && (
                                    <Button variant="outline" size="sm" onClick={() => refetch()} disabled={isLoading}>
                                        {isLoading ? "Loading..." : "Refresh"}
                                    </Button>
                                )}
                            </div>
                        )}
                    </div>
                </CardHeader>

                <CardContent className="space-y-3 pt-0">
                    {/* Mobile controls */}
                    <div className="flex flex-col space-y-2 sm:hidden">
                        <h2 className="text-sm font-mono font-semibold text-center tabular-nums">{dateTitle}</h2>
                        <div className="flex items-center justify-center gap-1.5">
                            <ViewToggle view={view} onChange={setView} size="sm" />
                        </div>
                        <div className="flex items-center justify-center gap-1.5">
                            <NavButton dir="prev" onNavigate={navigate} icon={<ChevronLeft className="w-4 h-4" />} />
                            <Button variant={isToday_ ? "default" : "outline"} size="sm" onClick={() => navigate("today")} disabled={isToday_}>
                                Today
                            </Button>
                            <NavButton dir="next" onNavigate={navigate} icon={<ChevronRight className="w-4 h-4" />} />
                        </div>
                    </div>

                    {/* Desktop controls */}
                    <div className="hidden sm:flex sm:items-center justify-between gap-3">
                        <div className="flex items-center gap-1">
                            <NavButton dir="prev" onNavigate={navigate} icon={<ChevronLeft className="w-3.5 h-3.5" />} />
                            <NavButton dir="next" onNavigate={navigate} icon={<ChevronRight className="w-3.5 h-3.5" />} />
                            <Button variant={isToday_ ? "default" : "outline"} size="sm" onClick={() => navigate("today")} disabled={isToday_}>
                                Today
                            </Button>
                        </div>
                        <h2 className="text-sm font-mono font-semibold flex-1 text-center tabular-nums">{dateTitle}</h2>
                        <div className="flex items-center gap-1">
                            <ViewToggle view={view} onChange={setView} />
                        </div>
                    </div>

                    {renderLegend()}
                    {view === "month" && renderMonthView()}
                    {view === "week" && renderWeekView()}
                    {view === "day" && renderDayView()}
                </CardContent>
            </Card>

            <EventDetailModal event={selectedEvent} isOpen={isEventModalOpen} onClose={() => setIsEventModalOpen(false)} />
            <DayEventsModal date={selectedDate} events={selectedDateEvents} isOpen={isDayEventsModalOpen} onClose={() => setIsDayEventsModalOpen(false)} onEventClick={handleEventClick} />
        </>
    )
}

export default DashboardCalendar
