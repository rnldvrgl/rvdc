"use client"

import { CalendarEvent } from "@/lib/queries/calendar/useCalendarEvents"
import { format } from "date-fns"
import { Clock, User, UserCog } from "lucide-react"
import { EventIcon } from "./EventIcon"

interface EventTooltipContentProps {
  event: CalendarEvent
}

export function EventTooltipContent({ event }: EventTooltipContentProps) {
  const { type } = event.extendedProps

  const renderAttendanceDetails = () => (
    <div className="text-xs text-primary-foreground mt-1">
      Status:{" "}
      {event.extendedProps.status || event.extendedProps.attendance_status}
      {event.extendedProps.checkIn && (
        <div>Check In: {event.extendedProps.checkIn}</div>
      )}
      {event.extendedProps.checkOut && (
        <div>Check Out: {event.extendedProps.checkOut}</div>
      )}
      {event.extendedProps.hours && (
        <div>Hours: {event.extendedProps.hours}</div>
      )}
    </div>
  )

  const renderBirthdayDetails = () => (
    <div className="text-xs text-primary-foreground mt-1">
      Employee Birthday
    </div>
  )

  const renderHolidayDetails = () => (
    <div className="text-xs text-primary-foreground mt-1 flex items-center">
      <EventIcon
        event={event}
        size="md"
        className="text-white! dark:text-white!"
      />
      <span className="ml-1">
        {event.extendedProps.holiday_type === "regular"
          ? "Regular Holiday"
          : "Special Holiday"}
      </span>
    </div>
  )

  const renderScheduleDetails = () => (
    <div className="text-xs text-primary-foreground mt-1">
      <div className="flex items-center">
        <User className="size-3 md:size-4" />
        <span className="ml-1">
          <span className="font-semibold">Client: </span>
          {event.extendedProps.client_name}
        </span>
      </div>
      <div className="flex items-center">
        <UserCog className="size-3 md:size-4" />
        <span className="ml-1">
          {event.extendedProps.technician_names && (
            <div>
              <span className="font-semibold">Technician/s: </span>
              {event.extendedProps.technician_names?.map(
                (name: string, index: number) => (
                  <span key={index}>
                    {name}
                    {index < event.extendedProps.technician_names!.length - 1
                      ? ", "
                      : ""}
                  </span>
                ),
              )}
            </div>
          )}
        </span>
      </div>
    </div>
  )

  const renderLeaveDetails = () => {
    const isMultiDay = event.extendedProps.is_multi_day
    const daysCount = event.extendedProps.days_count

    return (
      <div className="text-xs text-primary-foreground mt-1">
        <div>
          <span className="font-semibold">Type: </span>
          {event.extendedProps.leave_type_display}
        </div>
        <div>
          <span className="font-semibold">Duration: </span>
          {isMultiDay
            ? `${daysCount} Day${daysCount && parseFloat(daysCount) !== 1 ? "s" : ""}`
            : event.extendedProps.is_half_day
              ? "Half Day"
              : "Full Day"}
        </div>
        {isMultiDay && event.end && event.start !== event.end && (
          <div>
            <span className="font-semibold">Period: </span>
            {format(new Date(event.start), "MMM dd")} -{" "}
            {format(new Date(event.end), "MMM dd, yyyy")}
          </div>
        )}
        {event.extendedProps.reason && (
          <div>
            <span className="font-semibold">Reason: </span>
            {event.extendedProps.reason}
          </div>
        )}
      </div>
    )
  }

  const renderDeliveryDetails = () => (
    <div className="text-xs text-primary-foreground mt-1">
      <div className="flex items-center">
        <User className="size-3 md:size-4" />
        <span className="ml-1">
          <span className="font-semibold">Client: </span>
          {event.extendedProps.client_name}
        </span>
      </div>
      {event.extendedProps.service_type_display && (
        <div>
          <span className="font-semibold">Service: </span>
          {event.extendedProps.service_type_display}
        </div>
      )}
      {event.extendedProps.technician_names &&
        event.extendedProps.technician_names.length > 0 && (
          <div className="flex items-center">
            <UserCog className="size-3 md:size-4" />
            <span className="ml-1">
              <span className="font-semibold">Technician/s: </span>
              {event.extendedProps.technician_names?.join(", ")}
            </span>
          </div>
        )}
    </div>
  )

  const renderCustomEventDetails = () => {
    const eventTypeLabels: Record<string, string> = {
      meeting: "Meeting",
      maintenance: "Maintenance",
      training: "Training",
      deadline: "Deadline",
      other: "Other",
    }
    const eventType = event.extendedProps.event_type || "other"

    return (
      <div className="text-xs text-primary-foreground mt-1">
        <div>
          <span className="font-semibold">Type: </span>
          {eventTypeLabels[eventType] || "Other"}
        </div>
        {event.extendedProps.description && (
          <div>
            <span className="font-semibold">Description: </span>
            {event.extendedProps.description}
          </div>
        )}
        {event.extendedProps.created_by && (
          <div>
            <span className="font-semibold">Created by: </span>
            {event.extendedProps.created_by}
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="max-w-xs">
      <div className="font-medium">{event.title}</div>

      {type === "attendance" && renderAttendanceDetails()}
      {type === "birthday" && renderBirthdayDetails()}
      {type === "holiday" && renderHolidayDetails()}
      {type === "schedule" && renderScheduleDetails()}
      {type === "delivery" && renderDeliveryDetails()}
      {type === "leave" && renderLeaveDetails()}
      {type === "custom_event" && renderCustomEventDetails()}

      <div className="mt-1 flex items-center ">
        <Clock className="size-3 md:size-4" />
        <span className="text-xs text-primary-foreground italic ml-1">
          {format(new Date(event.start), "MMM dd, yyyy")}
          {event.end &&
            event.start !== event.end &&
            new Date(event.start).toDateString() !==
              new Date(event.end).toDateString() && (
              <span> - {format(new Date(event.end), "MMM dd, yyyy")}</span>
            )}
          {!event.allDay && (
            <span> at {format(new Date(event.start), "h:mm a")}</span>
          )}
        </span>
      </div>
    </div>
  )
}
