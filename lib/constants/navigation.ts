import { NavigationEntry, ShortcutEntry } from '@/lib/constants/types'
import {
  Boxes,
  LayoutDashboard,
  ListTree,
  Package,
  PlusCircle,
  Settings,
  User2,
  Users,
  Warehouse,
} from 'lucide-react'

export const baseNavigation: Record<string, NavigationEntry> = {
  dashboard: {
    name: 'Dashboard',
    href: '/dashboard',
    icon: LayoutDashboard,
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
    icon: User2,
    permission: 'view_technicians',
  },
  inventory: {
    name: 'Inventory',
    icon: Package,
    children: [
      {
        name: 'Stocks (Stock Room)',
        href: '/inventory/stocks/stockroom',
        icon: Warehouse,
        permission: 'view_stockroom',
      },
      {
        name: 'Items',
        href: '/inventory/items',
        icon: Boxes,
        permission: 'view_items',
      },
      {
        name: 'Item Categories',
        href: '/inventory/categories',
        icon: ListTree,
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
    name: 'Add new client',
    action: 'addClient',
    icon: PlusCircle,
    permission: 'shortcut_add_client',
  },
]
