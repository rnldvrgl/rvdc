"use client"
import {
    Tooltip,
    TooltipContent,
    TooltipTrigger,
} from "@/components/ui/tooltip"
import { CalendarEvent } from "@/lib/queries/calendar/useCalendarEvents"
import { cn } from "@/lib/utils/helpers"
import { EventIcon } from "./EventIcon"
import { EventTooltipContent } from "./EventTooltipContent"

interface CalendarEventItemProps {
    event: CalendarEvent
    variant?: "full" | "compact" | "dot"
    onClick?: (event: CalendarEvent) => void
    className?: string
}

export function CalendarEventItem({
    event,
    variant = "full",
    onClick,
    className,
}: CalendarEventItemProps) {
    const handleClick = (e: React.MouseEvent) => {
        e.stopPropagation()
        onClick?.(event)
    }

    if (variant === "dot") {
        return (
            <Tooltip>
                <TooltipTrigger asChild>
                    <button
                        type="button"
                        onClick={handleClick}
                        className={cn(
                            "size-4 rounded-full inline-flex items-center justify-center mr-1 hover:scale-110 active:scale-95 transition-transform",
                            className,
                        )}
                        style={{ backgroundColor: `${event.backgroundColor}26` }}
                    >
                        <EventIcon event={event} size="xs" />
                        <span className="sr-only">{event.title}</span>
                    </button>
                </TooltipTrigger>
                <TooltipContent>
                    <EventTooltipContent event={event} />
                </TooltipContent>
            </Tooltip>
        )
    }

    if (variant === "compact") {
        return (
            <Tooltip>
                <TooltipTrigger asChild>
                    <button
                        type="button"
                        onClick={handleClick}
                        className={cn(
                            "group w-full flex items-center gap-1.5 rounded-lg cursor-pointer py-1 pl-1.5 pr-2 border border-border ",
                            "text-left transition-all duration-150",
                            "hover:bg-muted active:scale-[0.98]",
                            className,
                        )}
                    >
                        <span
                            className="flex items-center justify-center size-4 rounded-[5px] shrink-0 transition-transform group-hover:scale-105"
                            style={{ backgroundColor: `${event.backgroundColor}1f` }}
                        >
                            <EventIcon event={event} size="xs" />
                        </span>
                        <span className="truncate text-[11.5px] font-medium leading-tight text-foreground/80 group-hover:text-foreground transition-colors">
                            {event.title}
                        </span>
                    </button>
                </TooltipTrigger>
                <TooltipContent>
                    <EventTooltipContent event={event} />
                </TooltipContent>
            </Tooltip>
        )
    }

    // Full variant — icon sits directly on the event's solid background color,
    // so force it to the text color for guaranteed contrast.
    return (
        <Tooltip>
            <TooltipTrigger asChild>
                <button
                    type="button"
                    onClick={handleClick}
                    className={cn("w-full text-left", className)}
                >
                    <div
                        className="text-sm px-2 py-1.5 rounded-md truncate hover:opacity-85 active:opacity-70 transition-opacity flex items-center gap-1.5 shadow-sm"
                        style={{
                            backgroundColor: event.backgroundColor,
                            color: event.textColor,
                        }}
                    >
                        <EventIcon event={event} size="sm" forceColorClassName="text-current" />
                        <span className="truncate text-sm font-medium">{event.title}</span>
                    </div>
                </button>
            </TooltipTrigger>
            <TooltipContent>
                <EventTooltipContent event={event} />
            </TooltipContent>
        </Tooltip>
    )
}
