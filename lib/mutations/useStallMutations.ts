'use client'

import { StallPayload } from '@/lib/constants/interface'
import { useApiMutation } from '@/lib/hooks/useApiMutation'
import api from '@/lib/utils/api'
import { useQueryClient } from '@tanstack/react-query'

export function useStallMutations() {
  const queryClient = useQueryClient()

  const analyticsKeys = [['summary'], ['cash_flow']]
  const commonInvalidations = [
    { queryKey: ['stalls'] },
    { queryKey: ['stall-stocks'] },
    { queryKey: ['stall-choices'] },
    ...analyticsKeys.map((key) => ({ queryKey: key })),
  ]

  const addStall = useApiMutation({
    mutationFn: (data: StallPayload) => api.post('/inventory/stalls/', data),
    successMessage: 'Stall created successfully.',
    invalidateQueries: commonInvalidations,
  })

  const updateStall = useApiMutation({
    mutationFn: ({ id, data }: { id: number; data: StallPayload }) =>
      api.patch(`/inventory/stalls/${id}/`, data),
    successMessage: 'Stall updated successfully.',
    invalidateQueries: commonInvalidations,
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['stall', `${variables.id}`] })
    },
  })

  const deleteStall = useApiMutation({
    mutationFn: (id: number) => api.delete(`/inventory/stalls/${id}/`),
    successMessage: 'Stall deleted successfully.',
    invalidateQueries: commonInvalidations,
  })

  return { addStall, updateStall, deleteStall }
}
