"use client"

import { useChartColors } from "@/lib/hooks/useChartColors"
import { format, isValid, parseISO } from "date-fns"
import {
    Bar,
    Cell,
    BarChart as RechartsBarChart,
    ResponsiveContainer,
    Tooltip,
    XAxis,
    YAxis,
} from "recharts"
import { ChartWrapper } from "./ChartWrapper"
import { CustomTooltip } from "./CustomTooltip"

interface Props<T> {
    data: T[]
    xKey: keyof T
    yKey: keyof T
    color?: string
    isTimeSeries?: boolean
    height?: number
    gradientIntensity?: number
}

export default function BarChart<T>({
    data,
    xKey,
    yKey,
    color,
    isTimeSeries = false,
    height = 280,
    gradientIntensity = 0.5,
}: Props<T>) {
    const { axisColor } = useChartColors()
    const barColor = color ?? "var(--chart-1)"
    const gradientId = `barGradient-${Math.random().toString(36).substr(2, 9)}`

    const getLabelFormatted = (label: string | number) => {
        if (typeof label === "string" && isTimeSeries && isValid(parseISO(label))) {
            return format(parseISO(label), "MMM d, yyyy")
        }
        return String(label)
            .replace(/_/g, " ")
            .replace(/\b\w/g, (l) => l.toUpperCase())
    }

    const getTickFormatted = (value: string | number): string => {
        if (typeof value === "string" && isTimeSeries && isValid(parseISO(value))) {
            return format(parseISO(value), "MMM d")
        }

        const str = String(value)
        if (str.length > 12) {
            return str.substring(0, 12) + "..."
        }
        return str
    }

    return (
        <ChartWrapper isEmpty={!data.length}>
            <ResponsiveContainer
                width="100%"
                height={height}
            >
                <RechartsBarChart
                    data={data}
                    margin={{
                        top: 10,
                        right: 20,
                        left: 10,
                        bottom: 5,
                    }}
                >
                    <defs>
                        <linearGradient
                            id={gradientId}
                            x1="0"
                            y1="0"
                            x2="0"
                            y2="1"
                        >
                            <stop
                                offset="0%"
                                stopColor={barColor}
                                stopOpacity={gradientIntensity}
                            />
                            <stop
                                offset="100%"
                                stopColor={barColor}
                                stopOpacity={0.1}
                            />
                        </linearGradient>
                    </defs>
                    <XAxis
                        dataKey={String(xKey)}
                        tickFormatter={getTickFormatted}
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
                                return `${(value / 1000000).toFixed(1)}M`
                            } else if (value >= 1000) {
                                return `${(value / 1000).toFixed(1)}K`
                            }
                            return value.toLocaleString()
                        }}
                    />
                    <Tooltip
                        content={<CustomTooltip labelFormatter={getLabelFormatted} />}
                        cursor={{
                            fill: barColor,
                            fillOpacity: 0.05,
                            stroke: "none",
                        }}
                    />
                    <Bar
                        dataKey={String(yKey)}
                        fill={`url(#${gradientId})`}
                        radius={[4, 4, 0, 0]}
                    >
                        {data.map((entry, index) => (
                            <Cell
                                key={`cell-${index}`}
                                fill={`url(#${gradientId})`}
                                className="hover:opacity-80 transition-opacity duration-200"
                            />
                        ))}
                    </Bar>
                </RechartsBarChart>
            </ResponsiveContainer>
        </ChartWrapper>
    )
}
