'use client'

import { ItemPayload } from '@/lib/constants/interface'
import { useApiMutation } from '@/lib/hooks/useApiMutation'
import api from '@/lib/utils/api'
import { useQueryClient } from '@tanstack/react-query'

export function useItemMutations() {
  const queryClient = useQueryClient()
  const url = '/inventory/items/'

  const addItem = useApiMutation({
    mutationFn: (data: ItemPayload) => api.post(url, data),
    successMessage: 'Item created successfully.',
    invalidateQueries: [{ queryKey: ['items'] }],
  })

  const updateItem = useApiMutation({
    mutationFn: ({ id, data }: { id: number; data: ItemPayload }) =>
      api.patch(`${url}${id}/`, data),
    successMessage: 'Item updated successfully.',
    invalidateQueries: [{ queryKey: ['items'] }],
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['item', `${variables.id}`] })
    },
  })

  const deleteItem = useApiMutation({
    mutationFn: (id: number) => api.delete(`${url}${id}/`),
    successMessage: 'Item deleted successfully.',
    invalidateQueries: [{ queryKey: ['items'] }],
  })

  return { addItem, updateItem, deleteItem }
}
