'use client'

import { StockPayload } from '@/lib/constants/interface'
import { useApiMutation } from '@/lib/hooks/useApiMutation'
import api from '@/lib/utils/api'
import { useQueryClient } from '@tanstack/react-query'

export function useStallStockMutations() {
  const queryClient = useQueryClient()

  const updateStallStock = useApiMutation({
    mutationFn: ({
      stock_id,
      data,
    }: {
      stock_id: number
      data: StockPayload
    }) => api.patch(`/inventory/stocks/${stock_id}/`, data),
    successMessage: 'Stall stock updated successfully.',
    invalidateQueries: [{ queryKey: ['stall-stocks'] }],
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: ['stall-stock', variables.stock_id],
      })
    },
  })

  const softDeleteStallStock = useApiMutation({
    mutationFn: (stock_id: number) =>
      api.patch(`/inventory/stocks/${stock_id}/`, {
        is_deleted: true,
      }),
  })

  const restockStallStock = useApiMutation({
    mutationFn: ({
      stock_id,
      quantity,
    }: {
      stock_id: number
      quantity: number
    }) =>
      api.post(`/inventory/stocks/${stock_id}/restock/`, {
        quantity,
      }),
    successMessage: 'Stock restocked successfully.',
    invalidateQueries: [
      { queryKey: ['stall-stocks'] },
      { queryKey: ['stock-room-stocks'] },
    ],

    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: ['stall-stock', variables.stock_id],
      })
    },
  })

  return { updateStallStock, softDeleteStallStock, restockStallStock }
}
