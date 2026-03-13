"use client"

import { ServiceItemUsedPayload } from "@/lib/constants/interface"
import { useApiMutation } from "@/lib/hooks/useApiMutation"
import api from "@/lib/utils/api"
import { useQueryClient } from "@tanstack/react-query"

export function useServiceItemMutations() {
  const queryClient = useQueryClient()
  const url = "services/service-items/"

  const addItem = useApiMutation({
    mutationFn: (data: ServiceItemUsedPayload) => api.post(url, data),
    successMessage: "Part added successfully.",
    invalidateQueries: [
      { queryKey: ["services"] },
      { queryKey: ["sales-transactions"] },
      { queryKey: ["stocks"] },
      { queryKey: ["remittances"] },
      { queryKey: ["summary"] },
      { queryKey: ["cash_flow"] },
      { queryKey: ["notifications"] },
      { queryKey: ["unread-notification-count"] },
      { queryKey: ["pending-items-stats"] },
    ],
    onSuccess: (_, variables) => {
      if (variables.service) {
        queryClient.invalidateQueries({
          queryKey: ["service-items", variables.service],
        })
      }
    },
  })

  const updateItem = useApiMutation({
    mutationFn: ({ id, data }: { id: number; data: ServiceItemUsedPayload }) =>
      api.patch(`${url}${id}/`, data),
    successMessage: "Part updated successfully.",
    invalidateQueries: [
      { queryKey: ["services"] },
      { queryKey: ["sales-transactions"] },
      { queryKey: ["stocks"] },
      { queryKey: ["remittances"] },
      { queryKey: ["summary"] },
      { queryKey: ["cash_flow"] },
      { queryKey: ["notifications"] },
      { queryKey: ["unread-notification-count"] },
      { queryKey: ["pending-items-stats"] },
    ],
    onSuccess: (_, variables) => {
      if (variables.data.service) {
        queryClient.invalidateQueries({
          queryKey: ["service-items", variables.data.service],
        })
      }
    },
  })

  const deleteItem = useApiMutation({
    mutationFn: ({ id }: { id: number; serviceId?: number }) =>
      api.delete(`${url}${id}/`),
    successMessage: "Part removed successfully.",
    invalidateQueries: [
      { queryKey: ["services"] },
      { queryKey: ["sales-transactions"] },
      { queryKey: ["stocks"] },
      { queryKey: ["remittances"] },
      { queryKey: ["summary"] },
      { queryKey: ["cash_flow"] },
      { queryKey: ["notifications"] },
      { queryKey: ["unread-notification-count"] },
      { queryKey: ["pending-items-stats"] },
    ],
    onSuccess: (_, variables) => {
      if (variables.serviceId) {
        queryClient.invalidateQueries({
          queryKey: ["service-items", variables.serviceId],
        })
      }
    },
  })

  return {
    addItem,
    updateItem,
    deleteItem,
  }
}
