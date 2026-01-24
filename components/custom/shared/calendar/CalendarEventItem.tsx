"use client";

import { CalendarEvent } from "@/lib/queries/calendar/useCalendarEvents";
import { EventIcon } from "./EventIcon";
import { EventTooltipContent } from "./EventTooltipContent";
import {
	Tooltip,
	TooltipContent,
	TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils/helpers";

interface CalendarEventItemProps {
	event: CalendarEvent;
	variant?: "full" | "compact" | "dot";
	onClick?: (event: CalendarEvent) => void;
	className?: string;
}

export function CalendarEventItem({
	event,
	variant = "full",
	onClick,
	className,
}: CalendarEventItemProps) {
	const handleClick = (e: React.MouseEvent) => {
		e.stopPropagation();
		onClick?.(event);
	};

	if (variant === "dot") {
		return (
			<Tooltip>
				<TooltipTrigger asChild>
					<button
						onClick={handleClick}
						className={cn(
							"size-2 rounded-full inline-block mr-1 hover:scale-110 transition-transform",
							className
						)}
						style={{
							backgroundColor: event.backgroundColor,
						}}
					/>
				</TooltipTrigger>
				<TooltipContent>
					<EventTooltipContent event={event} />
				</TooltipContent>
			</Tooltip>
		);
	}

	if (variant === "compact") {
		return (
			<Tooltip>
				<TooltipTrigger asChild>
					<button
						onClick={handleClick}
						className={cn(
							"w-full text-left p-2 rounded-lg border hover:bg-muted/50 transition-colors",
							className
						)}
					>
						<div className="flex items-center gap-3">
							<EventIcon event={event} size="md" />
							<span className="font-medium truncate">{event.title}</span>
						</div>
					</button>
				</TooltipTrigger>
				<TooltipContent>
					<EventTooltipContent event={event} />
				</TooltipContent>
			</Tooltip>
		);
	}

	// Full variant
	return (
		<Tooltip>
			<TooltipTrigger asChild>
				<button
					onClick={handleClick}
					className={cn("w-full text-left", className)}
				>
					<div
						className="text-xs px-1.5 py-0.5 rounded truncate hover:opacity-80 transition-opacity flex items-center gap-1"
						style={{
							backgroundColor: event.backgroundColor,
							color: event.textColor,
						}}
					>
						<EventIcon event={event} size="sm" />
						<span className="truncate">{event.title}</span>
					</div>
				</button>
			</TooltipTrigger>
			<TooltipContent>
				<EventTooltipContent event={event} />
			</TooltipContent>
		</Tooltip>
	);
}
