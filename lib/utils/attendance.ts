import {
  AttendanceStatus,
  AttendanceType,
  CalendarAttendanceStatus,
  LeaveStatus,
  LeaveType,
} from "@/lib/constants/types"

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
      return "text-green-600 bg-green-50"
    case "HALF_DAY":
      return "text-yellow-600 bg-yellow-50"
    case "PARTIAL":
      return "text-blue-600 bg-blue-50"
    case "ABSENT":
      return "text-red-600 bg-red-50"
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
      return "text-red-600 bg-red-50"
    case "EMERGENCY":
      return "text-orange-600 bg-orange-50"
    default:
      return "text-gray-600 bg-gray-50"
  }
}

// Format time (HH:MM AM/PM)
export const formatTime = (dateTimeString: string | null): string => {
  if (!dateTimeString) return "-"

  const date = new Date(dateTimeString)
  return date.toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  })
}

// Format date (MMM DD, YYYY)
export const formatDate = (dateString: string): string => {
  const date = new Date(dateString)
  return date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  })
}

// Format hours (e.g., "8.00 hrs")
export const formatHours = (hours: string | number): string => {
  const hoursNum = typeof hours === "string" ? parseFloat(hours) : hours
  return `${hoursNum.toFixed(2)} hrs`
}

// Format currency (PHP)
export const formatCurrency = (amount: string | number): string => {
  const amountNum = typeof amount === "string" ? parseFloat(amount) : amount
  return `₱${amountNum.toFixed(2)}`
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
    date: date.toISOString().split("T")[0],
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
export const convertAttendanceForCalendar = (attendances: any[]) => {
  return attendances.map((attendance) => ({
    id: attendance.id.toString(),
    employeeName: attendance.employee_name,
    date: attendance.date,
    status: mapAttendanceTypeToCalendarStatus(attendance.attendance_type),
    checkIn: attendance.clock_in ? formatTime(attendance.clock_in) : undefined,
    checkOut: attendance.clock_out
      ? formatTime(attendance.clock_out)
      : undefined,
    hours: parseFloat(attendance.paid_hours || "0"),
    isLate: attendance.is_late,
    lateMinutes: attendance.late_minutes,
    latePenalty: parseFloat(attendance.late_penalty_amount || "0"),
  }))
}

// Map AttendanceType to calendar status
const mapAttendanceTypeToCalendarStatus = (
  type: AttendanceType,
): CalendarAttendanceStatus => {
  switch (type) {
    case "FULL_DAY":
      return "present"
    case "HALF_DAY":
      return "late"
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
    return { status: "good", color: "text-green-600" }
  } else if (remainingNum >= 1) {
    return { status: "warning", color: "text-yellow-600" }
  } else {
    return { status: "critical", color: "text-red-600" }
  }
}
