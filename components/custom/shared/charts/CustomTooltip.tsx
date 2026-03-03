"use client"

import { useChartColors } from "@/lib/hooks/useChartColors"
import { formatNumber } from "@/lib/utils/helpers"

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
    ? labelFormatter(label ?? "")
    : String(label)

  return (
    <div
      style={{
        ...tooltipStyle,
        fontSize: 13,
        borderRadius: "0.5rem",
        padding: "0.75rem",
        lineHeight: 1.5,
        maxWidth: "260px",
        boxShadow:
          "0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)",
      }}
    >
      <div style={{ fontWeight: 600, marginBottom: 8, fontSize: "0.875rem" }}>
        {formattedLabel}
      </div>
      {payload.map((entry, index) => (
        <div
          key={`item-${index}`}
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            gap: "0.75rem",
            marginBottom: index < payload.length - 1 ? 6 : 0,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
            <div
              style={{
                width: "8px",
                height: "8px",
                borderRadius: "50%",
                backgroundColor: entry.color || tooltipStyle.color,
              }}
            />
            <span style={{ whiteSpace: "nowrap", fontSize: "0.8125rem" }}>
              {entry.name
                .replace(/_/g, " ")
                .replace(/\b\w/g, (l) => l.toUpperCase())}
            </span>
          </div>
          <span
            style={{
              whiteSpace: "nowrap",
              fontWeight: 600,
              fontSize: "0.8125rem",
            }}
          >
            {formatNumber(entry.value)}
          </span>
        </div>
      ))}
    </div>
  )
}
