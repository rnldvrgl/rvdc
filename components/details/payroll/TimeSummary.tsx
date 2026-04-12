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
    <div className="rounded-xl border bg-muted/20 p-4">
      <div className="flex items-center gap-2 mb-3">
        <Clock className="h-4 w-4 text-primary" />
        <h3 className="text-sm font-semibold tracking-tight">Time Summary</h3>
        {typeof totalDays === "number" && hoursPerDay ? (
          <span className="ml-auto text-xs text-muted-foreground">
            <span className="font-semibold text-foreground">
              {totalDays.toFixed(2)}
            </span>{" "}
            days &nbsp;
            <span className="opacity-60">({hoursPerDay}h/day)</span>
          </span>
        ) : null}
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <TimeCard
          label="Regular"
          hours={regularHours}
          color="blue"
        />
        <TimeCard
          label="Overtime"
          hours={approvedOtHours}
          color="orange"
        />
        <TimeCard
          label="Holiday"
          hours={holidayHours}
          color="green"
        />
        <TimeCard
          label="Night Diff"
          hours={nightDiffHours}
          color="purple"
        />
      </div>
    </div>
  )
}

interface TimeCardProps {
  label: string
  hours: number
  color: "blue" | "orange" | "green" | "purple"
}

function TimeCard({ label, hours, color }: TimeCardProps) {
  const styles = {
    blue: {
      bg: "bg-blue-50 dark:bg-blue-950/30",
      border: "border-blue-200/60 dark:border-blue-800/40",
      value: "text-blue-700 dark:text-blue-400",
    },
    orange: {
      bg: "bg-orange-50 dark:bg-orange-950/30",
      border: "border-orange-200/60 dark:border-orange-800/40",
      value: "text-orange-700 dark:text-orange-400",
    },
    green: {
      bg: "bg-green-50 dark:bg-green-950/30",
      border: "border-green-200/60 dark:border-green-800/40",
      value: "text-success",
    },
    purple: {
      bg: "bg-purple-50 dark:bg-purple-950/30",
      border: "border-purple-200/60 dark:border-purple-800/40",
      value: "text-purple-700 dark:text-purple-400",
    },
  }

  const s = styles[color]

  return (
    <div
      className={`rounded-lg border ${s.bg} ${s.border} px-3 py-2.5 text-center`}
    >
      <p className={`text-xl font-bold tabular-nums ${s.value}`}>
        {hours.toFixed(1)}
        <span className="text-xs font-medium ml-0.5 opacity-70">h</span>
      </p>
      <p className="text-[11px] text-muted-foreground font-medium mt-0.5 uppercase tracking-wide">
        {label}
      </p>
    </div>
  )
}
