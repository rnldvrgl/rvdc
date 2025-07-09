'use client'

import { ClientPayload } from '@/lib/constants/types'
import { useApiMutation } from '@/lib/hooks/useApiMutation'
import api from '@/lib/utils/api'
import { useQueryClient } from '@tanstack/react-query'

export function useClientMutations() {
  const queryClient = useQueryClient()
  const url = '/clients/'

  const addClient = useApiMutation({
    mutationFn: (data: ClientPayload) => api.post(url, data),
    successMessage: 'Client created successfully.',
    invalidateQueries: [{ queryKey: ['clients'] }],
  })

  const updateClient = useApiMutation({
    mutationFn: ({ id, data }: { id: number; data: ClientPayload }) =>
      api.patch(`${url}${id}/`, data),
    successMessage: 'Client updated successfully.',
    invalidateQueries: [{ queryKey: ['clients'] }],
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['client', `${variables.id}`] })
    },
  })

  const deleteClient = useApiMutation({
    mutationFn: (id: number) => api.delete(`${url}${id}/`),
    successMessage: 'Client deleted successfully.',
    invalidateQueries: [{ queryKey: ['clients'] }],
  })

  return { addClient, updateClient, deleteClient }
}
