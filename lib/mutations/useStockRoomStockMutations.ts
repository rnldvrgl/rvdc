'use client'

import { StockRoomStockPayload } from '@/lib/constants/interface'
import { useApiMutation } from '@/lib/hooks/useApiMutation'
import api from '@/lib/utils/api'
import { useQueryClient } from '@tanstack/react-query'

export function useStockRoomStockMutations() {
  const queryClient = useQueryClient()

  const analyticsKeys = [['summary'], ['restocks_over_time']]
  const sharedInvalidations = [
    { queryKey: ['stall-stocks'] },
    { queryKey: ['stock-room-stocks'] },
    ...analyticsKeys.map((key) => ({ queryKey: key })),
  ]

  const updateStockRoomStock = useApiMutation({
    mutationFn: ({
      stock_id,
      data,
    }: {
      stock_id: number
      data: StockRoomStockPayload
    }) => api.patch(`/inventory/stockroom/stocks/${stock_id}/`, data),
    successMessage: 'Stock Room stock updated successfully.',
    invalidateQueries: sharedInvalidations,
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: ['stock-room-stocks', variables.stock_id],
      })
    },
  })

  const softDeleteStockRoomStock = useApiMutation({
    mutationFn: (stock_id: number) =>
      api.patch(`/inventory/stockroom/stocks/${stock_id}/`, {
        is_deleted: true,
      }),
    successMessage: 'Stock deleted successfully.',
    invalidateQueries: sharedInvalidations,
    onSuccess: (_, stock_id) => {
      queryClient.invalidateQueries({
        queryKey: ['stock-room-stocks', stock_id],
      })
    },
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
    invalidateQueries: sharedInvalidations,
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: ['stock-room-stocks', variables.stock_id],
      })
    },
  })

  return {
    updateStockRoomStock,
    softDeleteStockRoomStock,
    restockStockRoomStock,
  }
}
