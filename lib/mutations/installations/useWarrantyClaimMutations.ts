'use client'

import { WarrantyClaimPayload } from '@/lib/constants/interface'
import { useApiMutation } from '@/lib/hooks/useApiMutation'
import api from '@/lib/utils/api'
import { useQueryClient } from '@tanstack/react-query'

export function useWarrantyClaimMutations() {
  const queryClient = useQueryClient()
  const url = 'installations/warranty-claims/'

  const addWarrantyClaim = useApiMutation({
    mutationFn: (data: WarrantyClaimPayload) => api.post(url, data),
    successMessage: 'Warranty claim created successfully.',
    invalidateQueries: [
      { queryKey: ['warranty-claims'] },
      { queryKey: ['aircon-units'] },
    ],
  })

  const updateWarrantyClaim = useApiMutation({
    mutationFn: ({ id, data }: { id: number; data: WarrantyClaimPayload }) =>
      api.patch(`${url}${id}/`, data),
    successMessage: 'Warranty claim updated successfully.',
    invalidateQueries: [
      { queryKey: ['warranty-claims'] },
      { queryKey: ['aircon-units'] },
    ],
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: ['warranty-claim', `${variables.id}`],
      })
    },
  })

  const deleteWarrantyClaim = useApiMutation({
    mutationFn: (id: number) => api.delete(`${url}${id}/`),
    successMessage: 'Warranty claim deleted successfully.',
    invalidateQueries: [
      { queryKey: ['warranty-claims'] },
      { queryKey: ['aircon-units'] },
    ],
  })

  const approveWarrantyClaim = useApiMutation({
    mutationFn: (id: number) => api.post(`${url}${id}/approve/`),
    successMessage: 'Warranty claim approved successfully.',
    invalidateQueries: [
      { queryKey: ['warranty-claims'] },
      { queryKey: ['aircon-units'] },
    ],
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: ['warranty-claim', `${id}`] })
    },
  })

  const rejectWarrantyClaim = useApiMutation({
    mutationFn: ({ id, reason }: { id: number; reason: string }) =>
      api.post(`${url}${id}/reject/`, { rejection_reason: reason }),
    successMessage: 'Warranty claim rejected.',
    invalidateQueries: [
      { queryKey: ['warranty-claims'] },
      { queryKey: ['aircon-units'] },
    ],
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: ['warranty-claim', `${variables.id}`],
      })
    },
  })

  return {
    addWarrantyClaim,
    updateWarrantyClaim,
    deleteWarrantyClaim,
    approveWarrantyClaim,
    rejectWarrantyClaim,
  }
}
