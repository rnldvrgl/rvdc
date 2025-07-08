import { NavigationEntry, ShortcutEntry } from '@/lib/constants/types'
import {
  Boxes,
  Building2,
  Handshake,
  Layers,
  LayoutDashboard,
  PackageCheck,
  PlusCircle,
  Settings,
  Store,
  Truck,
  UserCog,
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
    icon: Handshake,
    permission: 'view_clients',
  },
  technicians: {
    name: 'Technicians',
    href: '/technicians',
    icon: UserCog,
    permission: 'view_technicians',
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
        icon: PackageCheck,
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
    name: 'Add new client',
    action: 'addClient',
    icon: PlusCircle,
    permission: 'shortcut_add_client',
  },
]
