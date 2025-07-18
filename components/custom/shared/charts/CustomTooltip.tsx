'use client'

import { useChartColors } from '@/lib/hooks/useChartColors'
import { formatNumber } from '@/lib/utils/helpers'

type TooltipPayload = {
  name: string
  value: number
  color?: string
}

type CustomTooltipProps = {
  active?: boolean
  payload?: TooltipPayload[]
  label?: string | number
  labelFormatter?: (label: string | number) => string
}

export function CustomTooltip({
  active,
  payload,
  label,
  labelFormatter,
}: CustomTooltipProps) {
  const { tooltipStyle } = useChartColors()

  if (!active || !payload?.length) return null

  const formattedLabel = labelFormatter
    ? labelFormatter(label ?? '')
    : String(label)

  return (
    <div
      style={{
        ...tooltipStyle,
        fontSize: 13,
        borderRadius: '0.375rem',
        padding: '0.5rem 0.75rem',
        lineHeight: 1.5,
        maxWidth: '240px',
      }}
    >
      <div style={{ fontWeight: 500, marginBottom: 4 }}>{formattedLabel}</div>
      {payload.map((entry, index) => (
        <div
          key={`item-${index}`}
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            gap: '0.5rem',
            color: entry.color || tooltipStyle.color,
            marginBottom: 2,
          }}
        >
          <span style={{ whiteSpace: 'nowrap' }}>
            {entry.name
              .replace(/_/g, ' ')
              .replace(/\b\w/g, (l) => l.toUpperCase())}
          </span>
          <span style={{ whiteSpace: 'nowrap' }}>
            {formatNumber(entry.value)}
          </span>
        </div>
      ))}
    </div>
  )
}
