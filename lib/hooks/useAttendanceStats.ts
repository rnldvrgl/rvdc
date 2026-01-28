import { AttendanceStatus } from "@/lib/constants/types"
import { useMemo } from "react"

interface AttendanceRecord {
  status: AttendanceStatus
  paid_hours?: string
  [key: string]: any
}

interface CalendarEvent {
  status: "present" | "late" | "absent" | "vacation" | "sick"
  [key: string]: any
}

interface AttendanceStats {
  totalCount: number
  approvedCount: number
  pendingCount: number
  rejectedCount: number
  totalHours: number
  presentCount: number
  lateCount: number
  absentCount: number
}

export const useAttendanceStats = (
  attendanceRecords: AttendanceRecord[],
  calendarEvents: CalendarEvent[],
): AttendanceStats => {
  return useMemo(() => {
    const totalCount = attendanceRecords.length
    const approvedCount = attendanceRecords.filter(
      (record) => record.status === "APPROVED",
    ).length
    const pendingCount = attendanceRecords.filter(
      (record) => record.status === "PENDING",
    ).length
    const rejectedCount = attendanceRecords.filter(
      (record) => record.status === "REJECTED",
    ).length
    const totalHours = attendanceRecords.reduce(
      (sum, record) => sum + (parseFloat(record.paid_hours || "0") || 0),
      0,
    )

    const presentCount = calendarEvents.filter(
      (e) => e.status === "present",
    ).length
    const lateCount = calendarEvents.filter((e) => e.status === "late").length
    const absentCount = calendarEvents.filter(
      (e) => e.status === "absent",
    ).length

    return {
      totalCount,
      approvedCount,
      pendingCount,
      rejectedCount,
      totalHours,
      presentCount,
      lateCount,
      absentCount,
    }
  }, [attendanceRecords, calendarEvents])
}
