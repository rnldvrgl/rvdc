import { NavigationEntry, NavigationSection } from "@/lib/constants/types"
import {
    AlertTriangle,
    Banknote,
    BookOpen,
    Boxes,
    Building2,
    Cake,
    CalendarDays,
    CircleDollarSign,
    ClipboardList,
    Clock,
    Coins,
    CreditCard,
    FileSpreadsheet,
    FileText,
    Hand,
    Keyboard,
    Layers,
    LayoutDashboard,
    Lock,
    Package,
    Plane,
    Server,
    Settings,
    Store,
    Users,
    Warehouse,
    Video,
    Wind,
    Wrench,
} from "lucide-react"

export const baseNavigation: Record<string, NavigationEntry> = {
  // ── Main ──
  dashboard: {
    name: "Dashboard",
    href: "/dashboard",
    icon: LayoutDashboard,
    permission: "view_dashboard",
  },

  // ── Operations ──
  sales: {
    name: "Sales",
    href: "/sales",
    icon: CircleDollarSign,
    permission: "view_sales",
  },
  services: {
    name: "Services",
    href: "/services",
    icon: Wrench,
    permission: "view_services",
  },
  quotations: {
    name: "Quotations",
    href: "/quotations",
    icon: FileText,
    permission: "view_quotations",
  },
  companyAssets: {
    name: "Company Assets",
    href: "/company-assets",
    icon: Building2,
    permission: "view_services",
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
        href: "/receivables/payment-collection",
        icon: CreditCard,
        permission: "view_payment_collection",
      },
    ],
  },

  // ── Finance ──
  expenses: {
    name: "Expenses",
    icon: Coins,
    children: [
      {
        name: "Manage Expenses",
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
  payroll: {
    name: "Payroll",
    icon: Banknote,
    children: [
      {
        name: "Weekly Payroll",
        href: "/payroll/weekly",
        icon: CircleDollarSign,
        permission: "manage_payroll",
      },
      {
        name: "My Payslips",
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
        name: "Deductions",
        href: "/payroll/deductions",
        icon: Banknote,
        permission: "manage_deductions",
      },
      {
        name: "Government Benefits",
        href: "/settings/government-benefits",
        icon: Banknote,
        permission: "manage_government_benefits",
      },
    ],
  },

  // ── People ──
  clients: {
    name: "Clients",
    href: "/clients",
    icon: Users,
    permission: "view_clients",
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
        href: "/attendance/records",
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
        permission: "manage_attendance_leaves",
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
        name: "Work Requests",
        href: "/attendance/work-requests",
        icon: Hand,
        permission: "manage_attendance_admin",
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
      {
        name: "Holidays",
        href: "/settings/holidays",
        icon: CalendarDays,
        permission: "manage_holidays",
      },
      {
        name: "Calendar Events",
        href: "/settings/calendar-events",
        icon: CalendarDays,
        permission: "manage_calendar_events",
      },
    ],
  },

  // ── Inventory ──
  aircons: {
    name: "Aircon Units",
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
      {
        name: "Stock Requests",
        href: "/inventory/stock-requests",
        icon: ClipboardList,
        permission: "view_items",
      },
    ],
  },

  // ── Insights ──
  reports: {
    name: "Reports",
    href: "/reports",
    icon: FileSpreadsheet,
    permission: "view_reports",
  },
  shortcuts: {
    name: "Shortcuts",
    href: "/shortcuts",
    icon: Keyboard,
    permission: "view_shortcuts",
  },
  changelog: {
    name: "Changelog",
    href: "/changelog",
    icon: BookOpen,
    permission: "view_dashboard",
  },

  // ── Admin ──
  templates: {
    name: "Templates",
    href: "/settings/templates",
    icon: FileText,
    permission: "manage_job_order_templates",
  },
  applianceTypes: {
    name: "Appliance Types",
    href: "/settings/appliance-types",
    icon: Wrench,
    permission: "manage_appliance_types",
  },
  surveillance: {
    name: "Surveillance",
    href: "/surveillance",
    icon: Video,
    permission: "manage_surveillance",
  },
  bulkUpdate: {
    name: "Bulk Update",
    href: "/settings/bulk-update",
    icon: Layers,
    permission: "manage_bulk_update",
  },
  system: {
    name: "System",
    icon: Server,
    children: [
      {
        name: "System Settings",
        href: "/settings/system",
        icon: Cake,
        permission: "manage_system_settings",
      },
      {
        name: "Maintenance",
        href: "/settings/maintenance",
        icon: Server,
        permission: "manage_server_maintenance",
        superAdminOnly: true,
      },
      {
        name: "Active Sessions",
        href: "/settings/sessions",
        icon: Lock,
        permission: "manage_user_sessions",
      },
    ],
  },
}

// Sectioned navigation for sidebar grouping
export const sectionedNavigation: NavigationSection[] = [
  {
    items: [baseNavigation.dashboard],
  },
  {
    title: "Operations",
    items: [
      baseNavigation.sales,
      baseNavigation.services,
      baseNavigation.quotations,
      baseNavigation.companyAssets,
      baseNavigation.receivables,
    ],
  },
  {
    title: "Finance",
    items: [baseNavigation.expenses, baseNavigation.payroll],
  },
  {
    title: "People",
    items: [
      baseNavigation.clients,
      baseNavigation.employees,
      baseNavigation.attendance,
    ],
  },
  {
    title: "Inventory",
    items: [baseNavigation.aircons, baseNavigation.inventory],
  },
  {
    title: "Insights",
    items: [baseNavigation.reports, baseNavigation.shortcuts, baseNavigation.changelog],
  },
  {
    title: "Admin",
    items: [
      baseNavigation.templates,
      baseNavigation.applianceTypes,
      baseNavigation.bulkUpdate,
    //   baseNavigation.surveillance,
      baseNavigation.system,
    ],
  },
]

// Flat ordered navigation (for search, command palette, etc.)
export const orderedNavigation: NavigationEntry[] =
  sectionedNavigation.flatMap((s) => s.items)
