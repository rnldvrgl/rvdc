import {
  AttendanceStatusBadge,
  AttendanceTypeBadge,
  LateBadge,
} from "@/components/custom/attendance/AttendanceBadges"
import { DailyAttendance } from "@/lib/constants/types"
import { formatTime } from "@/lib/utils/attendance"
import { Clock } from "lucide-react"

interface AttendanceRecordItemProps {
  record: DailyAttendance
}

export const AttendanceRecordItem = ({ record }: AttendanceRecordItemProps) => {
  return (
    <div className="text-center p-4 md:p-6">
      {/* Mobile Layout */}
      <div className="flex flex-col gap-3 md:hidden">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <div className="font-medium text-sm truncate text-slate-900 dark:text-slate-100">
              {record.employee_name}
            </div>
            <div className="text-xs text-muted-foreground mt-0.5">
              {new Date(record.date).toLocaleDateString("en-US", {
                month: "short",
                day: "numeric",
                year: "numeric",
              })}
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <AttendanceStatusBadge status={record.status} />
          <AttendanceTypeBadge type={record.attendance_type} />
          {record.is_late && (
            <LateBadge
              isLate={record.is_late}
              lateMinutes={record.late_minutes}
            />
          )}
        </div>

        {record.clock_in && (
          <div className="flex items-center gap-2 text-xs text-muted-foreground bg-slate-100 dark:bg-slate-800 rounded-lg px-3 py-2">
            <Clock className="h-3 w-3 flex-shrink-0" />
            <span>
              {formatTime(record.clock_in)} -{" "}
              {record.clock_out
                ? formatTime(record.clock_out)
                : "Not yet clocked out"}
            </span>
          </div>
        )}

        <div className="flex items-center justify-between text-xs gap-2">
          {record.paid_hours && (
            <span className="text-muted-foreground font-medium">
              {Number(record.paid_hours).toFixed(0)} hours paid
            </span>
          )}
          {record.late_penalty_amount &&
            parseFloat(record.late_penalty_amount) > 0 && (
              <span className="text-red-600 dark:text-red-400 font-semibold">
                Penalty: ₱{record.late_penalty_amount}
              </span>
            )}
        </div>
      </div>

      {/* Desktop Layout */}
      <div className="hidden md:flex items-center justify-between gap-6">
        <div className="flex items-center gap-4 flex-1 min-w-0">
          <div className="flex flex-col space-y-2">
            <AttendanceStatusBadge status={record.status} />
            <AttendanceTypeBadge type={record.attendance_type} />
          </div>
          <div className="flex-1 min-w-0 space-y-1">
            <div className="font-medium text-sm text-slate-900 dark:text-slate-100 truncate">
              {record.employee_name}
            </div>
            <div className="text-xs text-muted-foreground mt-0.5">
              {new Date(record.date).toLocaleDateString("en-US", {
                weekday: "short",
                month: "short",
                day: "numeric",
                year: "numeric",
              })}
            </div>
            {record.is_late && (
              <LateBadge
                isLate={record.is_late}
                lateMinutes={record.late_minutes}
              />
            )}
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="text-right space-y-1.5">
            {record.clock_in && (
              <div className="flex items-center gap-1.5 justify-end text-xs text-muted-foreground">
                <Clock className="h-3 w-3" />
                <span>
                  {formatTime(record.clock_in)} -{" "}
                  {record.clock_out
                    ? formatTime(record.clock_out)
                    : "Not yet clocked out"}
                </span>
              </div>
            )}
            <div className="flex items-center gap-3 justify-end text-xs">
              {record.paid_hours && (
                <span className="text-muted-foreground font-medium">
                  {Number(record.paid_hours).toFixed(0)} hours paid
                </span>
              )}
            </div>

            <div className="flex items-center gap-3 justify-end text-xs">
              {record.late_penalty_amount &&
                parseFloat(record.late_penalty_amount) > 0 && (
                  <span className="text-red-600 dark:text-red-400 font-semibold">
                    Penalty: ₱{record.late_penalty_amount}
                  </span>
                )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
