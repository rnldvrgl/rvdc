"use client"

import { ServicePayload } from "@/lib/constants/interface"
import { useApiMutation } from "@/lib/hooks/useApiMutation"
import api from "@/lib/utils/api"
import { useQueryClient } from "@tanstack/react-query"

export function useServiceMutations() {
  const queryClient = useQueryClient()
  const url = "services/services/"

  const analyticsKeys = [["summary"], ["cash_flow"]]

  const addService = useApiMutation({
    mutationFn: (data: ServicePayload) => api.post(url, data),
    successMessage: "Service created successfully.",
    invalidateQueries: [
      { queryKey: ["services"] },
      ...analyticsKeys.map((key) => ({ queryKey: key })),
    ],
  })

  const updateService = useApiMutation({
    mutationFn: ({ id, data }: { id: number; data: ServicePayload }) =>
      api.patch(`${url}${id}/`, data),
    successMessage: "Service updated successfully.",
    invalidateQueries: [
      { queryKey: ["services"] },
      ...analyticsKeys.map((key) => ({ queryKey: key })),
    ],
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["service", `${variables.id}`],
      })
    },
  })

  const deleteService = useApiMutation({
    mutationFn: (id: number) => api.delete(`${url}${id}/`),
    successMessage: "Service deleted successfully.",
    invalidateQueries: [
      { queryKey: ["services"] },
      ...analyticsKeys.map((key) => ({ queryKey: key })),
    ],
  })

  const completeService = useApiMutation({
    mutationFn: (id: number) => api.post(`${url}${id}/complete/`),
    successMessage: "Service completed successfully.",
    invalidateQueries: [
      { queryKey: ["services"] },
      { queryKey: ["stocks"] },
      { queryKey: ["sales-transactions"] },
      ...analyticsKeys.map((key) => ({ queryKey: key })),
    ],
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: ["service", `${id}`] })
    },
  })

  const recordPayment = useApiMutation({
    mutationFn: ({
      id,
      data,
    }: {
      id: number
      data: { payment_type: string; amount: string | number; notes?: string }
    }) => api.post(`${url}${id}/payments/`, data),
    successMessage: "Payment recorded successfully.",
    invalidateQueries: [
      { queryKey: ["services"] },
      { queryKey: ["sales-transactions"] },
      { queryKey: ["remittances"] },
      { queryKey: ["daily-sales"] },
      ...analyticsKeys.map((key) => ({ queryKey: key })),
    ],
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: ["service", `${id}`] })
    },
  })

  return {
    addService,
    updateService,
    deleteService,
    completeService,
    recordPayment,
  }
}
