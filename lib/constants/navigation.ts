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

export const navigation = [
  { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { name: 'Clients', href: '/clients', icon: Users },
  { name: 'Technicians', href: '/technicians', icon: User2 },
  {
    name: 'Inventory',
    icon: Package,
    children: [
      { name: 'Items', href: '/inventory/items', icon: Boxes },
      {
        name: 'Item Categories',
        href: '/inventory/categories',
        icon: ListTree,
      },
      { name: 'Stocks', href: '/inventory/stocks', icon: Warehouse },
    ],
  },
  {
    name: 'Settings',
    href: '/settings',
    icon: Settings,
  },
]

export const shortcuts = [
  { name: 'Add new client', action: 'addClient', icon: PlusCircle },
]
