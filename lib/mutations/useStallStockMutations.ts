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
      api.delete(`/inventory/stocks/${stock_id}/`),
    successMessage: "Stock archived successfully.",
    invalidateQueries: [
      ...sharedInvalidations,
      { queryKey: ["stall-stocks-archived"] },
    ],
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

  const auditStallStock = useApiMutation({
    mutationFn: ({
      stock_id,
      physical_count,
    }: {
      stock_id: number
      physical_count: number
    }) =>
      api.post(`/inventory/stocks/${stock_id}/audit/`, {
        physical_count,
      }),
    successMessage: "Stock reconciled successfully.",
    invalidateQueries: sharedInvalidations,
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["stall-stocks", variables.stock_id],
      })
      queryClient.invalidateQueries({
        queryKey: ["stock-audit", variables.stock_id],
      })
    },
  })

  const pullOutStallStock = useApiMutation({
    mutationFn: ({
      stock_id,
      quantity,
    }: {
      stock_id: number
      quantity: number
    }) =>
      api.post(`/inventory/stocks/${stock_id}/pull-out/`, {
        quantity,
      }),
    successMessage: "Stock pulled out successfully.",
    invalidateQueries: sharedInvalidations,
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["stall-stocks", variables.stock_id],
      })
    },
  })

  const bulkPreview = useApiMutation<FormData, unknown>({
    mutationFn: (formData) =>
      api.post(`/inventory/stocks/bulk-preview/`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      }),
    usePromiseToast: true,
    loadingMessage: "Analyzing file...",
  })

  const bulkUpdate = useApiMutation<FormData, unknown>({
    mutationFn: (formData) =>
      api.post(`/inventory/stocks/bulk-update/`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      }),
    usePromiseToast: true,
    loadingMessage: "Processing bulk update...",
    successMessage: "Bulk update started. You will be notified when it's done.",
    invalidateQueries: sharedInvalidations,
  })

  const bulkDeductPreview = useApiMutation<FormData, unknown>({
    mutationFn: (formData) =>
      api.post(`/inventory/stocks/bulk-deduct-preview/`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      }),
    usePromiseToast: true,
    loadingMessage: "Analyzing file...",
  })

  const bulkDeduct = useApiMutation<FormData, unknown>({
    mutationFn: (formData) =>
      api.post(`/inventory/stocks/bulk-deduct/`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      }),
    usePromiseToast: true,
    loadingMessage: "Processing stock deduction...",
    successMessage: "Stock deduction started. You will be notified when it's done.",
    invalidateQueries: sharedInvalidations,
  })

  return {
    updateStallStock,
    softDeleteStallStock,
    restockStallStock,
    addStallStock,
    auditStallStock,
    pullOutStallStock,
    bulkPreview,
    bulkUpdate,
    bulkDeductPreview,
    bulkDeduct,
  }
}
