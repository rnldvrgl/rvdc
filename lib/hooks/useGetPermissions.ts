import { Roles } from '@/lib/constants/types'
import { useMemo } from 'react'

export function useGetPermissions(role: Roles) {
  return useMemo(() => {
    const permissionsMap = {
      admin: [
        'view_clients',
        'view_technicians',
        'view_stockroom',
        'view_items',
        'view_categories',
        'view_stallstocks',
        'view_settings',
        'view_stalls',
        'shortcut_add_client',
        'view_expenses',
      ],
      manager: [
        'view_clients',
        'view_technicians',
        'view_items',
        'view_categories',
        'view_stallstocks',
        'view_settings',
        'shortcut_add_client',
        'manage_stock_transfer',
        'view_expenses',
      ],
      guest: [],
    }
    return permissionsMap[role] || []
  }, [role])
}
