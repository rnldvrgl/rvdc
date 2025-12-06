"use client";

import { ChartWrapper } from "@/components/custom/shared/charts/ChartWrapper";
import { CustomTooltip } from "@/components/custom/shared/charts/CustomTooltip";
import { useChartColors } from "@/lib/hooks/useChartColors";
import {
	Cell,
	Pie,
	PieChart as PieChartComp,
	ResponsiveContainer,
	Tooltip,
} from "recharts";

type LabelFormatter = (label: string) => string;

interface Props<T> {
	data: T[];
	nameKey: keyof T;
	valueKey: keyof T;
	/**
	 * Optional: derive a color from each item; overrides chartColors palette if provided.
	 */
	colorKey?: keyof T;
	getColor?: (item: T, index: number) => string | undefined;
	/**
	 * Optional label formatter; defaults to replacing underscores and capitalizing words.
	 */
	formatLabel?: LabelFormatter;
}

export default function PieChart<T>({
	data,
	nameKey,
	valueKey,
	colorKey,
	getColor,
	formatLabel,
}: Props<T>) {
	const { chartColors } = useChartColors();

	const defaultFormatLabel: LabelFormatter = (label: string) =>
		label.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase());

	const fmt = formatLabel ?? defaultFormatLabel;

	// Helpers to read name/value safely
	const getName = (item: T): string => {
		const raw = item[nameKey] as unknown;
		if (typeof raw === "string") return raw;
		// Fallback: stringify non-string labels
		return String(raw ?? "");
	};

	const getValue = (item: T): number => {
		const raw = item[valueKey] as unknown;
		if (typeof raw === "number") return raw;
		// Try to parse numeric strings
		const num = Number(raw);
		return Number.isFinite(num) ? num : 0;
	};

	const resolveColor = (item: T, index: number): string => {
		if (getColor) {
			const c = getColor(item, index);
			if (c) return c;
		}
		if (colorKey) {
			const raw = item[colorKey] as unknown;
			if (typeof raw === "string" && raw.trim().length > 0) return raw;
		}
		return chartColors[index % chartColors.length];
	};

	// Normalize data to Recharts expected shape
	const chartData = (data ?? []).map((item) => ({
		name: getName(item),
		value: getValue(item),
	}));

	return (
		<ChartWrapper isEmpty={!data || data.length === 0}>
			<ResponsiveContainer width="100%" height={300}>
				<PieChartComp>
					<Tooltip
						content={
							<CustomTooltip
								labelFormatter={(label) =>
									typeof label === "string"
										? fmt(label)
										: String(label)
								}
							/>
						}
					/>
					<Pie
						data={chartData}
						dataKey="value"
						nameKey="name"
						cx="50%"
						cy="50%"
						innerRadius={40}
						outerRadius={100}
						label={({ name = "", percent }) => {
							const formattedName = fmt(name);
							return percent !== undefined
								? `${formattedName} (${(percent * 100).toFixed(0)}%)`
								: formattedName;
						}}
					>
						{(data ?? []).map((item, index) => (
							<Cell
								key={`cell-${index}`}
								fill={resolveColor(item, index)}
							/>
						))}
					</Pie>
				</PieChartComp>
			</ResponsiveContainer>
		</ChartWrapper>
	);
}
