"use client";

import { ComboBox } from "@/components/custom/inputs/ComboBox"; // adjust path if needed
import {
	FormControl,
	FormDescription,
	FormItem,
	FormLabel,
	FormMessage,
} from "@/components/ui/form";
import { cn } from "@/lib/utils/helpers";

type TimePickerProps = {
	field: {
		value: string | undefined;
		onChange: (value: string | undefined) => void;
	};
	label?: string;
	description?: string;
	placeholder?: string;
	className?: string;
	interval?: number;
	format?: "24" | "12";
	disabled?: boolean;
};

const pad = (num: number) => String(num).padStart(2, "0");

const formatTime = (h: number, m: number, format: "24" | "12") => {
	const minute = pad(m);
	if (format === "24") {
		return `${pad(h)}:${minute}:00`;
	} else {
		const suffix = h >= 12 ? "PM" : "AM";
		const hour12 = h % 12 === 0 ? 12 : h % 12;
		return `${pad(hour12)}:${minute} ${suffix}`;
	}
};

const parseTimeValue = (h: number, m: number) => `${pad(h)}:${pad(m)}:00`;

const generateTimeOptions = (interval: number, format: "24" | "12") => {
	const options = [];
	for (let h = 0; h < 24; h++) {
		for (let m = 0; m < 60; m += interval) {
			options.push({
				value: parseTimeValue(h, m),
				label: formatTime(h, m, format),
			});
		}
	}
	return options;
};

const TimePicker = ({
	field,
	label = "Select time",
	description,
	placeholder = "Pick a time",
	className,
	disabled,
	interval = 30,
	format = "24",
}: TimePickerProps) => {
	const options = generateTimeOptions(interval, format);

	return (
		<FormItem className={cn("flex flex-col", className)}>
			{label && <FormLabel>{label}</FormLabel>}
			<FormControl>
				<ComboBox
					disabled={disabled}
					options={options}
					value={field.value ?? null}
					onChange={(val) =>
						field.onChange(val as string | undefined)
					}
					placeholder={placeholder}
					searchPlaceholder="Search time..."
				/>
			</FormControl>
			{description && <FormDescription>{description}</FormDescription>}
			<FormMessage />
		</FormItem>
	);
};

export default TimePicker;
