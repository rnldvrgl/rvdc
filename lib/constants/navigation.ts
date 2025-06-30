import { LayoutDashboard, Link2, Settings, User2, Users } from 'lucide-react'

export const navigation = [
  { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { name: 'Clients', href: '/clients', icon: Users },
  { name: 'Technicians', href: '/technicians', icon: User2 },
  {
    name: 'Settings',
    href: '/settings',
    icon: Settings,
  },
]

// Now uses `action` instead of `href`
export const shortcuts = [
  { name: 'Add new client', action: 'addClient', icon: Link2 },
]
