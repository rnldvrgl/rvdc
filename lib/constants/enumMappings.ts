/**
 * Centralized enum to label/value mappings
 * Extracted from components to standardize enum display values
 */

// ============================================================================
// ATTENDANCE ENUMS
// ============================================================================

export const attendanceTypeLabels: Record<string, string> = {
  FULL_DAY: "Full Day",
  HALF_DAY: "Half Day",
}

export const leaveTypeLabels: Record<string, string> = {
  VACATION: "Vacation",
  SICK_LEAVE: "Sick Leave",
  PERSONAL: "Personal Leave",
  EMERGENCY: "Emergency Leave",
  MATERNITY: "Maternity Leave",
  PATERNITY: "Paternity Leave",
  COMPASSIONATE: "Compassionate Leave",
  BUSINESS_TRAVEL: "Business Travel",
}

export const leaveStatusLabels: Record<string, string> = {
  PENDING: "Pending",
  APPROVED: "Approved",
  REJECTED: "Rejected",
  CANCELLED: "Cancelled",
}

export const offenseTypeLabels: Record<string, string> = {
  TARDINESS: "Tardiness",
  ABSENCES: "Absences",
  CONDUCT: "Conduct",
  POLICY_VIOLATION: "Policy Violation",
  PERFORMANCE: "Performance",
  INSUBORDINATION: "Insubordination",
}

export const offenseSeverityLabels: Record<string, string> = {
  MINOR: "Minor",
  MODERATE: "Moderate",
  SEVERE: "Severe",
  CRITICAL: "Critical",
}

// ============================================================================
// PAYROLL ENUMS
// ============================================================================

export const payrollStatusLabels: Record<string, string> = {
  PENDING: "Pending",
  PROCESSING: "Processing",
  COMPLETED: "Completed",
  CANCELLED: "Cancelled",
  PAID: "Paid",
}

export const deductionTypeLabels: Record<string, string> = {
  TAX: "Tax",
  SSS: "SSS",
  PHILHEALTH: "PhilHealth",
  PAGIBIG: "Pag-IBIG",
  OTHERS: "Others",
}

// ============================================================================
// SALES & QUOTATION ENUMS
// ============================================================================

export const quotationStatusLabels: Record<string, string> = {
  DRAFT: "Draft",
  SENT: "Sent",
  ACCEPTED: "Accepted",
  REJECTED: "Rejected",
  EXPIRED: "Expired",
}

export const salesOrderStatusLabels: Record<string, string> = {
  PENDING: "Pending",
  IN_PROGRESS: "In Progress",
  COMPLETED: "Completed",
  CANCELLED: "Cancelled",
}

export const paymentStatusLabels: Record<string, string> = {
  PENDING: "Pending",
  PARTIAL: "Partial",
  PAID: "Paid",
  OVERDUE: "Overdue",
  CANCELLED: "Cancelled",
  // Lowercase variants (from API)
  pending: "Pending",
  unpaid: "Unpaid",
  partial: "Partially Paid",
  paid: "Paid",
  refunded: "Refunded",
  written_off: "Written Off",
  overdue: "Overdue",
  cancelled: "Cancelled",
  no_charge: "No Charge",
}

export const paymentMethodLabels: Record<string, string> = {
  CASH: "Cash",
  CHECK: "Check",
  GCASH: "GCash",
  BANK_TRANSFER: "Bank Transfer",
  CREDIT_CARD: "Credit Card",
}

// ============================================================================
// WARRANTY CLAIM ENUMS
// ============================================================================

export const warrantyClaimStatusLabels: Record<string, string> = {
  PENDING: "Pending",
  APPROVED: "Approved",
  REJECTED: "Rejected",
  IN_PROGRESS: "In Progress",
  COMPLETED: "Completed",
  CANCELLED: "Cancelled",
}

export const claimTypeLabels: Record<string, string> = {
  WARRANTY_REPLACEMENT: "Warranty Replacement",
  WARRANTY_REPAIR: "Warranty Repair",
  DEFECT_REPLACEMENT: "Defect Replacement",
  DAMAGE_CLAIM: "Damage Claim",
}

// ============================================================================
// STOCK & INVENTORY ENUMS
// ============================================================================

export const stockStatusLabels: Record<string, string> = {
  IN_STOCK: "In Stock",
  LOW_STOCK: "Low Stock",
  OUT_OF_STOCK: "Out of Stock",
  DISCONTINUED: "Discontinued",
  ON_ORDER: "On Order",
}

export const stockAuditStatusLabels: Record<string, string> = {
  PENDING: "Pending",
  IN_PROGRESS: "In Progress",
  APPROVED: "Approved",
  REJECTED: "Rejected",
  RECONCILED: "Reconciled",
}

// ============================================================================
// MAINTENANCE ENUMS
// ============================================================================

export const maintenanceStatusLabels: Record<string, string> = {
  PENDING: "Pending",
  IN_PROGRESS: "In Progress",
  SCHEDULED: "Scheduled",
  COMPLETED: "Completed",
  CANCELLED: "Cancelled",
}

export const maintenancePriorityLabels: Record<string, string> = {
  LOW: "Low",
  MEDIUM: "Medium",
  HIGH: "High",
  CRITICAL: "Critical",
}

export const maintenanceTypeLabels: Record<string, string> = {
  PREVENTIVE: "Preventive",
  CORRECTIVE: "Corrective",
  EMERGENCY: "Emergency",
}

// ============================================================================
// GENERAL ENUMS
// ============================================================================

export const statusLabels: Record<string, string> = {
  ACTIVE: "Active",
  INACTIVE: "Inactive",
  PENDING: "Pending",
  APPROVED: "Approved",
  REJECTED: "Rejected",
  SUSPENDED: "Suspended",
  ARCHIVED: "Archived",
}

export const priorityLabels: Record<string, string> = {
  LOW: "Low",
  MEDIUM: "Medium",
  HIGH: "High",
  CRITICAL: "Critical",
  URGENT: "Urgent",
}

export const employmentStatusLabels: Record<string, string> = {
  ACTIVE: "Active",
  INACTIVE: "Inactive",
  ON_LEAVE: "On Leave",
  TERMINATED: "Terminated",
  RESIGNED: "Resigned",
  RETIRED: "Retired",
}

export const holidayTypeLabels: Record<string, string> = {
  NATIONAL: "National Holiday",
  LOCAL: "Local Holiday",
  SPECIAL_NON_WORKING: "Special Non-Working Day",
  SPECIAL_WORKING: "Special Working Day",
}

export const scheduleTypeLabels: Record<string, string> = {
  FIXED: "Fixed",
  ROTATING: "Rotating",
  FLEXIBLE: "Flexible",
  ON_CALL: "On Call",
}

export const genderLabels: Record<string, string> = {
  MALE: "Male",
  FEMALE: "Female",
  OTHER: "Other",
  PREFER_NOT_TO_SAY: "Prefer not to say",
}

export const maritalStatusLabels: Record<string, string> = {
  SINGLE: "Single",
  MARRIED: "Married",
  WIDOWED: "Widowed",
  DIVORCED: "Divorced",
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Get the label for an enum value
 * @param enumMap - The enum mapping object
 * @param value - The enum value
 * @param defaultLabel - Default label if value not found
 * @returns The human-readable label
 */
export function getEnumLabel(
  enumMap: Record<string, string>,
  value: string | undefined | null,
  defaultLabel: string = "Unknown",
): string {
  if (!value) return defaultLabel
  return enumMap[value] || defaultLabel
}

/**
 * Get all labels from an enum map
 * @param enumMap - The enum mapping object
 * @returns Array of label values
 */
export function getEnumLabels(enumMap: Record<string, string>): string[] {
  return Object.values(enumMap)
}

/**
 * Get all keys from an enum map
 * @param enumMap - The enum mapping object
 * @returns Array of enum keys
 */
export function getEnumKeys(enumMap: Record<string, string>): string[] {
  return Object.keys(enumMap)
}

/**
 * Get all key-value pairs from an enum map as array of options
 * @param enumMap - The enum mapping object
 * @returns Array of { value, label } objects for form selects
 */
export function getEnumOptions(
  enumMap: Record<string, string>,
): Array<{ value: string; label: string }> {
  return Object.entries(enumMap).map(([value, label]) => ({
    value,
    label,
  }))
}
