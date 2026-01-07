'use client'

import { useQueryClient } from '@tanstack/react-query'
import { useApiMutation } from '@/lib/hooks/useApiMutation'
import api from '@/lib/utils/api'
import type { Holiday, PayrollSettings } from '@/lib/queries/usePayroll'

const PAYROLL_BASE = '/payroll'
const SETTINGS_URL = `${PAYROLL_BASE}/settings/`
const HOLIDAYS_URL = `${PAYROLL_BASE}/holidays/`

/**
 * Centralized mutations for Payroll Admin (settings and holidays).
 * - Uses app-standard useApiMutation for toast + cache invalidation
 * - Keeps endpoints and messages consistent across the app
 */
export function usePayrollAdminMutations() {
  const queryClient = useQueryClient()

  // Settings
  const saveSettings = useApiMutation<Partial<PayrollSettings>, PayrollSettings>({
    mutationFn: (data) => api.put(SETTINGS_URL, data),
    successMessage: 'Settings saved successfully.',
    invalidateQueries: [{ queryKey: ['payroll', 'settings'] }],
  })

  const patchSettings = useApiMutation<Partial<PayrollSettings>, PayrollSettings>({
    mutationFn: (data) => api.patch(SETTINGS_URL, data),
    successMessage: 'Settings updated.',
    invalidateQueries: [{ queryKey: ['payroll', 'settings'] }],
  })

  // Holidays
  const addHoliday = useApiMutation<Omit<Holiday, 'id' | 'is_deleted'>, Holiday>({
    mutationFn: (data) => api.post(HOLIDAYS_URL, data),
    successMessage: 'Holiday added.',
    invalidateQueries: [{ queryKey: ['payroll', 'holidays'] }],
  })

  const updateHoliday = useApiMutation<{ id: number; data: Partial<Holiday> }, Holiday>({
    mutationFn: ({ id, data }) => api.patch(`${HOLIDAYS_URL}${id}/`, data),
    successMessage: 'Holiday saved.',
    invalidateQueries: [{ queryKey: ['payroll', 'holidays'] }],
    onSuccess: (_, variables) => {
      // Invalidate a potential holiday detail query if used elsewhere
      queryClient.invalidateQueries({ queryKey: ['payroll', 'holiday', `${variables.id}`] })
    },
  })

  const deleteHoliday = useApiMutation<number, unknown>({
    mutationFn: (id) => api.delete(`${HOLIDAYS_URL}${id}/`),
    successMessage: 'Holiday deleted.',
    invalidateQueries: [{ queryKey: ['payroll', 'holidays'] }],
  })

  return {
    // Settings
    saveSettings,
    patchSettings,
    // Holidays
    addHoliday,
    updateHoliday,
    deleteHoliday,
  }
}
