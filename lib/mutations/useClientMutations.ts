// src/lib/mutations/useClientMutations.ts
'use client'

import api from '@/lib/utils/api'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import toast from 'react-hot-toast'

interface ClientData {
  full_name: string
  contact_number: string
  address: string
  province: string
  city: string
  barangay: string
}

export function useClientMutations() {
  const queryClient = useQueryClient()

  // CREATE
  const addClient = useMutation({
    mutationFn: (data: ClientData) => api.post('/clients/', data),
    onSuccess: () => {
      toast.success('Client created successfully.')
      queryClient.invalidateQueries({ queryKey: ['clients'] })
    },
    onError: (err: any) =>
      toast.error(err?.response?.data?.detail || 'Failed to create client'),
  })

  // UPDATE
  const updateClient = useMutation({
    mutationFn: ({ id, data }: { id: number; data: ClientData }) =>
      api.patch(`/clients/${id}/`, data),
    onSuccess: () => {
      toast.success('Client updated successfully.')
      queryClient.invalidateQueries({ queryKey: ['clients'] })
    },
    onError: (err: any) =>
      toast.error(err?.response?.data?.detail || 'Failed to update client'),
  })

  // DELETE
  const deleteClient = useMutation({
    mutationFn: (id: number) => api.delete(`/clients/${id}/`),
    onSuccess: () => {
      toast.success('Client deleted successfully.')
      queryClient.invalidateQueries({ queryKey: ['clients'] })
    },
    onError: () => {
      toast.error('Failed to delete client')
    },
  })

  return { addClient, updateClient, deleteClient }
}
