'use client'

import { StockTransferPayload } from '@/lib/constants/interface'
import { useApiMutation } from '@/lib/hooks/useApiMutation'
import api from '@/lib/utils/api'
import { useQueryClient } from '@tanstack/react-query'

export function useStockTransferMutations() {
  const queryClient = useQueryClient()
  const url = '/inventory/stock-transfers/'

  const analyticsKeys = [['summary'], ['restocks_over_time'], ['expenses']]
  const sharedInvalidations = [
    { queryKey: ['stock-transfers'] },
    { queryKey: ['stall-stocks'] },
    ...analyticsKeys.map((key) => ({ queryKey: key })),
  ]

  const addStockTransfer = useApiMutation({
    mutationFn: (data: StockTransferPayload) => api.post(url, data),
    successMessage: 'Stock transfer created successfully.',
    invalidateQueries: sharedInvalidations,
  })

  const updateStockTransfer = useApiMutation({
    mutationFn: ({ id, data }: { id: number; data: StockTransferPayload }) =>
      api.patch(`${url}${id}/`, data),
    successMessage: 'Stock transfer updated successfully.',
    invalidateQueries: sharedInvalidations,
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: ['stock-transfer', `${variables.id}`],
      })
    },
  })

  const deleteStockTransfer = useApiMutation({
    mutationFn: (id: number) => api.delete(`${url}${id}/`),
    successMessage: 'Stock transfer deleted successfully.',
    invalidateQueries: sharedInvalidations,
  })

  const finalizeStockTransfer = useApiMutation({
    mutationFn: (id: number) => api.post(`${url}${id}/finalize/`),
    successMessage: 'Stock transfer finalized successfully.',
    invalidateQueries: sharedInvalidations,
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({
        queryKey: ['stock-transfer', `${id}`],
      })
    },
  })

  const markTransferExpenseAsPaid = useApiMutation({
    mutationFn: (id: number) => api.post(`${url}${id}/mark-expense-as-paid/`),
    successMessage: 'Expense marked as paid successfully.',
    invalidateQueries: sharedInvalidations,
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({
        queryKey: ['stock-transfer', `${id}`],
      })
    },
  })

  return {
    addStockTransfer,
    updateStockTransfer,
    deleteStockTransfer,
    finalizeStockTransfer,
    markTransferExpenseAsPaid,
  }
}
