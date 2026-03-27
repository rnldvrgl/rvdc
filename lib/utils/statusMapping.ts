/**
 * Centralized status-to-badge/color mappings for UI display
 * Extracted from 8+ component files to standardize status display
 */

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

export type BadgeVariant =
  | "default"
  | "secondary"
  | "destructive"
  | "outline"
  | "success"
  | "warning"

export interface StatusConfig {
  label: string
  variant: BadgeVariant
  bgColor?: string
  textColor?: string
  borderColor?: string
}

// ============================================================================
// ATTENDANCE STATUS MAPPINGS
// ============================================================================

export const attendanceTypeColorMap: Record<string, string> = {
  FULL_DAY: "text-success bg-green-50",
  HALF_DAY: "text-yellow-600 bg-yellow-50",
}

export const leaveStatusConfigMap: Record<string, StatusConfig> = {
  PENDING: {
    label: "Pending",
    variant: "secondary",
  },
  APPROVED: {
    label: "Approved",
    variant: "success",
  },
  REJECTED: {
    label: "Rejected",
    variant: "destructive",
  },
  CANCELLED: {
    label: "Cancelled",
    variant: "outline",
  },
}

export const attendanceStatusConfigMap: Record<string, StatusConfig> = {
  APPROVED: {
    label: "Approved",
    variant: "success",
  },
  REJECTED: {
    label: "Rejected",
    variant: "destructive",
  },
  PENDING: {
    label: "Pending",
    variant: "secondary",
  },
}

// ============================================================================
// OFFENSE STATUS MAPPINGS
// ============================================================================

export const offenseTypeBadgeMap: Record<string, StatusConfig> = {
  TARDINESS: {
    label: "Tardiness",
    variant: "warning",
  },
  ABSENCES: {
    label: "Absences",
    variant: "warning",
  },
  CONDUCT: {
    label: "Conduct",
    variant: "destructive",
  },
  POLICY_VIOLATION: {
    label: "Policy Violation",
    variant: "destructive",
  },
  PERFORMANCE: {
    label: "Performance",
    variant: "secondary",
  },
  INSUBORDINATION: {
    label: "Insubordination",
    variant: "destructive",
  },
}

export const offenseSeverityBadgeMap: Record<string, StatusConfig> = {
  MINOR: {
    label: "Minor",
    variant: "outline",
  },
  MODERATE: {
    label: "Moderate",
    variant: "warning",
  },
  SEVERE: {
    label: "Severe",
    variant: "destructive",
  },
  CRITICAL: {
    label: "Critical",
    variant: "destructive",
    bgColor: "bg-red-100",
    textColor: "text-red-800",
  },
}

// ============================================================================
// PAYROLL STATUS MAPPINGS
// ============================================================================

export const payrollStatusConfigMap: Record<string, StatusConfig> = {
  PENDING: {
    label: "Pending",
    variant: "secondary",
  },
  PROCESSING: {
    label: "Processing",
    variant: "warning",
  },
  COMPLETED: {
    label: "Completed",
    variant: "success",
  },
  CANCELLED: {
    label: "Cancelled",
    variant: "destructive",
  },
  PAID: {
    label: "Paid",
    variant: "success",
  },
}

// ============================================================================
// SALES & QUOTATION STATUS MAPPINGS
// ============================================================================

export const quotationStatusConfigMap: Record<string, StatusConfig> = {
  DRAFT: {
    label: "Draft",
    variant: "secondary",
  },
  SENT: {
    label: "Sent",
    variant: "warning",
  },
  ACCEPTED: {
    label: "Accepted",
    variant: "success",
  },
  REJECTED: {
    label: "Rejected",
    variant: "destructive",
  },
  EXPIRED: {
    label: "Expired",
    variant: "outline",
  },
}

export const salesOrderStatusConfigMap: Record<string, StatusConfig> = {
  PENDING: {
    label: "Pending",
    variant: "secondary",
  },
  IN_PROGRESS: {
    label: "In Progress",
    variant: "warning",
  },
  COMPLETED: {
    label: "Completed",
    variant: "success",
  },
  CANCELLED: {
    label: "Cancelled",
    variant: "destructive",
  },
}

export const paymentStatusConfigMap: Record<string, StatusConfig> = {
  PENDING: {
    label: "Pending",
    variant: "secondary",
  },
  PARTIAL: {
    label: "Partial",
    variant: "warning",
  },
  PAID: {
    label: "Paid",
    variant: "success",
  },
  OVERDUE: {
    label: "Overdue",
    variant: "destructive",
  },
  CANCELLED: {
    label: "Cancelled",
    variant: "outline",
  },
}

// ============================================================================
// SERVICE STATUS MAPPINGS (Extends existing from service.ts)
// ============================================================================

export const serviceTypeColorMap: Record<string, string> = {
  repair:
    "bg-amber-100 text-amber-800 border-amber-200 dark:bg-amber-950/40 dark:text-amber-400 dark:border-amber-800",
  dismantle:
    "bg-orange-100 text-orange-800 border-orange-200 dark:bg-orange-950/40 dark:text-orange-400 dark:border-orange-800",
  inspection:
    "bg-sky-100 text-sky-800 border-sky-200 dark:bg-sky-950/40 dark:text-sky-400 dark:border-sky-800",
  cleaning:
    "bg-emerald-100 text-success border-emerald-200 dark:bg-emerald-950/40 dark:border-emerald-800",
  motor_rewind:
    "bg-rose-100 text-rose-800 border-rose-200 dark:bg-rose-950/40 dark:text-rose-400 dark:border-rose-800",
  installation:
    "bg-violet-100 text-violet-800 border-violet-200 dark:bg-violet-950/40 dark:text-violet-400 dark:border-violet-800",
}

export const serviceStatusConfigMap: Record<string, StatusConfig> = {
  in_progress: {
    label: "In Progress",
    variant: "warning",
  },
  completed: {
    label: "Completed",
    variant: "success",
  },
  cancelled: {
    label: "Cancelled",
    variant: "destructive",
  },
}

// ============================================================================
// WARRANTY CLAIM STATUS MAPPINGS
// ============================================================================

export const warrantyClaimStatusConfigMap: Record<string, StatusConfig> = {
  PENDING: {
    label: "Pending",
    variant: "secondary",
  },
  APPROVED: {
    label: "Approved",
    variant: "success",
  },
  REJECTED: {
    label: "Rejected",
    variant: "destructive",
  },
  IN_PROGRESS: {
    label: "In Progress",
    variant: "warning",
  },
  COMPLETED: {
    label: "Completed",
    variant: "success",
  },
  CANCELLED: {
    label: "Cancelled",
    variant: "outline",
  },
}

export const claimTypeConfigMap: Record<string, StatusConfig> = {
  WARRANTY_REPLACEMENT: {
    label: "Warranty Replacement",
    variant: "secondary",
  },
  WARRANTY_REPAIR: {
    label: "Warranty Repair",
    variant: "secondary",
  },
  DEFECT_REPLACEMENT: {
    label: "Defect Replacement",
    variant: "warning",
  },
  DAMAGE_CLAIM: {
    label: "Damage Claim",
    variant: "destructive",
  },
}

// ============================================================================
// STOCK STATUS MAPPINGS
// ============================================================================

export const stockStatusConfigMap: Record<string, StatusConfig> = {
  IN_STOCK: {
    label: "In Stock",
    variant: "success",
  },
  LOW_STOCK: {
    label: "Low Stock",
    variant: "warning",
  },
  OUT_OF_STOCK: {
    label: "Out of Stock",
    variant: "destructive",
  },
  DISCONTINUED: {
    label: "Discontinued",
    variant: "outline",
  },
  ON_ORDER: {
    label: "On Order",
    variant: "secondary",
  },
}

// ============================================================================
// MAINTENANCE STATUS MAPPINGS
// ============================================================================

export const maintenanceStatusConfigMap: Record<string, StatusConfig> = {
  PENDING: {
    label: "Pending",
    variant: "secondary",
  },
  IN_PROGRESS: {
    label: "In Progress",
    variant: "warning",
  },
  SCHEDULED: {
    label: "Scheduled",
    variant: "secondary",
  },
  COMPLETED: {
    label: "Completed",
    variant: "success",
  },
  CANCELLED: {
    label: "Cancelled",
    variant: "destructive",
  },
}

export const maintenancePriorityConfigMap: Record<string, StatusConfig> = {
  LOW: {
    label: "Low",
    variant: "outline",
  },
  MEDIUM: {
    label: "Medium",
    variant: "secondary",
  },
  HIGH: {
    label: "High",
    variant: "warning",
  },
  CRITICAL: {
    label: "Critical",
    variant: "destructive",
  },
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Get badge configuration for a status value
 * @param statusMap - The status configuration map
 * @param value - The status value
 * @param defaultConfig - Default config if value not found
 * @returns Status configuration object
 */
export function getStatusConfig(
  statusMap: Record<string, StatusConfig>,
  value: string | undefined | null,
  defaultConfig: StatusConfig = {
    label: "Unknown",
    variant: "default",
  },
): StatusConfig {
  if (!value) return defaultConfig
  return statusMap[value] || defaultConfig
}

/**
 * Get the badge variant for a status
 * @param statusMap - The status configuration map
 * @param value - The status value
 * @returns Badge variant
 */
export function getStatusVariant(
  statusMap: Record<string, StatusConfig>,
  value: string | undefined | null,
): BadgeVariant {
  return getStatusConfig(statusMap, value).variant
}

/**
 * Get the label for a status
 * @param statusMap - The status configuration map
 * @param value - The status value
 * @returns Status label
 */
export function getStatusLabel(
  statusMap: Record<string, StatusConfig>,
  value: string | undefined | null,
): string {
  return getStatusConfig(statusMap, value).label
}

/**
 * Get custom color classes for a status (if available)
 * @param statusMap - The status configuration map
 * @param value - The status value
 * @returns Color classes string or undefined
 */
export function getStatusColors(
  statusMap: Record<string, StatusConfig>,
  value: string | undefined | null,
): { bg?: string; text?: string; border?: string } {
  const config = getStatusConfig(statusMap, value)
  return {
    bg: config.bgColor,
    text: config.textColor,
    border: config.borderColor,
  }
}
