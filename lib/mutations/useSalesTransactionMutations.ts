'use client'

import { useApiMutation } from '@/lib/hooks/useApiMutation'
import api from '@/lib/utils/api'
import { useQueryClient } from '@tanstack/react-query'

export function useSalesTransactionMutations() {
  const queryClient = useQueryClient()
  const url = 'sales/transactions/'

  const addTransaction = useApiMutation({
    mutationFn: (data: any) => api.post(url, data),
    successMessage: 'Sales transaction created successfully.',
    invalidateQueries: [
      { queryKey: ['sales-transactions'] },
      { queryKey: ['stall-stocks'] },
    ],
  })

  const updateTransaction = useApiMutation({
    mutationFn: ({ id, data }: { id: number; data: any }) =>
      api.patch(`${url}${id}/`, data),
    successMessage: 'Sales transaction updated successfully.',
    invalidateQueries: [
      { queryKey: ['sales-transactions'] },
      { queryKey: ['stall-stocks'] },
    ],
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: ['sales-transaction', `${variables.id}`],
      })
    },
  })

  const deleteTransaction = useApiMutation({
    mutationFn: (id: number) => api.delete(`${url}${id}/`),
    successMessage: 'Sales transaction deleted.',
    invalidateQueries: [
      { queryKey: ['sales-transactions'] },
      { queryKey: ['stall-stocks'] },
    ],
  })

  const voidTransaction = useApiMutation({
    mutationFn: ({ id, data }: { id: number; data: any }) =>
      api.post(`${url}${id}/void/`, data),
    successMessage: 'Sales transaction voided.',
    invalidateQueries: [
      { queryKey: ['sales-transactions'] },
      { queryKey: ['stall-stocks'] },
    ],
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: ['sales-transaction', `${variables.id}`],
      })
    },
  })

  const unvoidTransaction = useApiMutation({
    mutationFn: (id: number) => api.post(`${url}${id}/unvoid/`),
    successMessage: 'Sales transaction restored.',
    invalidateQueries: [
      { queryKey: ['sales-transactions'] },
      { queryKey: ['stall-stocks'] },
    ],
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({
        queryKey: ['sales-transaction', `${id}`],
      })
    },
  })

  return {
    addTransaction,
    updateTransaction,
    deleteTransaction,
    voidTransaction,
    unvoidTransaction,
  }
}
