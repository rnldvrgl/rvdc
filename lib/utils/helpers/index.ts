/**
 * Helper functions export index
 * Component-specific helper files
 */

// ============================================================================
// DATE & TIME HELPERS
// ============================================================================
export {
  formatBackDate,
  formatDate,
  formatDateFull,
  formatDateTimeFull,
  formatDateYMD,
  formatElapsed,
  formatTime,
  formatTimestamp,
  makeFormattedRange,
} from "@/lib/utils/helpers/date"

// ============================================================================
// SERVICE HELPERS
// ============================================================================
export {
  getServiceModeLabel,
  getServiceStatusLabel,
  getServiceTypeBadgeClass,
  getServiceTypeLabel,
  serviceModeLabels,
  serviceStatusLabels,
  serviceTypeColors,
  serviceTypeLabels,
} from "@/lib/utils/helpers/service"

// ============================================================================
// ATTENDANCE HELPERS
// ============================================================================
export {
  calculateLateStatus,
  canApprove,
  canClockInOut,
  canViewAllAttendance,
  convertAttendanceForCalendar,
  createClockInPayload,
  createClockOutPayload,
  formatAttendanceDate,
  formatAttendanceTime,
  getAttendanceStatusVariant,
  getAttendanceTypeColor,
  getLeaveBalanceStatus,
  getLeaveStatusVariant,
  getLeaveTypeColor,
  validateLeaveBalance,
} from "@/lib/utils/attendance"
