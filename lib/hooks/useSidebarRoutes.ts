import { UsersIcon } from 'lucide-react'
import { useMemo } from 'react'

type SidebarRoute = {
  icon: any
  label: string
  path?: string
  routes?: Omit<SidebarRoute, 'icon'>[]
}

const useSidebarRoutes = (): SidebarRoute[] => {
  const sidebarRoutes: SidebarRoute[] = useMemo(
    () => [
      {
        icon: UsersIcon,
        label: 'Dashboard',
        path: '/dashboard/',
      },
      {
        icon: UsersIcon,
        label: 'Applications',
        routes: [
          {
            label: 'All',
            path: '/applications/',
          },
          {
            label: 'Pending Requests',
            path: '/applications/pending/',
          },
        ],
      },
      {
        icon: UsersIcon,
        label: 'Payments',
        routes: [
          {
            label: 'Pending',
            path: '/payments/pending/',
          },
          {
            label: 'Processing',
            path: '/payments/processing/',
          },
          {
            label: 'Transactions',
            path: '/payments/transaction/',
          },
        ],
      },
      {
        icon: UsersIcon,
        label: 'Clients',
        routes: [
          {
            label: 'All',
            path: '/clients/',
          },
        ],
      },
      {
        icon: UsersIcon,
        label: 'Inventory',
        path: '/inventory/',
      },
      {
        icon: UsersIcon,
        label: 'Services',
        path: '/services/',
      },
    ],
    [],
  )

  return sidebarRoutes
}

export default useSidebarRoutes
