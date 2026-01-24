"use client";

import { CalendarEvent } from "@/lib/queries/calendar/useCalendarEvents";
import { EventIcon } from "./EventIcon";
import { EventTooltipContent } from "./EventTooltipContent";
import {
	Tooltip,
	TooltipContent,
	TooltipTrigger,
} from "@/components/ui/tooltip";
import { format } from "date-fns";
import { cn } from "@/lib/utils/helpers";

interface DayViewEventItemProps {
	event: CalendarEvent;
	onClick?: (event: CalendarEvent) => void;
	className?: string;
}

export function DayViewEventItem({
	event,
	onClick,
	className,
}: DayViewEventItemProps) {
	const handleClick = () => {
		onClick?.(event);
	};

	return (
		<Tooltip>
			<TooltipTrigger asChild>
				<button
					onClick={handleClick}
					className={cn("w-full text-left", className)}
				>
					<div
						className="p-2 rounded text-sm hover:opacity-90 transition-opacity"
						style={{
							backgroundColor: event.backgroundColor,
							color: event.textColor,
						}}
					>
						<div className="font-medium flex items-center gap-2">
							<EventIcon event={event} size="md" />
							<span className="truncate">{event.title}</span>
						</div>
						<div className="text-xs opacity-90 mt-1">
							{format(new Date(event.start), "h:mm a")}
							{event.end && event.start !== event.end && (
								<span>
									{" - "}
									{format(new Date(event.end), "h:mm a")}
								</span>
							)}
						</div>
					</div>
				</button>
			</TooltipTrigger>
			<TooltipContent>
				<EventTooltipContent event={event} />
			</TooltipContent>
		</Tooltip>
	);
}
