import { NavigationEntry, ShortcutEntry } from '@/lib/constants/types'
import {
  Banknote,
  Boxes,
  CalendarDays,
  CircleDollarSign,
  Coins,
  FileText,
  Layers,
  LayoutDashboard,
  Package,
  Repeat,
  Settings,
  Store,
  Users,
  Warehouse,
  Wind,
  Wrench,
} from 'lucide-react'

export const baseNavigation: Record<string, NavigationEntry> = {
  dashboard: {
    name: 'Dashboard',
    href: '/dashboard',
    icon: LayoutDashboard,
  },
  sales: {
    name: 'Sales',
    href: '/sales',
    icon: CircleDollarSign,
    permission: 'view_sales',
  },
  receivables: {
    name: 'Receivables',
    icon: Banknote,
    children: [
      {
        name: 'Remittances',
        href: '/receivables/remittances',
        icon: Banknote,
        permission: 'view_remittances',
      },
      {
        name: 'Cheque Collections',
        href: '/receivables/cheques',
        icon: FileText,
        permission: 'view_cheque_collections',
      },
    ],
  },
  expenses: {
    name: 'Expenses',
    href: '/expenses',
    icon: Coins,
    permission: 'view_expenses',
  },
  clients: {
    name: 'Clients',
    href: '/clients',
    icon: Users,
    permission: 'view_clients',
  },
  technicians: {
    name: 'Technicians',
    href: '/technicians',
    icon: Users,
    permission: 'view_technicians',
  },
  attendance: {
    name: 'Attendance',
    href: '/attendance',
    icon: CalendarDays,
    permission: 'view_attendance',
  },
  services: {
    name: 'Services',
    href: '/services',
    icon: Wrench,
    permission: 'view_services',
  },
  aircons: {
    name: 'Airconditioning',
    icon: Wind,
    children: [
      {
        name: 'Brands',
        href: '/aircons/brands',
        icon: Layers,
        permission: 'view_aircon_brands',
      },
      {
        name: 'Models',
        href: '/aircons/models',
        icon: Boxes,
        permission: 'view_aircon_models',
      },
      {
        name: 'Units',
        href: '/aircons/units',
        icon: Package,
        permission: 'view_aircon_units',
      },
      {
        name: 'Installations',
        href: '/aircons/installations',
        icon: Wrench,
        permission: 'view_aircon_installations',
      },
    ],
  },
  inventory: {
    name: 'Inventory',
    icon: Boxes,
    children: [
      {
        name: 'Stockroom',
        href: '/inventory/stocks/stockroom',
        icon: Warehouse,
        permission: 'view_stockroom',
      },
      {
        name: 'Stall Stocks',
        href: '/inventory/stocks/stall',
        icon: Store,
        permission: 'view_stallstocks',
      },
      {
        name: 'Transfers',
        href: '/inventory/stocks/transfer',
        icon: Repeat,
        permission: 'manage_stock_transfer',
      },
      {
        name: 'Items',
        href: '/inventory/items',
        icon: Package,
        permission: 'view_items',
      },
      {
        name: 'Categories',
        href: '/inventory/categories',
        icon: Layers,
        permission: 'view_categories',
      },
    ],
  },
  stalls: {
    name: 'Stalls',
    href: '/stalls',
    icon: Store,
    permission: 'view_stalls',
  },
  settings: {
    name: 'Settings',
    href: '/settings',
    icon: Settings,
    permission: 'view_settings',
  },
}

export const baseShortcuts: ShortcutEntry[] = [
  {
    name: 'New Sale',
    action: 'addSale',
    icon: CircleDollarSign,
    permission: 'shortcut_add_sale',
  },
  {
    name: 'New Service',
    action: 'addService',
    icon: Wrench,
    permission: 'shortcut_add_service',
  },
  {
    name: 'Log Expense',
    action: 'addExpense',
    icon: Coins,
    permission: 'shortcut_add_expense',
  },
  {
    name: 'Record Remittance',
    action: 'addRemittance',
    icon: Banknote,
    permission: 'shortcut_add_remittance',
  },
  {
    name: 'Record Cheque Collection',
    action: 'addChequeCollection',
    icon: FileText,
    permission: 'shortcut_add_cheque_collection',
  },
  {
    name: 'New Client',
    action: 'addClient',
    icon: Users,
    permission: 'shortcut_add_client',
  },
  {
    name: 'New Stock Transfer',
    action: 'addTransfer',
    icon: Repeat,
    permission: 'shortcut_add_transfer',
  },
]
