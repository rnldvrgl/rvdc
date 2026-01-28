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
  AlertTriangle,
  Calendar,
  CheckCircle,
  ChevronLeft,
  ChevronRight,
  Clock,
  FileText,
  Plane,
  Thermometer,
  User,
  XCircle,
} from "lucide-react"
import { useMemo, useState } from "react"

import { useCalendarPreferences } from "@/lib/hooks/useCalendarPreferences"
import {
  CalendarEvent,
  useCalendarEvents,
} from "@/lib/queries/calendar/useCalendarEvents"
import { cn } from "@/lib/utils/helpers"
import { CalendarEventItem } from "./CalendarEventItem"
import CalendarSettings from "./CalendarSettings"
import { DayViewEventItem } from "./DayViewEventItem"
import { EventIcon } from "./EventIcon"

// Color utility for event types
const getEventColors = (event: CalendarEvent) => {
  const { type } = event.extendedProps

  switch (type) {
    case "attendance":
      const status =
        event.extendedProps.status || event.extendedProps.attendance_status
      switch (status) {
        case "present":
          return {
            bg: "#10b981",
            border: "#10b981",
            text: "#ffffff",
          }
        case "late":
          return {
            bg: "#f59e0b",
            border: "#f59e0b",
            text: "#ffffff",
          }
        case "absent":
          return {
            bg: "#ef4444",
            border: "#ef4444",
            text: "#ffffff",
          }
        case "sick":
          return {
            bg: "#8b5cf6",
            border: "#8b5cf6",
            text: "#ffffff",
          }
        case "vacation":
          return {
            bg: "#06b6d4",
            border: "#06b6d4",
            text: "#ffffff",
          }
        default:
          return {
            bg: "#6b7280",
            border: "#6b7280",
            text: "#ffffff",
          }
      }
    case "birthday":
      return { bg: "#22c55e", border: "#22c55e", text: "#ffffff" }
    case "holiday":
      const isRegular = event.extendedProps.holiday_type === "regular"
      return isRegular
        ? { bg: "#dc2626", border: "#dc2626", text: "#ffffff" }
        : { bg: "#ea580c", border: "#ea580c", text: "#ffffff" }
    case "leave":
      // Different colors for different leave types
      const leaveType = event.extendedProps.leave_type
      switch (leaveType) {
        case "sick":
          return { bg: "#8b5cf6", border: "#8b5cf6", text: "#ffffff" }
        case "emergency":
          return { bg: "#f59e0b", border: "#f59e0b", text: "#ffffff" }
        default:
          return { bg: "#6366f1", border: "#6366f1", text: "#ffffff" }
      }
    case "schedule":
      return { bg: "#3b82f6", border: "#3b82f6", text: "#ffffff" }
    default:
      return { bg: "#6b7280", border: "#6b7280", text: "#ffffff" }
  }
}

type CalendarView = "month" | "week" | "day"

interface EventDetailModalProps {
  event: CalendarEvent | null
  isOpen: boolean
  onClose: () => void
}

interface DayEventsModalProps {
  date: Date
  events: CalendarEvent[]
  isOpen: boolean
  onClose: () => void
  onEventClick: (event: CalendarEvent) => void
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
                <p className="text-sm text-muted-foreground">
                  {((extendedProps.status || extendedProps.attendance_status)
                    ?.charAt(0)
                    ?.toUpperCase() || "") +
                    ((
                      extendedProps.status || extendedProps.attendance_status
                    )?.slice(1) || "")}
                </p>
              </div>
            </div>
            <div className="space-y-2">
              <div className="text-sm text-muted-foreground">
                {format(new Date(event.start), "EEEE, MMMM dd, yyyy")}
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
            <div className="text-sm text-muted-foreground">
              {format(new Date(event.start), "EEEE, MMMM dd, yyyy")}
            </div>
          </div>
        )

      case "holiday":
        const isRegular = extendedProps.holiday_type === "regular"
        return (
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div
                className={`w-10 h-10 rounded-full ${
                  isRegular
                    ? "bg-red-100 dark:bg-red-900/30"
                    : "bg-orange-100 dark:bg-orange-900/30"
                } flex items-center justify-center`}
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
            <div className="text-sm text-muted-foreground">
              {format(new Date(event.start), "EEEE, MMMM dd, yyyy")}
            </div>
          </div>
        )

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
              <div className="text-sm text-muted-foreground">
                {format(new Date(event.start), "EEEE, MMMM dd, yyyy")}
                {event.end && event.end !== event.start && (
                  <> - {format(new Date(event.end), "EEEE, MMMM dd, yyyy")}</>
                )}
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
              <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                <EventIcon
                  event={event}
                  size="lg"
                />
              </div>
              <div>
                <h3 className="font-semibold">
                  {extendedProps.service_type
                    ?.replace("_", " ")
                    .replace(/\b\w/g, (l) => l.toUpperCase())}{" "}
                  Service
                </h3>
                <p className="text-sm text-muted-foreground">
                  Scheduled Service
                </p>
              </div>
            </div>
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm">
                <User className="w-4 h-4" />
                <span>Client: {extendedProps.client_name}</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <User className="w-4 h-4" />
                Technician/s:{" "}
                {extendedProps.technician_names?.map(
                  (name: string, index: number) => (
                    <span key={index}>
                      {name}
                      {index < extendedProps.technician_names!.length - 1
                        ? ", "
                        : ""}
                    </span>
                  ),
                )}
              </div>
              <div className="flex items-center gap-2 text-sm">
                <Clock className="w-4 h-4" />
                <span>
                  {format(
                    new Date(event.start),
                    "EEEE, MMMM dd, yyyy 'at' hh:mm a",
                  )}
                </span>
              </div>
              {extendedProps.notes && (
                <div className="flex items-start gap-2 text-sm">
                  <FileText className="w-4 h-4 mt-0.5" />
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
                  className="size-3 rounded-full mt-1.5 shrink-0"
                  style={{
                    backgroundColor: event.backgroundColor,
                  }}
                />
                <div className="flex-1 min-w-0">
                  <h4 className="font-medium text-sm">{event.title}</h4>
                  <p className="text-xs text-muted-foreground mt-1 capitalize">
                    {event.extendedProps.type === "birthday" &&
                      "Employee Birthday"}
                    {event.extendedProps.type === "holiday" &&
                      `${event.extendedProps.holiday_type === "regular" ? "Regular" : "Special"} Holiday`}
                    {event.extendedProps.type === "leave" &&
                      `${event.extendedProps.leave_type_display} Leave`}
                    {event.extendedProps.type === "schedule" &&
                      `${event.extendedProps.service_type?.replace("_", " ")} - ${event.extendedProps.client_name}`}
                  </p>
                  {event.extendedProps.type === "schedule" && !event.allDay && (
                    <p className="text-xs text-muted-foreground">
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

interface DashboardCalendarProps {
  className?: string
  mode?: "default" | "attendance"
  attendanceData?: {
    id: string
    employeeName: string
    date: string
    status: "present" | "late" | "absent" | "sick" | "vacation"
    checkIn?: string
    checkOut?: string
    hours: number
  }[]
  useCustomData?: boolean
  title?: string
  description?: string
  height?: string
  weekStartsOn?: 0 | 1 // 0 = Sunday, 1 = Monday
  onEventClick?: (event: CalendarEvent) => void
  onDateClick?: (date: Date) => void
  withSettings?: boolean
}

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
}: DashboardCalendarProps) => {
  const { preferences, isLoaded } = useCalendarPreferences()
  const [currentDate, setCurrentDate] = useState(new Date())
  const [view, setView] = useState<CalendarView>("month")
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null)
  const [isEventModalOpen, setIsEventModalOpen] = useState(false)
  const [selectedDate, setSelectedDate] = useState<Date>(new Date())
  const [selectedDateEvents, setSelectedDateEvents] = useState<CalendarEvent[]>(
    [],
  )
  const [isDayEventsModalOpen, setIsDayEventsModalOpen] = useState(false)

  // Use provided weekStartsOn prop or fall back to user preferences
  const effectiveWeekStartsOn = weekStartsOn ?? preferences.weekStartsOn

  // Calculate date range based on view
  const { dateRange, title: dateTitle } = useMemo(() => {
    const weekStartOptions = {
      weekStartsOn: effectiveWeekStartsOn as 0 | 1,
    }

    switch (view) {
      case "month":
        const monthStart = startOfMonth(currentDate)
        const monthEnd = endOfMonth(currentDate)
        const calendarStart = startOfWeek(monthStart, weekStartOptions)
        const calendarEnd = endOfWeek(monthEnd, weekStartOptions)
        return {
          dateRange: { start: calendarStart, end: calendarEnd },
          title: format(currentDate, "MMMM yyyy"),
        }
      case "week":
        const weekStart = startOfWeek(currentDate, weekStartOptions)
        const weekEnd = endOfWeek(currentDate, weekStartOptions)
        return {
          dateRange: { start: weekStart, end: weekEnd },
          title:
            format(weekStart, "MMM dd") +
            " - " +
            format(weekEnd, "MMM dd, yyyy"),
        }
      case "day":
        return {
          dateRange: { start: currentDate, end: currentDate },
          title: format(currentDate, "EEEE, MMMM dd, yyyy"),
        }
    }
  }, [view, currentDate, effectiveWeekStartsOn])

  // Convert attendance data to calendar events
  const attendanceEvents = useMemo(() => {
    if (!useCustomData || mode !== "attendance" || !attendanceData) {
      return []
    }

    return attendanceData.map((record) => {
      const statusIcons = {
        present: CheckCircle,
        late: AlertTriangle,
        absent: XCircle,
        sick: Thermometer,
        vacation: Plane,
      }

      const IconComponent =
        statusIcons[record.status as keyof typeof statusIcons]

      return {
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
          iconComponent: IconComponent,
        },
      }
    })
  }, [useCustomData, mode, attendanceData])

  const {
    data: apiEvents,
    isLoading,
    error,
    refetch,
  } = useCalendarEvents({
    start: dateRange.start.toISOString().split("T")[0],
    end: dateRange.end.toISOString().split("T")[0],
    enabled: !useCustomData,
  })

  // Group events by date
  const eventsByDate = useMemo(() => {
    // Use either attendance events or API events
    const events = useCustomData ? attendanceEvents : apiEvents || []

    if (!events || events.length === 0) {
      return {}
    }

    const grouped = events.reduce(
      (acc: Record<string, CalendarEvent[]>, event) => {
        const dateKey = new Date(event.start).toDateString()
        if (!acc[dateKey]) {
          acc[dateKey] = []
        }
        // Add colors to each event
        const colors = getEventColors(event)
        const eventWithColors = {
          ...event,
          backgroundColor: colors.bg,
          borderColor: colors.border,
          textColor: colors.text,
        }
        acc[dateKey].push(eventWithColors)
        return acc
      },
      {},
    )

    return grouped
  }, [useCustomData, attendanceEvents, apiEvents])

  // Don't render calendar until preferences are loaded (unless weekStartsOn is explicitly provided)
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
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
          </div>
        </CardContent>
      </Card>
    )
  }

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
    if (onDateClick) {
      onDateClick(date)
    }

    const dayEvents = eventsByDate[date.toDateString()] || []
    if (dayEvents.length === 0) return

    setSelectedDate(date)
    setSelectedDateEvents(dayEvents)
    setIsDayEventsModalOpen(true)
  }

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
        {/* Day headers */}
        <div className="grid grid-cols-7 border-b bg-muted/30">
          {dayNames.map((day) => (
            <div
              key={day}
              className="p-2 sm:p-3 text-center text-sm sm:text-base font-medium text-muted-foreground"
            >
              <span className="hidden sm:inline">{day}</span>
              <span className="sm:hidden text-sm">{day[0]}</span>
            </div>
          ))}
        </div>

        {/* Calendar grid */}
        <div className="divide-y">
          {weeks.map((week, weekIndex) => (
            <div
              key={weekIndex}
              className="grid grid-cols-7 divide-x min-h-20 sm:min-h-24 md:min-h-28 lg:min-h-32"
            >
              {week.map((day) => {
                const dayEvents = eventsByDate[day.toDateString()] || []
                const isCurrentMonth = isSameMonth(day, currentDate)
                const isTodayDate = isToday(day)

                return (
                  <div
                    key={day.toDateString()}
                    className={cn(
                      "p-2 sm:p-3 cursor-pointer hover:bg-muted/50 transition-colors overflow-hidden",
                      !isCurrentMonth && "bg-muted/20 text-muted-foreground",
                      isTodayDate && "bg-primary/10",
                    )}
                    onClick={() => handleDayClick(day)}
                  >
                    <div className="flex items-center justify-between mb-1 sm:mb-2">
                      <span
                        className={cn(
                          "text-base sm:text-lg font-medium leading-none",
                          isTodayDate && "text-primary font-semibold",
                        )}
                      >
                        {format(day, "d")}
                      </span>
                      {dayEvents.length > 0 && (
                        <div className="flex items-center gap-1">
                          <div className="size-2 sm:size-2.5 rounded-full bg-primary"></div>
                          {dayEvents.length > 1 && (
                            <span className="text-sm sm:text-xs text-muted-foreground">
                              {dayEvents.length}
                            </span>
                          )}
                        </div>
                      )}
                    </div>

                    <div className="space-y-1">
                      {/* Desktop: Show event titles */}
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
                          <div className="text-xs text-muted-foreground text-center mt-2">
                            +{dayEvents.length - 2} more
                          </div>
                        )}
                      </div>

                      {/* Tablet: Show compact events */}
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

                      {/* Mobile: Just the indicator handled above */}
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
    const timeSlots = []
    for (let hour = 0; hour < 24; hour++) {
      timeSlots.push(hour)
    }

    return (
      <div className="border rounded-lg">
        {/* Mobile: Show simplified list view */}
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
                    "p-4 cursor-pointer hover:bg-muted/50",
                    isTodayDate && "bg-primary/10",
                  )}
                  onClick={() => handleDayClick(day)}
                >
                  <div className="flex items-center justify-between mb-3">
                    <div
                      className={cn(
                        "text-base font-semibold",
                        isTodayDate && "text-primary",
                      )}
                    >
                      {format(day, "EEE, MMM d")}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {dayEvents.length} event
                      {dayEvents.length > 1 ? "s" : ""}
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
                      <div className="text-sm text-muted-foreground text-center mt-3">
                        +{dayEvents.length - 3} more
                      </div>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* Desktop/Tablet: Show grid view */}
        <div className="hidden sm:block overflow-x-auto">
          <div className="min-w-full">
            {/* Day headers */}
            <div className="grid grid-cols-8 border-b bg-muted/30 min-w-[640px]">
              <div className="p-2 sm:p-3"></div>
              {days.map((day) => (
                <div
                  key={day.toDateString()}
                  className="p-2 sm:p-3 text-center min-w-20"
                >
                  <div className="text-xs text-muted-foreground">
                    {format(day, "EEE")}
                  </div>
                  <div
                    className={cn(
                      "text-sm sm:text-lg font-medium",
                      isToday(day) && "text-primary",
                    )}
                  >
                    {format(day, "d")}
                  </div>
                </div>
              ))}
            </div>

            {/* Time grid */}
            <div className="divide-y max-h-80 sm:max-h-96 overflow-y-auto min-w-[640px]">
              {timeSlots.map((hour) => (
                <div
                  key={hour}
                  className="grid grid-cols-8 divide-x min-h-10 sm:min-h-12"
                >
                  <div className="p-2 text-xs flex items-center justify-center text-muted-foreground text-center bg-muted/20">
                    {format(new Date().setHours(hour, 0, 0, 0), "h:mm a")}
                  </div>
                  {days.map((day) => {
                    const dayEvents =
                      eventsByDate[day.toDateString()]?.filter((event) => {
                        if (event.allDay) return hour === 0 // Show all-day events in first slot (midnight)
                        const eventHour = new Date(event.start).getHours()
                        return eventHour === hour
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
                            className="mb-0.5 text-xs"
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
    const timeSlots = []
    for (let hour = 0; hour < 24; hour++) {
      timeSlots.push(hour)
    }

    return (
      <div className="space-y-4">
        {/* All-day events */}
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

        {/* Timed events */}
        <div className="border rounded-lg overflow-hidden">
          {timeSlots.map((hour) => {
            const hourEvents = dayEvents.filter((event) => {
              if (event.allDay) return false
              return new Date(event.start).getHours() === hour
            })

            return (
              <div
                key={hour}
                className="border-b last:border-b-0 min-h-16 sm:min-h-20 flex"
              >
                <div className="w-20 sm:w-24 p-3 sm:p-4 text-sm text-muted-foreground bg-muted/20 shrink-0">
                  {format(new Date().setHours(hour, 0, 0, 0), "h:mm a")}
                </div>
                <div className="flex-1 p-3 sm:p-4 space-y-2">
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

  return (
    <>
      <Card
        key={`calendar-${effectiveWeekStartsOn}-${view}`}
        className={className}
      >
        <CardHeader>
          <div className="flex flex-col space-y-4 sm:flex-row sm:items-center sm:justify-between sm:space-y-0">
            <div className="space-y-2">
              <CardTitle className="flex items-center gap-2 text-xl">
                <Calendar className="w-6 h-6" />
                {title || "Calendar"}
              </CardTitle>
              <CardDescription className="text-base">
                {description ||
                  "View birthdays, holidays, and scheduled services"}
              </CardDescription>
            </div>
            <div className="flex flex-col md:flex-row items-center justify-center md:justify-end gap-2">
              {withSettings && <CalendarSettings />}
              <Button
                variant="outline"
                size="sm"
                onClick={() => refetch()}
                disabled={isLoading}
                className="text-sm"
              >
                {isLoading ? "Loading..." : "Refresh"}
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Controls */}
          <div className="space-y-4">
            {/* Mobile: Stack everything vertically */}
            <div className="flex flex-col space-y-3 sm:hidden">
              {/* Title */}
              <h2 className="text-lg font-semibold text-center px-2">
                {dateTitle}
              </h2>

              {/* View buttons - prioritize on mobile */}
              <div className="flex items-center justify-center gap-2">
                {["month", "week", "day"].map((v) => (
                  <Button
                    key={v}
                    variant={view === v ? "default" : "outline"}
                    size="sm"
                    onClick={() => setView(v as CalendarView)}
                    className="capitalize text-base"
                  >
                    {v}
                  </Button>
                ))}
              </div>

              {/* Navigation */}
              <div className="flex items-center justify-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleNavigation("prev")}
                >
                  <ChevronLeft className="w-5 h-5" />
                </Button>
                <Button
                  variant={`${currentDate.toDateString() === new Date().toDateString() ? "default" : "outline"}`}
                  size="default"
                  onClick={() => handleNavigation("today")}
                  disabled={
                    currentDate.toDateString() === new Date().toDateString()
                  }
                  className="text-base px-6 py-2 h-10"
                >
                  Today
                </Button>
                <Button
                  variant="outline"
                  size="default"
                  onClick={() => handleNavigation("next")}
                  className="px-4 py-2 h-10"
                >
                  <ChevronRight className="w-5 h-5" />
                </Button>
              </div>
            </div>

            {/* Desktop: Horizontal layout */}
            <div className="hidden sm:flex sm:items-center justify-between gap-4">
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleNavigation("prev")}
                >
                  <ChevronLeft className="w-4 h-4" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleNavigation("next")}
                >
                  <ChevronRight className="w-4 h-4" />
                </Button>
                <Button
                  variant={`${currentDate.toDateString() === new Date().toDateString() ? "default" : "outline"}`}
                  size="sm"
                  onClick={() => handleNavigation("today")}
                  disabled={
                    currentDate.toDateString() === new Date().toDateString()
                  }
                >
                  Today
                </Button>
              </div>

              <h2 className="text-lg font-semibold text-center flex-1">
                {dateTitle}
              </h2>

              <div className="flex items-center gap-1">
                {["month", "week", "day"].map((v) => (
                  <Button
                    key={v}
                    variant={view === v ? "default" : "outline"}
                    size="sm"
                    onClick={() => setView(v as CalendarView)}
                    className="capitalize"
                  >
                    {v}
                  </Button>
                ))}
              </div>
            </div>
          </div>

          {/* Legend */}
          <div className="grid grid-cols-2 sm:flex sm:flex-wrap gap-3 sm:gap-4 p-4 bg-muted/30 rounded-lg">
            <div className="flex items-center gap-2">
              <div className="size-3 rounded bg-green-500" />
              <span className="text-muted-foreground text-sm">Birthdays</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="size-3 rounded bg-red-500" />
              <span className="text-muted-foreground text-sm">Holidays</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="size-3 rounded bg-orange-500" />
              <span className="text-muted-foreground text-sm">Special</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="size-3 rounded bg-blue-500" />
              <span className="text-muted-foreground text-sm">Services</span>
            </div>
          </div>

          {/* Calendar Views */}
          {view === "month" && renderMonthView()}
          {view === "week" && renderWeekView()}
          {view === "day" && renderDayView()}
        </CardContent>
      </Card>

      {/* Modals */}
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
