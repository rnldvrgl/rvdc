import { Roles } from "@/lib/constants/types";
import { useMemo } from "react";

export function useGetPermissions(role: Roles) {
	return useMemo(() => {
		const commonViewPermissions = [
			"view_clients",
			"view_technicians",
			"view_items",
			"view_stallstocks",
			"view_settings",
			"view_expenses",
			"view_sales",
			"view_remittances",
			"view_cheque_collections",
		];

		const commonShortcuts = [
			"shortcut_add_client",
			"shortcut_add_expense",
			"shortcut_add_sale",
			"shortcut_add_remittance",
			"shortcut_add_cheque_collection",
		];

		const permissionsMap: Record<Roles, string[]> = {
			admin: [
				...commonViewPermissions,
				...commonShortcuts,
				"view_stockroom",
				"view_categories",
				"view_stalls",
				"view_services",
				"view_service_appliances",
				"view_aircon_installations",
				"view_motor_rewinds",
				"view_home_service_schedules",
				"view_service_status_history",
				"shortcut_add_home_schedule",
				"shortcut_add_service",
				"view_aircon_brands",
				"view_aircon_models",
				"view_aircon_units",
				"view_aircon_installations",
				"view_payroll",

				"manage_payroll_settings",
				"manage_holidays",
				"manage_attendance_admin",
			],
			manager: [
				...commonViewPermissions,
				...commonShortcuts,
				"manage_stock_transfer",
				"shortcut_add_transfer",
				"view_services",
				"view_service_appliances",
				"view_aircon_installations",
				"view_motor_rewinds",
				"view_home_service_schedules",
				"view_service_status_history",
				"shortcut_add_home_schedule",
				"shortcut_add_service",
				"view_aircon_brands",
				"view_aircon_models",
				"view_aircon_units",
				"view_aircon_installations",
			],
			clerk: [
				...commonViewPermissions,
				...commonShortcuts,
				"manage_stock_transfer",
				"shortcut_add_transfer",
			],
			guest: [],
		};

		return permissionsMap[role] || [];
	}, [role]);
}
