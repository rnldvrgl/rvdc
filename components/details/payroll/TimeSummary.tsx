import { Clock } from "lucide-react"

interface TimeSummaryProps {
  regularHours: number
  approvedOtHours: number
  holidayHours: number
  nightDiffHours: number
  totalDays?: number
  hoursPerDay?: number
}

export function TimeSummary({
  regularHours,
  approvedOtHours,
  holidayHours,
  nightDiffHours,
  totalDays,
  hoursPerDay,
}: TimeSummaryProps) {
  const items = [
    { label: "Regular", value: regularHours, color: "text-blue-600 dark:text-blue-400" },
    { label: "OT", value: approvedOtHours, color: "text-orange-600 dark:text-orange-400" },
    { label: "Holiday", value: holidayHours, color: "text-success" },
    { label: "Night Diff", value: nightDiffHours, color: "text-purple-600 dark:text-purple-400" },
  ]

  return (
    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm">
      <span className="flex items-center gap-1.5 text-muted-foreground font-medium">
        <Clock className="h-3.5 w-3.5" />
        Hours
      </span>
      {items.map((item) => (
        <span key={item.label} className="flex items-center gap-1">
          <span className={`font-semibold tabular-nums ${item.color}`}>
            {item.value.toFixed(1)}
          </span>
          <span className="text-xs text-muted-foreground">{item.label}</span>
        </span>
      ))}
      {typeof totalDays === "number" && hoursPerDay ? (
        <>
          <span className="text-muted-foreground/40">·</span>
          <span className="text-xs text-muted-foreground">
            <span className="font-medium">{totalDays.toFixed(2)}d</span>{" "}
            ({hoursPerDay}h/day)
          </span>
        </>
      ) : null}
    </div>
  )
}
