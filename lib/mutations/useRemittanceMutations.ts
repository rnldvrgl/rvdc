'use client'

import { RemittanceRecordPayload } from '@/lib/constants/infers'
import { useApiMutation } from '@/lib/hooks/useApiMutation'
import api from '@/lib/utils/api'
import { useQueryClient } from '@tanstack/react-query'

export function useRemittanceMutations() {
  const queryClient = useQueryClient()
  const url = 'remittances/'

  const analyticsKeys = [['summary'], ['cash_flow'], ['remittances_over_time']]

  const addRemittance = useApiMutation({
    mutationFn: (data: RemittanceRecordPayload) => api.post(url, data),
    successMessage: 'Remittance recorded successfully.',
    invalidateQueries: [
      { queryKey: ['remittances'] },
      ...analyticsKeys.map((key) => ({ queryKey: key })),
    ],
  })

  const updateRemittance = useApiMutation({
    mutationFn: ({
      id,
      data,
    }: {
      id?: number
      data: Partial<RemittanceRecordPayload>
    }) => api.patch(`${url}${id}/`, data),
    successMessage: 'Remittance updated successfully.',
    invalidateQueries: [
      { queryKey: ['remittances'] },
      ...analyticsKeys.map((key) => ({ queryKey: key })),
    ],
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: ['remittance', `${variables.id}`],
      })
    },
  })

  const deleteRemittance = useApiMutation({
    mutationFn: (id: number) => api.delete(`${url}${id}/`),
    successMessage: 'Remittance deleted.',
    invalidateQueries: [
      { queryKey: ['remittances'] },
      ...analyticsKeys.map((key) => ({ queryKey: key })),
    ],
  })

  const markRemitted = useApiMutation({
    mutationFn: (id: number) => api.post(`${url}${id}/mark_remitted/`),
    successMessage: 'Remittance marked as remitted.',
    invalidateQueries: [
      { queryKey: ['remittances'] },
      ...analyticsKeys.map((key) => ({ queryKey: key })),
    ],
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: ['remittance', `${id}`] })
    },
  })

  return {
    addRemittance,
    updateRemittance,
    deleteRemittance,
    markRemitted,
  }
}
