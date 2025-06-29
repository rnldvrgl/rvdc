import { LayoutDashboard, Link2, ListChecks, Settings } from 'lucide-react'

export const navigation = [
  { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { name: 'Details', href: '/details', icon: ListChecks },
  { name: 'Settings', href: '/settings', icon: Settings },
]

// Now uses `action` instead of `href`
export const shortcuts = [
  { name: 'Add new client', action: 'addClient', icon: Link2 },
]
