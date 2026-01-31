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
  // Extract leave information from notes if attendance_type is LEAVE
  const isLeave = record.attendance_type === "LEAVE"
  const leaveInfo = isLeave && record.notes ? record.notes : null

  return (
    <div className="border-b last:border-b-0 border-slate-200 dark:border-slate-800">
      <div className="p-4 md:p-5">
        {/* Wrapper */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          {/* Employee Info */}
          <div className="text-center md:text-left space-y-0.5 md:flex-1">
            <div className="font-semibold text-sm md:text-base text-slate-900 dark:text-slate-100 truncate">
              {record.employee_name}
            </div>
            <div className="text-xs text-muted-foreground">
              {new Date(record.date).toLocaleDateString("en-US", {
                weekday: "short",
                month: "short",
                day: "numeric",
              })}
            </div>
            {isLeave && leaveInfo && (
              <div className="text-xs text-purple-600 dark:text-purple-400 mt-1">
                {leaveInfo}
              </div>
            )}
          </div>

          {/* Status Badges */}
          <div className="flex flex-wrap justify-center md:justify-center gap-2 md:flex-1">
            {record.status == "APPROVED" &&
              record.attendance_type != "ABSENT" && (
                <AttendanceStatusBadge status={record.status} />
              )}
            <AttendanceTypeBadge type={record.attendance_type} />
            {record.is_late && (
              <LateBadge
                isLate={record.is_late}
                lateMinutes={record.late_minutes}
              />
            )}
          </div>

          {/* Time & Metrics */}
          <div className="flex flex-col items-center md:items-end gap-2 md:flex-1">
            {/* Clock In / Out or Leave Status */}
            {!isLeave && record.clock_in ? (
              <div className="flex items-center gap-2 text-xs md:text-sm text-muted-foreground bg-slate-100 dark:bg-slate-800/50 rounded-full px-3 py-1.5">
                <Clock className="h-3.5 w-3.5" />
                <span>
                  {formatTime(record.clock_in)} →{" "}
                  {record.clock_out ? formatTime(record.clock_out) : "Pending"}
                </span>
              </div>
            ) : isLeave ? (
              <div className="flex items-center gap-2 text-xs md:text-sm text-purple-600 dark:text-purple-400 bg-purple-50 dark:bg-purple-900/20 rounded-full px-3 py-1.5">
                <Clock className="h-3.5 w-3.5" />
                <span>On Leave</span>
              </div>
            ) : null}

            {/* Metrics */}
            <div className="flex flex-wrap justify-center md:justify-end gap-3 text-xs font-medium">
              {record.paid_hours && (
                <span className="px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                  {Number(record.paid_hours).toFixed(1)} hours paid
                </span>
              )}

              {record.late_penalty_amount &&
                parseFloat(record.late_penalty_amount) > 0 && (
                  <span className="px-2 py-0.5 rounded-full bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400">
                    Late ₱{record.late_penalty_amount}
                  </span>
                )}

              {record.uniform_penalty_amount &&
                parseFloat(record.uniform_penalty_amount) > 0 && (
                  <span className="px-2 py-0.5 rounded-full bg-orange-50 dark:bg-orange-900/20 text-orange-600 dark:text-orange-400">
                    Uniform ₱{record.uniform_penalty_amount}
                  </span>
                )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
