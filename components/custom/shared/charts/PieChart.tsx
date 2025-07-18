'use client'

import { ChartWrapper } from '@/components/custom/shared/charts/ChartWrapper'
import { CustomTooltip } from '@/components/custom/shared/charts/CustomTooltip'
import { useChartColors } from '@/lib/hooks/useChartColors'
import {
  Cell,
  Pie,
  PieChart as PieChartComp,
  ResponsiveContainer,
  Tooltip,
} from 'recharts'

interface Props<T> {
  data: T[]
  nameKey: keyof T
  valueKey: keyof T
}

export default function PieChart<T>({ data, nameKey, valueKey }: Props<T>) {
  const { chartColors } = useChartColors()

  return (
    <ChartWrapper isEmpty={!data || data.length === 0}>
      <ResponsiveContainer
        width="100%"
        height={300}
      >
        <PieChartComp>
          <Tooltip
            content={
              <CustomTooltip
                labelFormatter={(label) =>
                  typeof label === 'string'
                    ? label
                        .replace(/_/g, ' ')
                        .replace(/\b\w/g, (l) => l.toUpperCase())
                    : String(label)
                }
              />
            }
          />
          <Pie
            data={data}
            dataKey={String(valueKey)}
            nameKey={String(nameKey)}
            cx="50%"
            cy="50%"
            innerRadius={40}
            outerRadius={100}
            label={({ name, percent }) => {
              const formattedName = name
                .replace(/_/g, ' ')
                .replace(/\b\w/g, (l) => l.toUpperCase())
              return percent !== undefined
                ? `${formattedName} (${(percent * 100).toFixed(0)}%)`
                : formattedName
            }}
          >
            {data.map((_, index) => (
              <Cell
                key={`cell-${index}`}
                fill={chartColors[index % chartColors.length]}
              />
            ))}
          </Pie>
        </PieChartComp>
      </ResponsiveContainer>
    </ChartWrapper>
  )
}
