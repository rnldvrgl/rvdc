"use client";

import { ChartWrapper } from "@/components/custom/shared/charts/ChartWrapper";
import { CustomTooltip } from "@/components/custom/shared/charts/CustomTooltip";
import { useChartColors } from "@/lib/hooks/useChartColors";
import { format, parseISO } from "date-fns";
import {
	Area,
	AreaChart,
	CartesianGrid,
	ResponsiveContainer,
	Tooltip,
	XAxis,
	YAxis,
} from "recharts";

interface LineConfig<T> {
	key: keyof T;
	color: string;
	label: string;
	gradientId?: string;
}

interface Props<T extends { date: string }> {
	data: T[];
	lines: LineConfig<T>[];
	showGrid?: boolean;
	height?: number;
}

export default function TimeSeriesChart<T extends { date: string }>({
	data,
	lines,
	showGrid = true,
	height = 280,
}: Props<T>) {
	const { axisColor, gridColor } = useChartColors();

	// Enhanced lines with gradient IDs
	const enhancedLines = lines.map((line, index) => ({
		...line,
		gradientId: line.gradientId || `gradient-${index}`,
	}));

	return (
		<ChartWrapper isEmpty={!data || data.length === 0}>
			<ResponsiveContainer width="100%" height={height}>
				<AreaChart
					data={data}
					margin={{
						top: 10,
						right: 20,
						left: 0,
						bottom: 0,
					}}
				>
					<defs>
						{enhancedLines.map((line) => (
							<linearGradient
								key={line.gradientId}
								id={line.gradientId}
								x1="0"
								y1="0"
								x2="0"
								y2="1"
							>
								<stop
									offset="5%"
									stopColor={line.color}
									stopOpacity={0.2}
								/>
								<stop
									offset="95%"
									stopColor={line.color}
									stopOpacity={0.05}
								/>
							</linearGradient>
						))}
					</defs>
					{showGrid && (
						<CartesianGrid
							strokeDasharray="3 3"
							stroke={gridColor}
							strokeOpacity={0.2}
							vertical={false}
						/>
					)}
					<XAxis
						dataKey="date"
						tickFormatter={(value) =>
							format(parseISO(value), "MMM d")
						}
						tick={{
							fontSize: 11,
							fill: axisColor,
							fontWeight: 400,
						}}
						axisLine={false}
						tickLine={false}
						className="text-xs"
					/>
					<YAxis
						tick={{
							fontSize: 11,
							fill: axisColor,
							fontWeight: 400,
						}}
						axisLine={false}
						tickLine={false}
						className="text-xs"
						tickFormatter={(value) => {
							if (value >= 1000000) {
								return `${(value / 1000000).toFixed(1)}M`;
							} else if (value >= 1000) {
								return `${(value / 1000).toFixed(1)}K`;
							}
							return value.toLocaleString();
						}}
					/>
					<Tooltip
						content={
							<CustomTooltip
								labelFormatter={(label) => {
									if (typeof label === "string") {
										return format(
											parseISO(label),
											"MMM d, yyyy",
										);
									}
									return String(label);
								}}
							/>
						}
						cursor={{
							stroke: axisColor,
							strokeWidth: 1,
							strokeDasharray: "5 5",
							strokeOpacity: 0.3,
						}}
					/>
					{enhancedLines.map((line) => (
						<Area
							key={String(line.key)}
							type="monotone"
							dataKey={String(line.key)}
							stroke={line.color}
							strokeWidth={2}
							fill={`url(#${line.gradientId})`}
							dot={{
								fill: line.color,
								strokeWidth: 2,
								stroke: "#ffffff",
								r: 3,
							}}
							activeDot={{
								r: 5,
								fill: line.color,
								stroke: "#ffffff",
								strokeWidth: 2,
							}}
						/>
					))}
				</AreaChart>
			</ResponsiveContainer>
		</ChartWrapper>
	);
}
