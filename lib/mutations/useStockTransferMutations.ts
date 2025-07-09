'use client'

import { useApiMutation } from '@/lib/hooks/useApiMutation'
import api from '@/lib/utils/api'
import { useQueryClient } from '@tanstack/react-query'

export function useStockTransferMutations() {
  const queryClient = useQueryClient()
  const url = 'inventory/stocks/transfers/'

  const addStockTransfer = useApiMutation({
    mutationFn: (data: any) => api.post('inventory/stocks/transfer/', data),
    successMessage: 'Stock transfer created successfully.',
    invalidateQueries: [
      { queryKey: ['stock-transfers'] },
      { queryKey: ['stall-stocks'] },
    ],
  })

  const updateStockTransfer = useApiMutation({
    mutationFn: ({ id, data }: { id: number; data: any }) =>
      api.patch(`${url}${id}/`, data),
    successMessage: 'Stock transfer updated successfully.',
    invalidateQueries: [
      { queryKey: ['stock-transfers'] },
      { queryKey: ['stall-stocks'] },
    ],
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: ['stock-transfer', `${variables.id}`],
      })
    },
  })

  const deleteStockTransfer = useApiMutation({
    mutationFn: (id: number) => api.delete(`${url}${id}/`),
    successMessage: 'Stock transfer deleted successfully.',
    invalidateQueries: [
      { queryKey: ['stock-transfers'] },
      { queryKey: ['stall-stocks'] },
    ],
  })

  const finalizeStockTransfer = useApiMutation({
    mutationFn: (id: number) => api.post(`${url}${id}/finalize/`),
    successMessage: 'Stock transfer finalized successfully.',
    invalidateQueries: [{ queryKey: ['stock-transfers'] }],
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({
        queryKey: ['stock-transfer', `${id}`],
      })
    },
  })

  const markTransferExpenseAsPaid = useApiMutation({
    mutationFn: (id: number) => api.post(`${url}${id}/mark-expense-as-paid/`),
    successMessage: 'Expense marked as paid successfully.',
    invalidateQueries: [{ queryKey: ['stock-transfers'] }],
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
