/**
 * Service-related helper functions and constants
 */

// --- Service Type Labels ---
export const serviceTypeLabels: Record<string, string> = {
  repair: "Repair",
  dismantle: "Dismantle",
  inspection: "Inspection",
  cleaning: "Cleaning",
  motor_rewind: "Motor Rewind",
  installation: "Installation",
}

// --- Service Type Colors ---
export const serviceTypeColors: Record<string, string> = {
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

// --- Service Mode Labels ---
export const serviceModeLabels: Record<string, string> = {
  home_service: "Home Service",
  carry_in: "Carry In",
  pull_out: "Pull-Out",
}

// --- Service Status Labels ---
export const serviceStatusLabels: Record<string, string> = {
  pending: "Pending",
  in_progress: "In Progress",
  completed: "Completed",
  cancelled: "Cancelled",
}

/**
 * Get the Tailwind color classes for a service type badge
 */
export function getServiceTypeBadgeClass(serviceType: string): string {
  return serviceTypeColors[serviceType] || ""
}

/**
 * Get the display label for a service type
 */
export function getServiceTypeLabel(serviceType: string): string {
  return serviceTypeLabels[serviceType] || serviceType
}

/**
 * Get the display label for a service mode
 */
export function getServiceModeLabel(serviceMode: string): string {
  return serviceModeLabels[serviceMode] || serviceMode
}

/**
 * Get the display label for a service status
 */
export function getServiceStatusLabel(serviceStatus: string): string {
  return serviceStatusLabels[serviceStatus] || serviceStatus
}
