'use client'

import { useChartColors } from '@/lib/hooks/useChartColors'
import { format, isValid, parseISO } from 'date-fns'
import {
  Bar,
  BarChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { ChartWrapper } from './ChartWrapper'
import { CustomTooltip } from './CustomTooltip'

interface Props<T> {
  data: T[]
  xKey: keyof T
  yKey: keyof T
  color?: string
  isTimeSeries?: boolean
}

export default function VerticalBarChart<T>({
  data,
  xKey,
  yKey,
  color,
  isTimeSeries = false,
}: Props<T>) {
  const { axisColor, chartColors } = useChartColors()

  const getLabelFormatted = (label: string | number) => {
    if (typeof label === 'string' && isTimeSeries && isValid(parseISO(label))) {
      return format(parseISO(label), 'MMM d, yyyy')
    }
    return String(label)
      .replace(/_/g, ' ')
      .replace(/\b\w/g, (l) => l.toUpperCase())
  }

  const getTickFormatted = (value: string | number): string => {
    if (typeof value === 'string' && isTimeSeries && isValid(parseISO(value))) {
      return format(parseISO(value), 'MMM d')
    }

    return String(value)
  }

  return (
    <ChartWrapper isEmpty={!data.length}>
      <ResponsiveContainer
        width="100%"
        height={300}
      >
        <BarChart data={data}>
          <XAxis
            dataKey={String(xKey)}
            tickFormatter={getTickFormatted}
            tick={{ fontSize: 10, fill: axisColor }}
          />
          <YAxis tick={{ fontSize: 10, fill: axisColor }} />
          <Tooltip
            content={<CustomTooltip labelFormatter={getLabelFormatted} />}
          />
          <Bar
            dataKey={String(yKey)}
            fill={color ?? chartColors[0]}
          />
        </BarChart>
      </ResponsiveContainer>
    </ChartWrapper>
  )
}
