import { LayoutDashboard, Link2, User2, Users } from 'lucide-react'

export const navigation = [
  { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { name: 'Clients', href: '/clients', icon: Users },
  { name: 'Technicians', href: '/technicians', icon: User2 },
]

// Now uses `action` instead of `href`
export const shortcuts = [
  { name: 'Add new client', action: 'addClient', icon: Link2 },
]
