"use client"

import { CalendarEvent } from "@/lib/queries/calendar/useCalendarEvents"
import { format } from "date-fns"
import { Clock, User, UserCog, FileText, LucideIcon } from "lucide-react"

interface EventTooltipContentProps {
    event: CalendarEvent
}

const CUSTOM_EVENT_LABELS: Record<string, string> = {
    meeting: "Meeting",
    maintenance: "Maintenance",
    training: "Training",
    deadline: "Deadline",
    other: "Other",
}

function Row({ icon: Icon, label, text }: { icon: LucideIcon; label?: string; text?: string | null }) {
    if (!text) return null
    return (
        <div className="flex items-center gap-1">
            <Icon className="w-3 h-3 md:w-4 md:h-4 shrink-0" />
            <span>
                {label && <span className="font-semibold">{label}: </span>}
                {text}
            </span>
        </div>
    )
}

export function EventTooltipContent({ event }: EventTooltipContentProps) {
    const ep = event.extendedProps
    const { type } = ep

    const headerLabel = (() => {
        switch (type) {
            case "attendance": return (ep.status || ep.attendance_status || "").replace(/^\w/, (c: string) => c.toUpperCase())
            case "birthday": return "Employee Birthday"
            case "holiday": return ep.holiday_type === "regular" ? "Regular Holiday" : "Special Holiday"
            case "schedule": return "Scheduled Service"
            case "delivery": return "Service Delivery"
            case "leave": return ep.leave_type_display ?? "Leave"
            case "custom_event": return CUSTOM_EVENT_LABELS[ep.event_type ?? "other"] ?? "Other"
            case "half_day": return "Half Day"
            case "shop_closed": return "Shop Closed"
            default: return null
        }
    })()

    const renderBody = () => {
        switch (type) {
            case "attendance":
                return (
                    <>
                        <Row icon={Clock} label="Check In" text={ep.checkIn} />
                        <Row icon={Clock} label="Check Out" text={ep.checkOut} />
                        {(ep.hours ?? 0) > 0 && <Row icon={Clock} label="Hours" text={String(ep.hours)} />}
                    </>
                )
            case "schedule": {
                const techs = ep.technician_names ?? []
                return (
                    <>
                        <Row icon={User} label="Client" text={ep.client_name} />
                        <Row icon={UserCog} label="Technician/s" text={techs.length > 0 ? techs.join(", ") : "Unassigned"} />
                    </>
                )
            }
            case "delivery": {
                const techs = ep.technician_names ?? []
                return (
                    <>
                        <Row icon={User} label="Client" text={ep.client_name} />
                        <Row icon={FileText} label="Service" text={ep.service_type_display} />
                        {techs.length > 0 && <Row icon={UserCog} label="Technician/s" text={techs.join(", ")} />}
                    </>
                )
            }
            case "leave": {
                const isMultiDay = ep.is_multi_day
                const daysCount = ep.days_count
                const duration = isMultiDay
                    ? `${daysCount} Day${daysCount && parseFloat(daysCount) !== 1 ? "s" : ""}`
                    : ep.is_half_day ? "Half Day" : "Full Day"
                const period = isMultiDay && event.end && event.start !== event.end
                    ? `${format(new Date(event.start), "MMM dd")} - ${format(new Date(event.end), "MMM dd, yyyy")}`
                    : undefined
                return (
                    <>
                        <Row icon={Clock} label="Duration" text={duration} />
                        <Row icon={Clock} label="Period" text={period} />
                        <Row icon={FileText} label="Reason" text={ep.reason} />
                    </>
                )
            }
            case "custom_event":
                return (
                    <>
                        <Row icon={FileText} label="Description" text={ep.description} />
                        <Row icon={User} label="Created by" text={ep.created_by} />
                    </>
                )
            case "half_day":
            case "shop_closed":
                return (
                    <>
                        <Row icon={FileText} label="Reason" text={ep.reason} />
                        <Row icon={User} label="Set by" text={ep.created_by} />
                    </>
                )
            default:
                return null
        }
    }

    return (
        <div className="max-w-xs min-w-[200px] text-xs text-primary-foreground space-y-1.5">
            <div className="font-bold text-xs uppercase">{event.title}</div>

            {(headerLabel && headerLabel !== event.title) && (
                <div className="text-xs uppercase">{headerLabel}</div>
            )}

            <div className="space-y-1">{renderBody()}</div>

            <div className="flex items-center gap-1">
                <Clock className="w-3 h-3 md:w-4 md:h-4 shrink-0" />
                <span className="italic">
                    {format(new Date(event.start), "MMM dd, yyyy")}
                    {event.end &&
                        event.start !== event.end &&
                        new Date(event.start).toDateString() !== new Date(event.end).toDateString() && (
                            <span> - {format(new Date(event.end), "MMM dd, yyyy")}</span>
                        )}
                    {!event.allDay && <span> at {format(new Date(event.start), "h:mm a")}</span>}
                </span>
            </div>
        </div>
    )
}
