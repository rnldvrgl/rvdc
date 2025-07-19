'use client'

import { ChartWrapper } from '@/components/custom/shared/charts/ChartWrapper'
import { CustomTooltip } from '@/components/custom/shared/charts/CustomTooltip'
import { useChartColors } from '@/lib/hooks/useChartColors'
import { format, parseISO } from 'date-fns'
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'

interface LineConfig<T> {
  key: keyof T
  color: string
  label: string
}

interface Props<T extends { date: string }> {
  data: T[]
  lines: LineConfig<T>[]
}

export default function TimeSeriesAreaChart<T extends { date: string }>({
  data,
  lines,
}: Props<T>) {
  const { axisColor, gridColor } = useChartColors()

  return (
    <ChartWrapper isEmpty={!data || data.length === 0}>
      <ResponsiveContainer
        width="100%"
        height={300}
      >
        <AreaChart data={data}>
          <CartesianGrid
            strokeDasharray="3 3"
            stroke={gridColor}
          />
          <XAxis
            dataKey="date"
            tickFormatter={(value) => format(parseISO(value), 'MMM d')}
            tick={{ fontSize: 10, fill: axisColor }}
          />
          <YAxis tick={{ fontSize: 10, fill: axisColor }} />
          <Tooltip
            content={
              <CustomTooltip
                labelFormatter={(label) => {
                  if (typeof label === 'string') {
                    return format(parseISO(label), 'MMM d, yyyy')
                  }
                  return String(label)
                }}
              />
            }
          />
          {lines.map(({ key, color }) => (
            <Area
              key={String(key)}
              type="monotone"
              dataKey={String(key)}
              stroke={color}
              fill={color}
              fillOpacity={0.3}
            />
          ))}
        </AreaChart>
      </ResponsiveContainer>
    </ChartWrapper>
  )
}
