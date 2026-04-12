"use client"

import { ItemPayload } from "@/lib/constants/interface"
import { useApiMutation } from "@/lib/hooks/useApiMutation"
import api from "@/lib/utils/api"
import { useQueryClient } from "@tanstack/react-query"

export function useItemMutations() {
  const queryClient = useQueryClient()
  const url = "/inventory/items/"

  const analyticsKeys = [
    ["summary"],
    ["top_selling_items"],
    ["sales_over_time"],
    ["cash_flow"],
    ["restocks_over_time"],
  ]

  const sharedInvalidations = [
    { queryKey: ["items"] },
    { queryKey: ["stall-stocks"] },
    { queryKey: ["stock-room-stocks"] },
    { queryKey: ["item-choices"] },
    ...analyticsKeys.map((key) => ({ queryKey: key })),
  ]

  const addItem = useApiMutation({
    mutationFn: (data: ItemPayload) => api.post(url, data),
    successMessage: "Item created successfully.",
    invalidateQueries: sharedInvalidations,
  })

  const updateItem = useApiMutation({
    mutationFn: ({ id, data }: { id: number; data: ItemPayload }) =>
      api.patch(`${url}${id}/`, data),
    successMessage: "Item updated successfully.",
    invalidateQueries: sharedInvalidations,
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["item", `${variables.id}`] })
    },
  })

  const deleteItem = useApiMutation({
    mutationFn: (id: number) => api.delete(`${url}${id}/`),
    successMessage: "Item archived successfully.",
    invalidateQueries: [
      ...sharedInvalidations,
      { queryKey: ["items-archived"] },
    ],
  })

  const toggleTracked = useApiMutation({
    mutationFn: (id: number) => api.post(`${url}${id}/toggle-tracked/`),
    successMessage: "Item tracking updated.",
    invalidateQueries: sharedInvalidations,
  })

  const bulkPreview = useApiMutation<FormData, unknown>({
    mutationFn: (formData) =>
      api.post(`${url}bulk-preview/`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      }),
    usePromiseToast: true,
    loadingMessage: "Analyzing file...",
  })

  const bulkUpdate = useApiMutation<FormData, unknown>({
    mutationFn: (formData) =>
      api.post(`${url}bulk-update/`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      }),
    usePromiseToast: true,
    loadingMessage: "Processing bulk update...",
    successMessage: "Bulk update started. You will be notified when it's done.",
    invalidateQueries: sharedInvalidations,
  })

  const mergeItem = useApiMutation<{ targetId: number; sourceItemId: number }, unknown>({
    mutationFn: ({ targetId, sourceItemId }) =>
      api.post(`${url}${targetId}/merge/`, { source_item_id: sourceItemId }),
    usePromiseToast: true,
    loadingMessage: "Merging items...",
    successMessage: "Items merged successfully.",
    invalidateQueries: sharedInvalidations,
  })

  return { addItem, updateItem, deleteItem, toggleTracked, bulkPreview, bulkUpdate, mergeItem }
}
