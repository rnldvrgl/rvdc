/**
 * Main utility exports
 * Import commonly used utilities from this file
 */

// ============================================================================
// MATH & NUMBER UTILITIES
// ============================================================================
export {
  clamp,
  generateId,
  percentage,
  percentageChange,
  round2,
  roundTo,
  sum,
  sumRounded,
  toSafeNumber,
} from "@/lib/utils/math"

// ============================================================================
// TEXT & STRING UTILITIES
// ============================================================================
export {
  arrayToLines,
  capitalize,
  extractNumbers,
  formatEnumValue,
  joinWithAnd,
  linesToArray,
  pluralize,
  sentenceCase,
  slug,
  stripHtml,
  truncate,
} from "@/lib/utils/text"

// ============================================================================
// CURRENCY UTILITIES
// ============================================================================
export { formatCurrency, peso, toNumber } from "@/lib/utils/currency"

// ============================================================================
// DATE & TIME UTILITIES
// ============================================================================
export {
  formatBackDate,
  formatDate,
  formatDateFull,
  formatDateYMD,
  formatElapsed,
  formatTime,
  formatTimestamp,
  makeFormattedRange,
} from "@/lib/utils/helpers/date"

// ============================================================================
// VALIDATION UTILITIES
// ============================================================================
export {
  isAlphabetic,
  isAlphanumeric,
  isNotEmpty,
  isNumeric,
  meetsMaxLength,
  meetsMinLength,
  validateCreditCard,
  validateEmail,
  validatePhoneNumber,
  validateUrl,
  validateZipCode,
} from "@/lib/utils/validation"

// ============================================================================
// DATA TRANSFORMATION UTILITIES
// ============================================================================
export {
  arrayToMap,
  createPaginatedResponse,
  deepMerge,
  flatten,
  groupBy,
  objectToQueryString,
  omit,
  paginate,
  pick,
  queryStringToObject,
  safeJsonParse,
  sortByMultiple,
  unique,
} from "@/lib/utils/transform"

// ============================================================================
// ENUM MAPPINGS
// ============================================================================
export {
  // Attendance
  attendanceTypeLabels,
  // Warranty
  claimTypeLabels,
  // Payroll
  deductionTypeLabels,
  // General
  employmentStatusLabels,
  genderLabels,
  getEnumKeys,
  getEnumLabel,
  getEnumLabels,
  getEnumOptions,
  holidayTypeLabels,
  leaveStatusLabels,
  leaveTypeLabels,
  // Maintenance
  maintenancePriorityLabels,
  maintenanceStatusLabels,
  maintenanceTypeLabels,
  maritalStatusLabels,
  offenseSeverityLabels,
  offenseTypeLabels,
  // Sales
  paymentMethodLabels,
  paymentStatusLabels,
  payrollStatusLabels,
  priorityLabels,
  quotationStatusLabels,
  salesOrderStatusLabels,
  scheduleTypeLabels,
  statusLabels,
  stockAuditStatusLabels,
  // Stock
  stockStatusLabels,
  warrantyClaimStatusLabels,
} from "@/lib/constants/enumMappings"

// ============================================================================
// STATUS MAPPING & BADGE UTILITIES
// ============================================================================
export {
  // Attendance
  attendanceStatusConfigMap,
  attendanceTypeColorMap,
  // Warranty
  claimTypeConfigMap,
  getStatusColors,
  getStatusConfig,
  getStatusLabel,
  getStatusVariant,
  leaveStatusConfigMap,
  // Maintenance
  maintenancePriorityConfigMap,
  maintenanceStatusConfigMap,
  offenseSeverityBadgeMap,
  offenseTypeBadgeMap,
  // Sales
  paymentStatusConfigMap,
  // Payroll
  payrollStatusConfigMap,
  quotationStatusConfigMap,
  salesOrderStatusConfigMap,
  // Service
  serviceStatusConfigMap,
  serviceTypeColorMap,
  // Stock
  stockStatusConfigMap,
  warrantyClaimStatusConfigMap,
  type BadgeVariant,
  type StatusConfig,
} from "@/lib/utils/statusMapping"
