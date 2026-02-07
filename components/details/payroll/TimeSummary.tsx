import { Clock } from "lucide-react"

interface TimeSummaryProps {
  regularHours: number
  approvedOtHours: number
  holidayHours: number
  nightDiffHours: number
}

export function TimeSummary({
  regularHours,
  approvedOtHours,
  holidayHours,
  nightDiffHours,
}: TimeSummaryProps) {
  return (
    <div className="rounded-lg border p-3">
      <div className="flex items-center gap-2 mb-2.5">
        <Clock className="h-4 w-4 text-primary" />
        <h3 className="text-sm sm:text-base font-semibold">Time Summary</h3>
      </div>
      <div className="grid sm:grid-cols-2 md:grid-cols-4 gap-2">
        <TimeCard
          label="Regular"
          hours={regularHours}
          color="blue"
        />
        <TimeCard
          label="Approved OT"
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
  const colorClasses = {
    blue: "text-blue-600 dark:text-blue-400",
    orange: "text-orange-600 dark:text-orange-400",
    green: "text-green-600 dark:text-green-400",
    purple: "text-purple-600 dark:text-purple-400",
  }

  return (
    <div className="text-center p-2 rounded-md bg-white/80 dark:bg-gray-900/40 border">
      <p className={`text-lg font-bold ${colorClasses[color]}`}>
        {hours.toFixed(1)}
      </p>
      <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">{label}</p>
    </div>
  )
}
