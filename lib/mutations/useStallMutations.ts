'use client'

import { StallPayload } from '@/lib/constants/interface'
import { useApiMutation } from '@/lib/hooks/useApiMutation'
import api from '@/lib/utils/api'
import { useQueryClient } from '@tanstack/react-query'

export function useStallMutations() {
  const queryClient = useQueryClient()

  const addStall = useApiMutation({
    mutationFn: (data: StallPayload) => api.post('/inventory/stalls/', data),
    successMessage: 'Stall created successfully.',
    invalidateQueries: [{ queryKey: ['stalls'] }],
  })

  const updateStall = useApiMutation({
    mutationFn: ({ id, data }: { id: number; data: StallPayload }) =>
      api.patch(`/inventory/stalls/${id}/`, data),
    successMessage: 'Stall updated successfully.',
    invalidateQueries: [{ queryKey: ['stalls'] }],
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['stall', `${variables.id}`] })
    },
  })

  const deleteStall = useApiMutation({
    mutationFn: (id: number) => api.delete(`/inventory/stalls/${id}/`),
    successMessage: 'Stall deleted successfully.',
    invalidateQueries: [{ queryKey: ['stalls'] }],
  })

  return { addStall, updateStall, deleteStall }
}
