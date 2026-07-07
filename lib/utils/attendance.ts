import {
    AttendanceStatus,
    AttendanceType,
    CalendarAttendanceStatus,
    DailyAttendance,
    LeaveStatus,
    LeaveType,
} from "@/lib/constants/types"
import { formatDateToYMD } from "@/lib/utils/helpers"

// Status badge variants
export const getAttendanceStatusVariant = (
  status: AttendanceStatus,
): "default" | "success" | "destructive" | "secondary" => {
  switch (status) {
    case "APPROVED":
      return "success"
    case "REJECTED":
      return "destructive"
    case "PENDING":
      return "secondary"
    default:
      return "default"
  }
}

export const getLeaveStatusVariant = (
  status: LeaveStatus,
): "default" | "success" | "destructive" | "secondary" | "outline" => {
  switch (status) {
    case "APPROVED":
      return "success"
    case "REJECTED":
      return "destructive"
    case "PENDING":
      return "secondary"
    case "CANCELLED":
      return "outline"
    default:
      return "default"
  }
}

// Attendance type colors
export const getAttendanceTypeColor = (type: AttendanceType): string => {
  switch (type) {
    case "FULL_DAY":
      return "text-success bg-success/50"
    case "HALF_DAY":
      return "text-warning bg-warning/50"
    case "PARTIAL":
      return "text-info bg-info/50"
    case "ABSENT":
      return "text-destructive bg-destructive/50"
    case "LEAVE":
      return "text-purple-600 bg-purple-50"
    default:
      return "text-gray-600 bg-gray-50"
  }
}

// Leave type colors
export const getLeaveTypeColor = (type: LeaveType): string => {
  switch (type) {
    case "SICK":
      return "text-destructive bg-red-50"
    case "EMERGENCY":
      return "text-warning bg-warning/50"
    default:
      return "text-primary bg-primary/50"
  }
}

// Format time (HH:MM AM/PM)
export const formatAttendanceTime = (dateTimeString: string | null): string => {
  if (!dateTimeString) return "-"

  try {
    const date = new Date(dateTimeString)
    if (isNaN(date.getTime())) {
      return "-"
    }
    return date.toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    })
  } catch {
    // error is handled by mutation
    return "-"
  }
}

// Format date (MMM DD, YYYY)
export const formatAttendanceDate = (dateString: string): string => {
  if (!dateString) return "-"

  try {
    const date = new Date(dateString)
    if (isNaN(date.getTime())) {
      return "-"
    }
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    })
  } catch {
    // error is handled by mutation
    return "-"
  }
}

// Calculate late status
export const calculateLateStatus = (
  isLate: boolean,
  lateMinutes: number,
): {
  severity: "none" | "minor" | "major"
  message: string
} => {
  if (!isLate || lateMinutes === 0) {
    return { severity: "none", message: "On time" }
  }

  if (lateMinutes < 30) {
    return {
      severity: "minor",
      message: `${lateMinutes} min late`,
    }
  }

  return {
    severity: "major",
    message: `${lateMinutes} min late (Half-day)`,
  }
}

// Check if user can approve (admin/manager)
export const canApprove = (role: string): boolean => {
  return role === "admin"
}

// Check if user can clock in/out (manager, clerk, technician - NOT admin)
export const canClockInOut = (role: string): boolean => {
  // Only employees who actually work can clock in/out
  // Admin handles approvals but doesn't clock in/out
  return role === "manager" || role === "clerk" || role === "technician"
}

// Check if user can view all attendance records
export const canViewAllAttendance = (role: string): boolean => {
  return role === "admin"
}

// Generate clock-in payload
export const createClockInPayload = (
  employeeId: number,
  date: Date = new Date(),
) => {
  return {
    employee_id: employeeId,
    date: formatDateToYMD(date),
    clock_in: new Date().toISOString(),
  }
}

// Generate clock-out payload
export const createClockOutPayload = (
  attendanceId: number,
  clockOutTime: Date = new Date(),
) => {
  return {
    attendance_id: attendanceId,
    clock_out: clockOutTime.toISOString(),
  }
}

// Convert attendance data for calendar
export const convertAttendanceForCalendar = (
  attendances: DailyAttendance[],
) => {
  return attendances.map((attendance) => ({
    id: attendance.id.toString(),
    employeeName: attendance.employee_name,
    date: attendance.date,
    status: mapAttendanceToCalendarStatus(attendance),
    checkIn: attendance.clock_in
      ? formatAttendanceTime(attendance.clock_in)
      : undefined,
    checkOut: attendance.clock_out
      ? formatAttendanceTime(attendance.clock_out)
      : undefined,
    hours: parseFloat(attendance.paid_hours || "0"),
    isLate: attendance.is_late,
    lateMinutes: attendance.late_minutes,
    latePenalty: parseFloat(attendance.late_penalty_amount || "0"),
  }))
}

// Map attendance record to calendar status (checks is_late field, not just attendance_type)
const mapAttendanceToCalendarStatus = (
  attendance: DailyAttendance,
): CalendarAttendanceStatus => {
  // If today and clocked in but not yet clocked out, treat as present (in-progress)
  const today = formatDateToYMD(new Date())
  if (
    attendance.date === today &&
    attendance.clock_in &&
    !attendance.clock_out
  ) {
    return attendance.is_late ? "late" : "present"
  }

  // If actually late (based on backend calculation), show as late
  if (attendance.is_late) {
    return "late"
  }

  // Otherwise map by attendance type
  switch (attendance.attendance_type) {
    case "FULL_DAY":
    case "HALF_DAY":
    case "PARTIAL":
      return "present"
    case "ABSENT":
      return "absent"
    case "LEAVE":
      return "leave"
    default:
      return "absent"
  }
}

// Validate leave balance
export const validateLeaveBalance = (
  leaveType: LeaveType,
  isHalfDay: boolean,
  balance: { sick_leave_remaining: string; emergency_leave_remaining: string },
): { valid: boolean; message?: string } => {
  const daysRequired = isHalfDay ? 0.5 : 1.0
  const remaining = parseFloat(
    leaveType === "SICK"
      ? balance.sick_leave_remaining
      : balance.emergency_leave_remaining,
  )

  if (remaining < daysRequired) {
    return {
      valid: false,
      message: `Insufficient ${leaveType.toLowerCase()} leave balance. Remaining: ${remaining} days.`,
    }
  }

  return { valid: true }
}

// Get leave balance status
export const getLeaveBalanceStatus = (
  remaining: string,
): {
  status: "good" | "warning" | "critical"
  color: string
} => {
  const remainingNum = parseFloat(remaining)

  if (remainingNum >= 3) {
    return { status: "good", color: "text-success" }
  } else if (remainingNum >= 1) {
    return { status: "warning", color: "text-yellow-600" }
  } else {
    return { status: "critical", color: "text-destructive" }
  }
}
