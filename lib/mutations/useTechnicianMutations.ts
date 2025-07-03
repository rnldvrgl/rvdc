'use client'

import { Technician } from '@/lib/constants/types'
import api from '@/lib/utils/api'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import toast from 'react-hot-toast'

export function useTechnicianMutations() {
  const queryClient = useQueryClient()

  // CREATE
  const addTechnician = useMutation({
    mutationFn: (data: Technician) => api.post('/users/technicians/', data),
    onSuccess: () => {
      toast.success('Technician created successfully.')
      queryClient.invalidateQueries({ queryKey: ['technicians'] })
    },
    onError: (err: any) =>
      toast.error(err?.response?.data?.detail || 'Failed to create technician'),
  })

  // UPDATE
  const updateTechnician = useMutation({
    mutationFn: ({ id, data }: { id: number; data: Technician }) =>
      api.patch(`/users/technicians/${id}/`, data),
    onSuccess: (_, variables) => {
      toast.success('Technician updated successfully.')
      queryClient.invalidateQueries({ queryKey: ['technicians'] })
      queryClient.invalidateQueries({
        queryKey: ['technician', `${variables.id}`],
      })
    },
    onError: (err: any) =>
      toast.error(err?.response?.data?.detail || 'Failed to update technician'),
  })

  // DELETE
  const deleteTechnician = useMutation({
    mutationFn: (id: number) => api.delete(`/users/technicians/${id}/`),
    onSuccess: () => {
      toast.success('Technician deleted successfully.')
      queryClient.invalidateQueries({ queryKey: ['technicians'] })
    },
    onError: () => {
      toast.error('Failed to delete technician')
    },
  })

  return { addTechnician, updateTechnician, deleteTechnician }
}
