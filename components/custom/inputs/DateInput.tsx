"use client";

import * as React from "react";
import { CalendarIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Input } from "@/components/ui/input";
import {
	Popover,
	PopoverContent,
	PopoverTrigger,
} from "@/components/ui/popover";

function toDate(value?: string) {
	if (!value) return undefined;
	const d = new Date(value);
	return isNaN(d.getTime()) ? undefined : d;
}

function toISODate(date?: Date) {
	if (!date) return "";
	return date.toISOString().slice(0, 10);
}

function formatDisplay(date?: Date) {
	if (!date) return "";
	return date.toLocaleDateString("en-US", {
		month: "long",
		day: "2-digit",
		year: "numeric",
	});
}

export function DateInput({
	value,
	setValue,
}: {
	value: string;
	setValue: (value: string) => void;
}) {
	const [open, setOpen] = React.useState(false);

	const date = toDate(value);

	return (
		<div className="relative flex gap-2">
			<Input
				readOnly
				value={formatDisplay(date)}
				placeholder="June 01, 2025"
				className="bg-background pr-10 cursor-pointer"
				onClick={() => setOpen(true)}
			/>

			<Popover open={open} onOpenChange={setOpen}>
				<PopoverTrigger asChild>
					<Button
						variant="ghost"
						className="absolute top-1/2 right-2 size-6 -translate-y-1/2"
					>
						<CalendarIcon className="size-3.5" />
						<span className="sr-only">Select date</span>
					</Button>
				</PopoverTrigger>

				<PopoverContent
					className="w-auto overflow-hidden p-0"
					align="end"
					sideOffset={10}
				>
					<Calendar
						mode="single"
						selected={date}
						onSelect={(d) => {
							setValue(toISODate(d));
							setOpen(false);
						}}
						captionLayout="label"
					/>
				</PopoverContent>
			</Popover>
		</div>
	);
}
