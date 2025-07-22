import { NavigationEntry, ShortcutEntry } from '@/lib/constants/types'
import {
  Banknote,
  Boxes,
  Building2,
  CalendarCheck2,
  CalendarDays,
  CircleDollarSign,
  Coins,
  FileText,
  Hammer,
  Layers,
  LayoutDashboard,
  MonitorSmartphone,
  Package,
  Repeat,
  Settings,
  Store,
  UserPlus,
  Users,
  Warehouse,
  Wrench,
} from 'lucide-react'

export const baseNavigation: Record<string, NavigationEntry> = {
  dashboard: {
    name: 'Dashboard',
    href: '/dashboard',
    icon: LayoutDashboard,
  },
  pos: {
    name: 'POS Terminal',
    href: '/pos',
    icon: MonitorSmartphone,
    permission: 'use_pos',
  },
  sales: {
    name: 'Sales Records',
    href: '/sales',
    icon: FileText,
    permission: 'view_sales',
  },
  remittances: {
    name: 'Remittances',
    href: '/remittances',
    icon: Banknote,
    permission: 'view_remittances',
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
  attendance: {
    name: 'Attendance',
    href: '/attendance',
    icon: CalendarDays,
    permission: 'view_attendance',
  },
  repairs: {
    name: 'Repair Orders',
    href: '/repairs',
    icon: Wrench,
    permission: 'view_repairs',
  },
  scheduling: {
    name: 'Service Appointments',
    href: '/scheduling',
    icon: CalendarCheck2,
    permission: 'view_scheduling',
  },
  technicians: {
    name: 'Technicians',
    href: '/technicians',
    icon: Hammer,
    permission: 'view_technicians',
  },
  stalls: {
    name: 'Stalls',
    href: '/stalls',
    icon: Building2,
    permission: 'view_stalls',
  },
  inventory: {
    name: 'Inventory',
    icon: Boxes,
    children: [
      {
        name: 'Stock Room',
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
        name: 'Stock Transfer',
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
        name: 'Item Categories',
        href: '/inventory/categories',
        icon: Layers,
        permission: 'view_categories',
      },
    ],
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
    name: 'Add Sale',
    action: 'addSale',
    icon: CircleDollarSign,
    permission: 'shortcut_add_sale',
  },
  {
    name: 'Add Expense',
    action: 'addExpense',
    icon: Coins,
    permission: 'shortcut_add_expense',
  },
  {
    name: 'Add Client',
    action: 'addClient',
    icon: UserPlus,
    permission: 'shortcut_add_client',
  },
  {
    name: 'Add Transfer',
    action: 'addTransfer',
    icon: Repeat,
    permission: 'shortcut_add_transfer',
  },
]
