import { Roles } from '@/lib/constants/types'
import { useMemo } from 'react'

export function useGetPermissions(role: Roles) {
  return useMemo(() => {
    const commonViewPermissions = [
      'view_clients',
      'view_technicians',
      'view_items',
      'view_stallstocks',
      'view_settings',
      'view_expenses',
      'view_sales',
      'view_remittances',
    ]

    const commonShortcuts = [
      'shortcut_add_client',
      'shortcut_add_expense',
      'shortcut_add_sale',
    ]

    const permissionsMap: Record<Roles, string[]> = {
      admin: [
        ...commonViewPermissions,
        ...commonShortcuts,
        'view_stockroom',
        'view_categories',
        'view_stalls',
      ],
      manager: [
        ...commonViewPermissions,
        ...commonShortcuts,
        'manage_stock_transfer',
        'shortcut_add_transfer',
      ],
      clerk: [
        ...commonViewPermissions,
        ...commonShortcuts,
        'manage_stock_transfer',
        'shortcut_add_transfer',
      ],
      guest: [],
    }

    return permissionsMap[role] || []
  }, [role])
}
