"use client"

import { StockPayload } from "@/lib/constants/interface"
import { useApiMutation } from "@/lib/hooks/useApiMutation"
import api from "@/lib/utils/api"
import { useQueryClient } from "@tanstack/react-query"

export function useStallStockMutations() {
  const queryClient = useQueryClient()

  const analyticsKeys = [["summary"], ["restocks_over_time"]]
  const sharedInvalidations = [
    { queryKey: ["stall-stocks"] },
    { queryKey: ["stock-room-stocks"] },
    ...analyticsKeys.map((key) => ({ queryKey: key })),
  ]

  const updateStallStock = useApiMutation({
    mutationFn: ({
      stock_id,
      data,
    }: {
      stock_id: number
      data: StockPayload
    }) => api.patch(`/inventory/stocks/${stock_id}/`, data),
    successMessage: "Stall stock updated successfully.",
    invalidateQueries: sharedInvalidations,
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["stall-stocks", variables.stock_id],
      })
    },
  })

  const softDeleteStallStock = useApiMutation({
    mutationFn: (stock_id: number) =>
      api.patch(`/inventory/stocks/${stock_id}/`, {
        is_deleted: true,
      }),
    successMessage: "Stock deleted successfully.",
    invalidateQueries: sharedInvalidations,
    onSuccess: (_, stock_id) => {
      queryClient.invalidateQueries({
        queryKey: ["stall-stocks", stock_id],
      })
    },
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
    successMessage: "Stock restocked successfully.",
    invalidateQueries: sharedInvalidations,
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["stall-stocks", variables.stock_id],
      })
    },
  })

  const addStallStock = useApiMutation({
    mutationFn: ({
      stock_id,
      quantity,
    }: {
      stock_id: number
      quantity: number
    }) =>
      api.post(`/inventory/stocks/${stock_id}/add_stock/`, {
        quantity,
      }),
    successMessage: "Stock added successfully.",
    invalidateQueries: sharedInvalidations,
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["stall-stocks", variables.stock_id],
      })
    },
  })

  return {
    updateStallStock,
    softDeleteStallStock,
    restockStallStock,
    addStallStock,
  }
}
