import { Roles } from "@/lib/constants/types"
import { useMemo } from "react"

export function useGetPermissions(
  role: Roles,
  includeInPayroll: boolean = true,
) {
  return useMemo(() => {
    // Common permissions across multiple roles
    const commonViewPermissions = [
      "view_clients",
      "view_items",
      "view_stall_stocks",
      "view_settings",
      "view_sales",
      "view_services",
    ]

    const commonFinancialPermissions = [
      "view_expenses",
      //   "view_remittances",
      //   "view_cheque_collections",
    ]

    const commonAirconPermissions = [
      "manage_aircon_brands",
      "manage_aircon_models",
      "manage_aircon_units",
      "view_warranty_claims",
    ]

    const commonEmployeePermissions = [
      ...(includeInPayroll
        ? ["view_payroll", "manage_attendance", "view_own_offenses"]
        : []),
    ]

    const commonManagementPermissions = [
      "manage_holidays",
      "manage_cheque_collections",
      "manage_appliance_types",
      ...(includeInPayroll ? ["manage_payroll"] : []),
    ]

    const commonShortcuts = [
      "shortcut_add_client",
      "shortcut_add_expense",
      "shortcut_add_sale",
      "shortcut_add_remittance",
      "shortcut_add_service",
    ]

    const permissionsMap: Record<Roles, string[]> = {
      admin: [
        ...commonViewPermissions,
        ...commonFinancialPermissions,
        ...commonAirconPermissions,
        ...commonShortcuts,
        ...commonManagementPermissions,
        "manage_calendar_events",
        "view_employees",
        "manage_stockroom",
        "manage_categories",
        "manage_stalls",
        "manage_expense_categories",
        // Admin always has access to payroll management regardless of includeInPayroll flag
        "manage_payroll_settings",
        "manage_deductions",
        "manage_attendance_admin",
        "manage_government_benefits",
        "manage_tax_brackets",
      ],
      manager: [
        ...commonViewPermissions,
        ...commonFinancialPermissions,
        ...commonAirconPermissions,
        ...commonEmployeePermissions,
        ...commonShortcuts,
        ...commonManagementPermissions,
      ],
      clerk: [
        ...commonViewPermissions,
        ...commonFinancialPermissions,
        ...commonEmployeePermissions,
        ...commonShortcuts,
      ],
      technician: [...commonEmployeePermissions],
      guest: [],
    }

    return permissionsMap[role] || []
  }, [role, includeInPayroll])
}
