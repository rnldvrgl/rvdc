'use client'

import { StockPayload } from '@/lib/constants/interface'
import { useApiMutation } from '@/lib/hooks/useApiMutation'
import api from '@/lib/utils/api'
import { useQueryClient } from '@tanstack/react-query'

export function useStallStockMutations() {
  const queryClient = useQueryClient()

  const updateStallStock = useApiMutation({
    mutationFn: ({
      stall_id,
      stock_id,
      data,
    }: {
      stall_id: number
      stock_id: number
      data: StockPayload
    }) => api.patch(`/inventory/stalls/${stall_id}/stocks/${stock_id}/`, data),
    successMessage: 'Stall stock updated successfully.',
    invalidateQueries: [{ queryKey: ['stall-stocks'] }],
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: ['stall-stock', variables.stock_id],
      })
    },
  })

  const softDeleteStallStock = useApiMutation({
    mutationFn: ({ stall_id, stock_id }) =>
      api.patch(`/inventory/stalls/${stall_id}/stocks/${stock_id}/`, {
        is_deleted: true,
      }),
  })

  const restockStallStock = useApiMutation({
    mutationFn: ({
      stall_id,
      stock_id,
      quantity,
    }: {
      stall_id: number
      stock_id: number
      quantity: number
    }) =>
      api.post(`/inventory/stalls/${stall_id}/stocks/${stock_id}/restock/`, {
        quantity,
      }),
    successMessage: 'Stock restocked successfully.',
    invalidateQueries: [{ queryKey: ['stall-stocks'] }],

    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: ['stall-stock', variables.stock_id],
      })
    },
  })

  return { updateStallStock, softDeleteStallStock, restockStallStock }
}
