'use client'

import { Technician } from '@/lib/constants/types'
import { useApiMutation } from '@/lib/hooks/useApiMutation'
import api from '@/lib/utils/api'
import { useQueryClient } from '@tanstack/react-query'

export function useTechnicianMutations() {
  const queryClient = useQueryClient()
  const url = '/users/technicians/'

  const sharedInvalidations = [
    { queryKey: ['technicians'] },
    { queryKey: ['technician-choices'] },
  ]

  const addTechnician = useApiMutation({
    mutationFn: (data: Technician) => api.post(url, data),
    successMessage: 'Technician created successfully.',
    invalidateQueries: sharedInvalidations,
  })

  const updateTechnician = useApiMutation({
    mutationFn: ({ id, data }: { id: number; data: Technician }) =>
      api.patch(`${url}${id}/`, data),
    successMessage: 'Technician updated successfully.',
    invalidateQueries: sharedInvalidations,
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: ['technician', `${id}`] })
    },
  })

  const deleteTechnician = useApiMutation({
    mutationFn: (id: number) => api.delete(`${url}${id}/`),
    successMessage: 'Technician deleted successfully.',
    invalidateQueries: sharedInvalidations,
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: ['technician', `${id}`] })
    },
  })

  return { addTechnician, updateTechnician, deleteTechnician }
}
