'use client'

import { ChequeCollectionPayload } from '@/lib/constants/types'
import { useApiMutation } from '@/lib/hooks/useApiMutation'
import api from '@/lib/utils/api'
import { useQueryClient } from '@tanstack/react-query'

export function useChequeCollectionMutations() {
  const queryClient = useQueryClient()
  const url = 'receivables/cheques/'

  const commonInvalidations = [
    { queryKey: ['cheque-collections'] },
    { queryKey: ['clients'] },
  ]

  const addChequeCollection = useApiMutation({
    mutationFn: (data: ChequeCollectionPayload) => api.post(url, data),
    successMessage: 'Cheque collection created successfully.',
    invalidateQueries: commonInvalidations,
  })

  const updateChequeCollection = useApiMutation({
    mutationFn: ({ id, data }: { id: number; data: ChequeCollectionPayload }) =>
      api.patch(`${url}${id}/`, data),
    successMessage: 'Cheque collection updated successfully.',
    invalidateQueries: commonInvalidations,
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: ['cheque-collection', `${variables.id}`],
      })
    },
  })

  const deleteChequeCollection = useApiMutation({
    mutationFn: (id: number) => api.delete(`${url}${id}/`),
    successMessage: 'Cheque collection deleted.',
    invalidateQueries: commonInvalidations,
  })

  return {
    addChequeCollection,
    updateChequeCollection,
    deleteChequeCollection,
  }
}
