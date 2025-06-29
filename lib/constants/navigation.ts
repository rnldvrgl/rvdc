import { LayoutDashboard, Link2, ListChecks, Settings } from 'lucide-react'

export const navigation = [
  { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { name: 'Details', href: '/details', icon: ListChecks },
  { name: 'Settings', href: '/settings', icon: Settings },
]

export const shortcuts = [
  { name: 'Add new user', href: '#', icon: Link2 },
  { name: 'Workspace usage', href: '#', icon: Link2 },
  { name: 'Cost spend control', href: '#', icon: Link2 },
  { name: 'Overview – Rows written', href: '#', icon: Link2 },
]
