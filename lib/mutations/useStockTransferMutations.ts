'use client'

import { useApiMutation } from '@/lib/hooks/useApiMutation'
import api from '@/lib/utils/api'
import { useQueryClient } from '@tanstack/react-query'

// Adjust to your DTO if you have a type like:
// type StockTransfer = { to_stall_id: number, technician_id: number, items: { item_id: number, quantity: number }[] }

export function useStockTransferMutations() {
  const queryClient = useQueryClient()
  const url = 'inventory/stocks/transfers/'

  const addStockTransfer = useApiMutation({
    mutationFn: (data: any) => api.post('inventory/stocks/transfer/', data),
    successMessage: 'Stock transfer created successfully.',
    invalidateQueries: [{ queryKey: ['stock-transfers'] }],
  })

  const updateStockTransfer = useApiMutation({
    mutationFn: ({ id, data }: { id: number; data: any }) =>
      api.patch(`${url}${id}/`, data),
    successMessage: 'Stock transfer updated successfully.',
    invalidateQueries: [{ queryKey: ['stock-transfers'] }],
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: ['stock-transfer', `${variables.id}`],
      })
    },
  })

  const deleteStockTransfer = useApiMutation({
    mutationFn: (id: number) => api.delete(`${url}${id}/`),
    successMessage: 'Stock transfer deleted successfully.',
    invalidateQueries: [{ queryKey: ['stock-transfers'] }],
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

  return {
    addStockTransfer,
    updateStockTransfer,
    deleteStockTransfer,
    finalizeStockTransfer,
  }
}
