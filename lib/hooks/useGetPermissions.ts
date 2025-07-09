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
        'view_scheduling',
        'view_sales',
        'view_repairs',
      ],
      manager: [
        'view_clients',
        'view_technicians',
        'view_items',
        'view_stallstocks',
        'view_settings',
        'shortcut_add_client',
        'manage_stock_transfer',
        'view_expenses',
        'shortcut_add_expense',
        'shortcut_add_transfer',
        'view_sales',
        'view_scheduling',
        'view_sales',
        'view_repairs',
        'view_attendance',
      ],
      guest: [],
    }
    return permissionsMap[role] || []
  }, [role])
}
