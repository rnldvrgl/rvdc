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
import { Clock } from "lucide-react";

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
					className={cn(
						"w-full cursor-pointer p-3 rounded-lg border hover:bg-muted/50 transition-colors text-left",
						className,
					)}
				>
					<div className="p-3 sm:p-2 rounded text-sm sm:text-base hover:opacity-90 transition-opacity">
						<div className="font-medium flex items-center gap-2">
							<EventIcon event={event} size="md" />
							<span className="truncate text-sm sm:text-base">
								{event.title}
							</span>
						</div>
						<div className="sm:mt-2 mt-1 flex items-center ">
							<Clock className="size-4 md:size-5" />
							<span className="text-sm opacity-90 text-primary-foreground italic ml-1">
								{format(new Date(event.start), "h:mm a")}
								{event.end && event.start !== event.end && (
									<span>
										{" - "}
										{format(new Date(event.end), "h:mm a")}
									</span>
								)}
							</span>
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
