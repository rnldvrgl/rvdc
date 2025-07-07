'use client'

import { StockRoomStockPayload } from '@/lib/constants/interface'
import { useApiMutation } from '@/lib/hooks/useApiMutation'
import api from '@/lib/utils/api'
import { useQueryClient } from '@tanstack/react-query'

export function useStockRoomStockMutations() {
  const queryClient = useQueryClient()

  const updateStockRoomStock = useApiMutation({
    mutationFn: ({
      stock_id,
      data,
    }: {
      stock_id: number
      data: StockRoomStockPayload
    }) => api.patch(`/inventory/stockroom/stocks/${stock_id}/`, data),
    successMessage: 'Stock Room stock updated successfully.',
    invalidateQueries: [{ queryKey: ['stock-room-stocks'] }],
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: ['stock-room-stock', variables.stock_id],
      })
      queryClient.invalidateQueries({
        queryKey: ['stall-stocks'],
      })
    },
  })

  const softDeleteStockRoomStock = useApiMutation({
    mutationFn: (stock_id: number) =>
      api.patch(`/inventory/stockroom/stocks/${stock_id}/`, {
        is_deleted: true,
      }),
  })

  const restockStockRoomStock = useApiMutation({
    mutationFn: ({
      stock_id,
      quantity,
    }: {
      stock_id: number
      quantity: number
    }) =>
      api.post(`/inventory/stockroom/stocks/${stock_id}/restock/`, {
        quantity,
      }),
    successMessage: 'Stock restocked successfully.',
    invalidateQueries: [
      { queryKey: ['stall-stocks'] },
      { queryKey: ['stock-room-stocks'] },
    ],

    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: ['stock-room-stock', variables.stock_id],
      })
    },
  })

  return {
    updateStockRoomStock,
    softDeleteStockRoomStock,
    restockStockRoomStock,
  }
}
