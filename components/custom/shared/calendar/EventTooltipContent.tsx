"use client";

import { CalendarEvent } from "@/lib/queries/calendar/useCalendarEvents";
import { format } from "date-fns";

interface EventTooltipContentProps {
	event: CalendarEvent;
}

export function EventTooltipContent({ event }: EventTooltipContentProps) {
	const { type } = event.extendedProps;

	const renderAttendanceDetails = () => (
		<div className="text-xs text-muted-foreground mt-1">
			Status: {event.extendedProps.status || event.extendedProps.attendance_status}
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
	);

	const renderBirthdayDetails = () => (
		<div className="text-xs text-muted-foreground mt-1">
			Employee Birthday
		</div>
	);

	const renderHolidayDetails = () => (
		<div className="text-xs text-muted-foreground mt-1">
			{event.extendedProps.holiday_type === "regular"
				? "Regular Holiday"
				: "Special Holiday"}
		</div>
	);

	const renderScheduleDetails = () => (
		<div className="text-xs text-muted-foreground mt-1">
			{event.extendedProps.service_type
				?.replace("_", " ")
				.replace(/\b\w/g, (l: string) => l.toUpperCase())}{" "}
			Service
			{event.extendedProps.client_name && (
				<div>Client: {event.extendedProps.client_name}</div>
			)}
			{event.extendedProps.technician_name && (
				<div>Technician: {event.extendedProps.technician_name}</div>
			)}
		</div>
	);

	return (
		<div className="max-w-xs">
			<div className="font-medium">{event.title}</div>

			{type === "attendance" && renderAttendanceDetails()}
			{type === "birthday" && renderBirthdayDetails()}
			{type === "holiday" && renderHolidayDetails()}
			{type === "schedule" && renderScheduleDetails()}

			<div className="text-xs text-muted-foreground mt-1">
				{format(new Date(event.start), "MMM dd, yyyy")}
				{!event.allDay && (
					<span> at {format(new Date(event.start), "h:mm a")}</span>
				)}
			</div>
		</div>
	);
}
