"use client"

import { StockRoomStockPayload } from "@/lib/constants/interface"
import { useApiMutation } from "@/lib/hooks/useApiMutation"
import api from "@/lib/utils/api"
import { useQueryClient } from "@tanstack/react-query"

export function useStockRoomStockMutations() {
  const queryClient = useQueryClient()

  const analyticsKeys = [["summary"], ["restocks_over_time"]]
  const sharedInvalidations = [
    { queryKey: ["stall-stocks"] },
    { queryKey: ["stock-room-stocks"] },
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
    successMessage: "Stock Room stock updated successfully.",
    invalidateQueries: sharedInvalidations,
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["stock-room-stocks", variables.stock_id],
      })
    },
  })

  const softDeleteStockRoomStock = useApiMutation({
    mutationFn: (stock_id: number) =>
      api.delete(`/inventory/stockroom/stocks/${stock_id}/`),
    successMessage: "Stock archived successfully.",
    invalidateQueries: [
      ...sharedInvalidations,
      { queryKey: ["stockroom-stocks-archived"] },
    ],
    onSuccess: (_, stock_id) => {
      queryClient.invalidateQueries({
        queryKey: ["stock-room-stocks", stock_id],
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
    successMessage: "Stock restocked successfully.",
    invalidateQueries: sharedInvalidations,
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["stock-room-stocks", variables.stock_id],
      })
    },
  })

  const auditStockRoomStock = useApiMutation({
    mutationFn: ({
      stock_id,
      physical_count,
    }: {
      stock_id: number
      physical_count: number
    }) =>
      api.post(`/inventory/stockroom/stocks/${stock_id}/audit/`, {
        physical_count,
      }),
    successMessage: "Stock reconciled successfully.",
    invalidateQueries: sharedInvalidations,
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["stock-room-stocks", variables.stock_id],
      })
      queryClient.invalidateQueries({
        queryKey: ["stockroom-audit", variables.stock_id],
      })
    },
  })

  const bulkPreview = useApiMutation<FormData, unknown>({
    mutationFn: (formData) =>
      api.post(`/inventory/stockroom/stocks/bulk-preview/`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      }),
    usePromiseToast: true,
    loadingMessage: "Analyzing file...",
  })

  const bulkUpdate = useApiMutation<FormData, unknown>({
    mutationFn: (formData) =>
      api.post(`/inventory/stockroom/stocks/bulk-update/`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      }),
    usePromiseToast: true,
    loadingMessage: "Processing bulk update...",
    successMessage: "Bulk update started. You will be notified when it's done.",
    invalidateQueries: sharedInvalidations,
  })

  return {
    updateStockRoomStock,
    softDeleteStockRoomStock,
    restockStockRoomStock,
    auditStockRoomStock,
    bulkPreview,
    bulkUpdate,
  }
}
