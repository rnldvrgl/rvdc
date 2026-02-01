"use client"

import { useApiMutation } from "@/lib/hooks/useApiMutation"
import api from "@/lib/utils/api"
import { useQueryClient } from "@tanstack/react-query"

interface ApplianceItemUsedPayload {
  appliance: number
  item: number
  quantity: number
  unit_price_at_time?: number
  stall_stock?: number
}

export function useApplianceItemMutations() {
  const queryClient = useQueryClient()
  const url = "services/appliance-items/"

  const addItem = useApiMutation({
    mutationFn: (data: ApplianceItemUsedPayload) => api.post(url, data),
    successMessage: "Part added successfully.",
    invalidateQueries: [
      { queryKey: ["service-appliances"] },
      { queryKey: ["services"] },
      { queryKey: ["sales-transactions"] },
      { queryKey: ["stocks"] },
      { queryKey: ["remittances"] },
      { queryKey: ["summary"] },
      { queryKey: ["cash_flow"] },
    ],
    onSuccess: (_, variables) => {
      if (variables.appliance) {
        // Invalidate only THIS appliance's items
        queryClient.invalidateQueries({
          queryKey: ["appliance-items", variables.appliance],
        })
        queryClient.invalidateQueries({
          queryKey: ["service-appliance", `${variables.appliance}`],
        })
      }
    },
  })

  const updateItem = useApiMutation({
    mutationFn: ({
      id,
      data,
    }: {
      id: number
      data: ApplianceItemUsedPayload
    }) => api.patch(`${url}${id}/`, data),
    successMessage: "Part updated successfully.",
    invalidateQueries: [
      { queryKey: ["service-appliances"] },
      { queryKey: ["services"] },
      { queryKey: ["sales-transactions"] },
      { queryKey: ["stocks"] },
      { queryKey: ["remittances"] },
      { queryKey: ["summary"] },
      { queryKey: ["cash_flow"] },
    ],
    onSuccess: (_, variables) => {
      if (variables.data.appliance) {
        // Invalidate only THIS appliance's items
        queryClient.invalidateQueries({
          queryKey: ["appliance-items", variables.data.appliance],
        })
        queryClient.invalidateQueries({
          queryKey: ["service-appliance", `${variables.data.appliance}`],
        })
      }
    },
  })

  const deleteItem = useApiMutation({
    mutationFn: ({ id }: { id: number; applianceId?: number }) =>
      api.delete(`${url}${id}/`),
    successMessage: "Part removed successfully.",
    invalidateQueries: [
      { queryKey: ["service-appliances"] },
      { queryKey: ["services"] },
      { queryKey: ["sales-transactions"] },
      { queryKey: ["stocks"] },
      { queryKey: ["remittances"] },
      { queryKey: ["summary"] },
      { queryKey: ["cash_flow"] },
    ],
    onSuccess: (_, variables) => {
      if (variables.applianceId) {
        // Invalidate only THIS appliance's items
        queryClient.invalidateQueries({
          queryKey: ["appliance-items", variables.applianceId],
        })
        queryClient.invalidateQueries({
          queryKey: ["service-appliance", `${variables.applianceId}`],
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
