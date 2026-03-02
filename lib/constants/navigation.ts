import { NavigationEntry, ShortcutEntry } from "@/lib/constants/types"
import {
  AlertTriangle,
  Banknote,
  Boxes,
  Cake,
  CalendarDays,
  CircleDollarSign,
  Clock,
  Coins,
  CreditCard,
  FileSpreadsheet,
  FileText,
  Layers,
  LayoutDashboard,
  Package,
  Plane,
  Settings,
  ShieldCheck,
  Store,
  Users,
  Warehouse,
  Wind,
  Wrench,
} from "lucide-react"

export const baseNavigation: Record<string, NavigationEntry> = {
  dashboard: {
    name: "Dashboard",
    href: "/dashboard",
    icon: LayoutDashboard,
    permission: "view_dashboard",
  },
  sales: {
    name: "Sales",
    href: "/sales",
    icon: CircleDollarSign,
    permission: "view_sales",
  },
  receivables: {
    name: "Receivables",
    icon: Banknote,
    children: [
      {
        name: "Remittances",
        href: "/receivables/remittances",
        icon: Banknote,
        permission: "view_remittances",
      },
      {
        name: "Cheque Collections",
        href: "/receivables/cheques",
        icon: FileText,
        permission: "view_cheque_collections",
      },
      {
        name: "Payment Collection",
        href: "/receivables/collection",
        icon: CreditCard,
        permission: "view_remittances",
      },
    ],
  },
  expenses: {
    name: "Expenses",
    icon: Coins,
    children: [
      {
        name: "All Expenses",
        href: "/expenses/manage",
        icon: Coins,
        permission: "view_expenses",
      },
      {
        name: "Categories",
        href: "/expenses/categories",
        icon: Layers,
        permission: "manage_expense_categories",
      },
    ],
  },
  clients: {
    name: "Clients",
    href: "/clients",
    icon: Users,
    permission: "view_clients",
  },
  reports: {
    name: "Reports",
    href: "/reports",
    icon: FileSpreadsheet,
    permission: "view_reports",
  },
  payroll: {
    name: "Payroll",
    icon: LayoutDashboard,
    children: [
      {
        name: "Weekly Payroll",
        href: "/payroll/weekly",
        icon: CircleDollarSign,
        permission: "manage_payroll",
      },
      {
        name: "My Payroll",
        href: "/payroll/slip",
        icon: FileText,
        permission: "view_payroll",
      },
      {
        name: "Payroll Settings",
        href: "/payroll/settings",
        icon: Settings,
        permission: "manage_payroll_settings",
      },
      {
        name: "Holidays",
        href: "/payroll/holidays",
        icon: FileText,
        permission: "manage_holidays",
      },
      {
        name: "Deductions",
        href: "/payroll/deductions",
        icon: Banknote,
        permission: "manage_deductions",
      },
    ],
  },
  employees: {
    name: "Employees",
    href: "/employees",
    icon: Users,
    permission: "view_employees",
  },
  attendance: {
    name: "Attendance",
    icon: CalendarDays,
    children: [
      {
        name: "Overview",
        href: "/attendance/overview",
        icon: CalendarDays,
        permission: "manage_attendance_admin",
      },
      {
        name: "Timetable",
        href: "/attendance/timetable",
        icon: CalendarDays,
        permission: "manage_attendance",
      },
      {
        name: "Leaves",
        href: "/attendance/leaves",
        icon: Plane,
        permission: "manage_attendance",
      },
      {
        name: "Overtime Requests",
        href: "/attendance/overtime",
        icon: Clock,
        permission: "manage_attendance_admin",
      },
      {
        name: "My Overtime",
        href: "/attendance/my-overtime",
        icon: Clock,
        permission: "manage_attendance",
      },
      {
        name: "Offenses",
        href: "/attendance/offenses",
        icon: AlertTriangle,
        permission: "manage_attendance_admin",
      },
      {
        name: "My Offenses",
        href: "/attendance/my-offenses",
        icon: AlertTriangle,
        permission: "view_own_offenses",
      },
    ],
  },
  services: {
    name: "Services",
    href: "/services",
    icon: Wrench,
    permission: "view_services",
  },
  aircons: {
    name: "Airconditioning",
    icon: Wind,
    children: [
      {
        name: "Brands",
        href: "/aircons/brands",
        icon: Layers,
        permission: "manage_aircon_brands",
      },
      {
        name: "Models",
        href: "/aircons/models",
        icon: Boxes,
        permission: "manage_aircon_models",
      },
      {
        name: "Units",
        href: "/aircons/units",
        icon: Package,
        permission: "manage_aircon_units",
      },
      {
        name: "Warranty & Cleaning",
        href: "/warranty-claims",
        icon: ShieldCheck,
        permission: "view_warranty_claims",
      },
    ],
  },
  inventory: {
    name: "Inventory",
    icon: Boxes,
    children: [
      {
        name: "Stockroom",
        href: "/inventory/stocks/stockroom",
        icon: Warehouse,
        permission: "manage_stockroom",
      },
      {
        name: "Stall Stocks",
        href: "/inventory/stocks/stall",
        icon: Store,
        permission: "view_stall_stocks",
      },
      {
        name: "Items",
        href: "/inventory/items",
        icon: Package,
        permission: "view_items",
      },
      {
        name: "Categories",
        href: "/inventory/categories",
        icon: Layers,
        permission: "manage_categories",
      },
    ],
  },
  settings: {
    name: "Settings",
    icon: Settings,
    children: [
      {
        name: "User Profile",
        href: "/settings/profile",
        icon: Settings,
        permission: "view_settings",
      },
      {
        name: "Appliance Types",
        href: "/settings/appliance-types",
        icon: Wrench,
        permission: "manage_appliance_types",
      },
      {
        name: "Government Benefits",
        href: "/settings/government-benefits",
        icon: Banknote,
        permission: "manage_government_benefits",
      },
      {
        name: "Tax Brackets",
        href: "/settings/tax-brackets",
        icon: CircleDollarSign,
        permission: "manage_tax_brackets",
      },
      {
        name: "Calendar Events",
        href: "/settings/calendar-events",
        icon: CalendarDays,
        permission: "manage_calendar_events",
      },
      {
        name: "Birthday Greeting",
        href: "/settings/system",
        icon: Cake,
        permission: "manage_system_settings",
      },
    ],
  },
}

// Ordered navigation array to maintain consistent sidebar sorting with better business hierarchy
export const orderedNavigation: NavigationEntry[] = [
  baseNavigation.dashboard,
  // Core Business Operations
  baseNavigation.sales,
  baseNavigation.services,
  baseNavigation.receivables,
  baseNavigation.expenses,
  baseNavigation.inventory,
  baseNavigation.aircons,
  // Customer & People Management
  baseNavigation.clients,
  baseNavigation.employees,
  // HR & Operations
  baseNavigation.payroll,
  baseNavigation.attendance,
  // System Management
  baseNavigation.reports,
  baseNavigation.settings,
]

export const baseShortcuts: ShortcutEntry[] = [
  // 	{
  // 		name: "New Sale",
  // 		action: "addSale",
  // 		icon: CircleDollarSign,
  // 		permission: "shortcut_add_sale",
  // 	},
  // 	{
  // 		name: "New Service",
  // 		action: "addService",
  // 		icon: Wrench,
  // 		permission: "shortcut_add_service",
  // 	},
  // 	{
  // 		name: "Log Expense",
  // 		action: "addExpense",
  // 		icon: Coins,
  // 		permission: "shortcut_add_expense",
  // 	},
  // 	{
  // 		name: "Record Remittance",
  // 		action: "addRemittance",
  // 		icon: Banknote,
  // 		permission: "shortcut_add_remittance",
  // 	},
  // 	{
  // 		name: "Record Cheque Collection",
  // 		action: "addChequeCollection",
  // 		icon: FileText,
  // 		permission: "shortcut_add_cheque_collection",
  // 	},
  // 	{
  // 		name: "New Client",
  // 		action: "addClient",
  // 		icon: Users,
  // 		permission: "shortcut_add_client",
  // 	},
  // 	{
  // 		name: "New Stock Transfer",
  // 		action: "addTransfer",
  // 		icon: Repeat,
  // 		permission: "shortcut_add_transfer",
  // },
]
