"use client"

import { AnimatedNumber } from "@/components/custom/shared/AnimatedNumber"
import { ChartWrapper } from "@/components/custom/shared/charts/ChartWrapper"
import { CustomTooltip } from "@/components/custom/shared/charts/CustomTooltip"
import { CHART_PALETTE } from "@/lib/constants/theme"
import {
    Cell,
    Legend,
    Pie,
    PieChart as PieChartComp,
    ResponsiveContainer,
    Tooltip,
} from "recharts"

type LabelFormatter = (label: string) => string

interface Props<T> {
    data: T[]
    nameKey: keyof T
    valueKey: keyof T
    colorKey?: keyof T
    getColor?: (item: T, index: number) => string | undefined
    formatLabel?: LabelFormatter
    showLegend?: boolean
    showPercentage?: boolean
    innerRadius?: number
    outerRadius?: number
    height?: number
}

const RADIAN = Math.PI / 180

const renderCustomizedLabel = ({
    cx,
    cy,
    midAngle,
    innerRadius,
    outerRadius,
    percent,
    name,
    showPercentage = true,
}: {
    cx: number
    cy: number
    midAngle: number
    innerRadius: number
    outerRadius: number
    percent: number
    name: string
    showPercentage?: boolean
}) => {
    if (percent < 0.05) return null // Don't show labels for slices smaller than 5%

    const radius = innerRadius + (outerRadius - innerRadius) * 0.5
    const x = cx + radius * Math.cos(-midAngle * RADIAN)
    const y = cy + radius * Math.sin(-midAngle * RADIAN)

    return (
        <text
            x={x}
            y={y}
            fill="white"
            textAnchor={x > cx ? "start" : "end"}
            dominantBaseline="central"
            fontSize={11}
            fontWeight={500}
            className="drop-shadow-sm"
        >
            {showPercentage ? `${(percent * 100).toFixed(0)}%` : name}
        </text>
    )
}

export default function DonutChart<T>({
    data,
    nameKey,
    valueKey,
    colorKey,
    getColor,
    formatLabel,
    showLegend = true,
    showPercentage = true,
    innerRadius = 60,
    outerRadius = 100,
    height = 280,
}: Props<T>) {
    const defaultFormatLabel: LabelFormatter = (label: string) =>
        label.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase())

    const fmt = formatLabel ?? defaultFormatLabel

    // Helpers to read name/value safely
    const getName = (item: T): string => {
        const raw = item[nameKey] as unknown
        if (typeof raw === "string") return raw
        return String(raw ?? "")
    }

    const getValue = (item: T): number => {
        const raw = item[valueKey] as unknown
        if (typeof raw === "number") return raw
        const num = Number(raw)
        return Number.isFinite(num) ? num : 0
    }

    const resolveColor = (item: T, index: number): string => {
        if (getColor) {
            const c = getColor(item, index)
            if (c) return c
        }
        if (colorKey) {
            const raw = item[colorKey] as unknown
            if (typeof raw === "string" && raw.trim().length > 0) return raw
        }
        return CHART_PALETTE[index % CHART_PALETTE.length]
    }

    // Normalize data to Recharts expected shape
    const chartData = (data ?? []).map((item, index) => ({
        name: getName(item),
        value: getValue(item),
        formattedName: fmt(getName(item)),
        color: resolveColor(item, index),
    }))

    // Calculate total for center display
    const total = chartData.reduce((sum, item) => sum + item.value, 0)

    const centerBoxSize = 120

    return (
        <ChartWrapper isEmpty={!data || data.length === 0}>
            <ResponsiveContainer
                width="100%"
                height={height}
            >
                <PieChartComp>
                    <Tooltip
                        content={
                            <CustomTooltip
                                labelFormatter={(label) =>
                                    typeof label === "string" ? fmt(label) : String(label)
                                }
                            />
                        }
                    />
                    {showLegend && (
                        <Legend
                            verticalAlign="bottom"
                            height={36}
                            iconType="circle"
                            iconSize={10}
                            formatter={(value) => (
                                <span className="text-xs font-semibold text-muted-foreground">
                                    {fmt(value)}
                                </span>
                            )}
                        />
                    )}
                    <Pie
                        data={chartData}
                        dataKey="value"
                        nameKey="name"
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={(props) => {
                            if (
                                typeof props.midAngle === "number" &&
                                typeof props.cx === "number" &&
                                typeof props.cy === "number" &&
                                typeof props.innerRadius === "number" &&
                                typeof props.outerRadius === "number" &&
                                typeof props.percent === "number" &&
                                typeof props.name === "string"
                            ) {
                                return renderCustomizedLabel({
                                    cx: props.cx,
                                    cy: props.cy,
                                    midAngle: props.midAngle,
                                    innerRadius: props.innerRadius,
                                    outerRadius: props.outerRadius,
                                    percent: props.percent,
                                    name: props.name,
                                    showPercentage,
                                })
                            }
                            return null
                        }}
                        outerRadius={outerRadius}
                        innerRadius={innerRadius}
                        paddingAngle={2}
                        animationBegin={0}
                        animationDuration={800}
                    >
                        {chartData.map((entry, index) => (
                            <Cell
                                key={`cell-${index}`}
                                fill={entry.color}
                                stroke={entry.color}
                                strokeWidth={0}
                                className="hover:opacity-80 transition-opacity duration-200"
                            />
                        ))}
                    </Pie>

                    <foreignObject
                        x={`calc(50% - ${centerBoxSize / 2}px)`}
                        y={`calc(50% - ${centerBoxSize / 2}px)`}
                        width={centerBoxSize}
                        height={centerBoxSize}
                        style={{ pointerEvents: "none" }}
                    >
                        <div className="flex h-full w-full flex-col items-center justify-center text-center">
                            <AnimatedNumber
                                value={total}
                                className="text-2xl font-bold text-foreground leading-none"
                            />
                            <span className="mt-1.5 text-xs font-medium text-muted-foreground">
                                Total
                            </span>
                        </div>
                    </foreignObject>
                </PieChartComp>
            </ResponsiveContainer>
        </ChartWrapper>
    )
}
