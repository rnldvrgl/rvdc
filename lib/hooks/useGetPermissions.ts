import { Roles } from "@/lib/constants/types"
import { useMemo } from "react"

export function useGetPermissions(
  role: Roles,
  includeInPayroll: boolean = true,
) {
  return useMemo(() => {
    // Common permissions for all roles (Admin, Manager, Clerk, Technician)
    const commonPermissions = ["view_settings", "view_dashboard"]

    // Employees Permissions (includes Manager, Clerk, and Technician)
    const commonEmployeePermissions = [
      ...(includeInPayroll
        ? ["view_payroll", "manage_attendance", "view_own_offenses"]
        : []),
    ]

    // Admin, Manager, and Clerk permissions
    const commonManagementPermissions = [
      "view_expenses",
      "view_clients",
      "view_items",
      "view_stall_stocks",
      "view_sales",
      "view_services",
      //   "view_remittances",
    ]

    // Admin & Manager permissions
    const commonAdminPermissions = [
      "manage_holidays",
      "manage_cheque_collections",
      "manage_appliance_types",
      "manage_payroll",
      "manage_aircon_brands",
      "manage_aircon_models",
      "manage_aircon_units",
      "view_warranty_claims",
      "view_cheque_collections",
      "view_remittances",
      "view_reports",
    ]

    // Admin, Manager, and Clerk permissions for shortcuts
    const commonShortcuts = [
      "shortcut_add_client",
      "shortcut_add_expense",
      "shortcut_add_sale",
      "shortcut_add_remittance",
      "shortcut_add_service",
    ]

    const permissionsMap: Record<Roles, string[]> = {
      admin: [
        ...commonAdminPermissions,
        ...commonShortcuts,
        ...commonManagementPermissions,
        ...commonPermissions,
        "manage_calendar_events",
        "view_employees",
        "manage_stockroom",
        "manage_categories",
        "manage_stalls",
        "manage_expense_categories",
        "manage_payroll_settings",
        "manage_deductions",
        "manage_attendance_admin",
        "manage_government_benefits",
        "manage_tax_brackets",
        "manage_system_settings",
      ],
      manager: [
        ...commonAdminPermissions,
        ...commonEmployeePermissions,
        ...commonShortcuts,
        ...commonManagementPermissions,
        ...commonPermissions,
      ],
      clerk: [
        ...commonEmployeePermissions,
        ...commonManagementPermissions,
        ...commonShortcuts,
        ...commonPermissions,
      ],
      technician: [...commonEmployeePermissions, ...commonPermissions],
      guest: [],
    }

    return permissionsMap[role] || []
  }, [role, includeInPayroll])
}
