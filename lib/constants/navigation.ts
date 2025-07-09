import { NavigationEntry, ShortcutEntry } from '@/lib/constants/types'
import {
  Boxes,
  Building2,
  CalendarClock,
  Clock,
  Coins,
  FilePlus,
  Layers,
  LayoutDashboard,
  Package,
  Receipt,
  Settings,
  ShoppingCart,
  Store,
  Truck,
  UserCog,
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
  expenses: {
    name: 'Expenses',
    href: '/expenses',
    icon: Receipt,
    permission: 'view_expenses',
  },
  sales: {
    name: 'POS Sales',
    href: '/sales',
    icon: ShoppingCart,
    permission: 'view_sales',
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
    icon: CalendarClock,
    permission: 'view_scheduling',
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
        icon: Truck,
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
  clients: {
    name: 'Clients',
    href: '/clients',
    icon: Users,
    permission: 'view_clients',
  },
  attendance: {
    name: 'Attendance',
    href: '/attendance',
    icon: Clock,
    permission: 'view_attendance',
  },
  technicians: {
    name: 'Technicians',
    href: '/technicians',
    icon: UserCog,
    permission: 'view_technicians',
  },
  stalls: {
    name: 'Stalls',
    href: '/stalls',
    icon: Building2,
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
    name: 'Add Client',
    action: 'addClient',
    icon: FilePlus,
    permission: 'shortcut_add_client',
  },
  {
    name: 'Add Expense',
    action: 'addExpense',
    icon: Coins,
    permission: 'shortcut_add_expense',
  },
  {
    name: 'Add Transfer',
    action: 'addTransfer',
    icon: Truck,
    permission: 'shortcut_add_transfer',
  },
]
