"use client"

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
  if (!active || !payload?.length) return null

  const formattedLabel = labelFormatter
    ? labelFormatter(label ?? "")
    : String(label)

  return (
    <div className="rounded-lg border border-border/50 bg-popover px-3 py-2.5 text-popover-foreground shadow-xl backdrop-blur-sm max-w-[260px]">
      <p className="mb-1.5 text-sm font-semibold">{formattedLabel}</p>
      <div className="space-y-1">
        {payload.map((entry, index) => (
          <div
            key={`item-${index}`}
            className="flex items-center justify-between gap-3"
          >
            <div className="flex items-center gap-2">
              <span
                className="size-2 rounded-full shrink-0"
                style={{ backgroundColor: entry.color }}
              />
              <span className="text-xs text-muted-foreground whitespace-nowrap">
                {entry.name
                  .replace(/_/g, " ")
                  .replace(/\b\w/g, (l) => l.toUpperCase())}
              </span>
            </div>
            <span className="text-xs font-semibold tabular-nums">
              {formatNumber(entry.value)}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}
