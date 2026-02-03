"use client";

import * as React from "react";
import { Check, ChevronsUpDown, X } from "lucide-react";
import { cn } from "@/lib/utils/helpers";
import { Button } from "@/components/ui/button";
import {
	Command,
	CommandEmpty,
	CommandGroup,
	CommandInput,
	CommandItem,
} from "@/components/ui/command";
import {
	Popover,
	PopoverContent,
	PopoverTrigger,
} from "@/components/ui/popover";
import { Badge } from "@/components/ui/badge";

export interface MultiSelectOption {
	value: string;
	label: string;
}

interface MultiSelectProps {
	options: MultiSelectOption[];
	selected: string[];
	onChange: (selected: string[]) => void;
	placeholder?: string;
	disabled?: boolean;
	className?: string;
}

export function MultiSelect({
	options,
	selected,
	onChange,
	placeholder = "Select items...",
	disabled = false,
	className,
}: MultiSelectProps) {
	const [open, setOpen] = React.useState(false);

	const handleSelect = (value: string) => {
		const newSelected = selected.includes(value)
			? selected.filter((item) => item !== value)
			: [...selected, value];
		onChange(newSelected);
	};

	const handleRemove = (value: string, e: React.MouseEvent) => {
		e.stopPropagation();
		onChange(selected.filter((item) => item !== value));
	};

	const selectedLabels = selected
		.map((value) => options.find((opt) => opt.value === value)?.label)
		.filter(Boolean);

	return (
		<Popover open={open} onOpenChange={setOpen}>
			<PopoverTrigger asChild>
				<Button
					variant="outline"
					role="combobox"
					aria-expanded={open}
					className={cn(
						"w-full justify-between",
						!selected.length && "text-muted-foreground",
						className,
					)}
					disabled={disabled}
				>
					<div className="flex gap-1 flex-wrap">
						{selected.length === 0 ? (
							<span>{placeholder}</span>
						) : (
							selectedLabels.map((label) => (
								<Badge
									variant="secondary"
									key={label}
									className="mr-1 cursor-pointer"
								>
									{label}
									<span
										className="ml-1 ring-offset-background rounded-full outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 inline-flex items-center"
										onClick={(e) => {
											e.stopPropagation();
											const option = options.find(
												(opt) => opt.label === label,
											);
											if (option) {
												handleRemove(option.value, e);
											}
										}}
										onKeyDown={(e) => {
											if (e.key === "Enter") {
												e.stopPropagation();
												const option = options.find(
													(opt) =>
														opt.label === label,
												);
												if (option) {
													e.preventDefault();
													onChange(
														selected.filter(
															(item) =>
																item !==
																option.value,
														),
													);
												}
											}
										}}
										role="button"
										tabIndex={0}
										aria-label={`Remove ${label}`}
									>
										<X className="h-3 w-3 text-muted-foreground hover:text-foreground" />
									</span>
								</Badge>
							))
						)}
					</div>
					<ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
				</Button>
			</PopoverTrigger>
			<PopoverContent className="w-full p-0" align="start">
				<Command>
					<CommandInput placeholder="Search..." />
					<CommandEmpty>No results found.</CommandEmpty>
					<CommandGroup className="max-h-64 overflow-auto">
						{options.map((option) => (
							<CommandItem
								key={option.value}
								onSelect={() => handleSelect(option.value)}
							>
								<Check
									className={cn(
										"mr-2 h-4 w-4",
										selected.includes(option.value)
											? "opacity-100"
											: "opacity-0",
									)}
								/>
								{option.label}
							</CommandItem>
						))}
					</CommandGroup>
				</Command>
			</PopoverContent>
		</Popover>
	);
}
