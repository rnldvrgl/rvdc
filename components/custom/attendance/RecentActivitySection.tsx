import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { DailyAttendance } from "@/lib/constants/types"
import { Clock } from "lucide-react"
import { AttendanceRecordItem } from "./AttendanceRecordItem"
import { EmptyState, LoadingState } from "./AttendanceStates"

interface RecentActivitySectionProps {
  records: DailyAttendance[]
  isLoading: boolean
  showEmployeeCount?: boolean
}

export const RecentActivitySection = ({
  records,
  isLoading,
  showEmployeeCount = true,
}: RecentActivitySectionProps) => {
  return (
    <Card className="gap-0 py-0">
      <CardHeader className="border-b py-6">
        <div className="flex flex-col sm:flex-row items-center justify-center sm:justify-between">
          <div className="flex flex-col sm:flex-row gap-2">
            <div className="p-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 w-fit mx-auto">
              <Clock className="size-4 text-slate-600 dark:text-slate-400" />
            </div>
            <CardTitle className="text-base md:text-lg font-semibold">
              Recent Activity
            </CardTitle>
          </div>
          {showEmployeeCount && (
            <Badge
              variant="outline"
              className="text-xs"
            >
              Last 10 Records
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <div className="divide-y">
          {isLoading ? (
            <LoadingState />
          ) : records.length === 0 ? (
            <EmptyState />
          ) : (
            records.slice(0, 10).map((record) => (
              <AttendanceRecordItem
                key={record.id}
                record={record}
              />
            ))
          )}
        </div>
      </CardContent>
    </Card>
  )
}
