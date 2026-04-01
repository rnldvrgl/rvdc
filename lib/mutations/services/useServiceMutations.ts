"use client"

import { LinkAirconUnitsPayload, ServicePayload } from "@/lib/constants/interface"
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
      { queryKey: ["calendar-events"] },
      ...analyticsKeys.map((key) => ({ queryKey: key })),
    ],
  })

  const updateService = useApiMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<ServicePayload> }) =>
      api.patch(`${url}${id}/`, data),
    successMessage: "Service updated successfully.",
    invalidateQueries: [
      { queryKey: ["services"] },
      { queryKey: ["calendar-events"] },
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
    successMessage: "Service archived successfully.",
    invalidateQueries: [
      { queryKey: ["services"] },
      { queryKey: ["services-archived"] },
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
      data: {
        payment_type: string
        amount: string | number
        notes?: string
        cheque_collection?: number | null
      }
    }) => api.post(`${url}${id}/payments/`, data),
    successMessage: "Payment recorded successfully.",
    invalidateQueries: [
      { queryKey: ["services"] },
      { queryKey: ["sales-transactions"] },
      { queryKey: ["remittances"] },
      { queryKey: ["daily-sales"] },
      { queryKey: ["cheque-choices"] },
      ...analyticsKeys.map((key) => ({ queryKey: key })),
    ],
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: ["service", `${id}`] })
    },
  })

  const cancelService = useApiMutation({
    mutationFn: ({ id, reason }: { id: number; reason: string }) =>
      api.post(`${url}${id}/cancel/`, { reason }),
    successMessage: "Service cancelled successfully.",
    invalidateQueries: [
      { queryKey: ["services"] },
      { queryKey: ["stocks"] },
      { queryKey: ["sales-transactions"] },
      ...analyticsKeys.map((key) => ({ queryKey: key })),
    ],
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: ["service", `${id}`] })
    },
  })

  const refundService = useApiMutation({
    mutationFn: ({
      id,
      data,
    }: {
      id: number
      data: {
        refund_amount: number
        reason: string
        refund_type: "full" | "partial"
        refund_method: "cash" | "gcash" | "bank_transfer"
      }
    }) => api.post(`${url}${id}/refund/`, data),
    successMessage: "Refund processed successfully.",
    invalidateQueries: [
      { queryKey: ["services"] },
      { queryKey: ["sales-transactions"] },
      { queryKey: ["cheque-choices"] },
      ...analyticsKeys.map((key) => ({ queryKey: key })),
    ],
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: ["service", `${id}`] })
    },
  })

  const reopenService = useApiMutation({
    mutationFn: ({ id, reason }: { id: number; reason?: string }) =>
      api.post(`${url}${id}/reopen/`, { reason }),
    successMessage: "Service reopened for revision.",
    invalidateQueries: [
      { queryKey: ["services"] },
      { queryKey: ["stocks"] },
      { queryKey: ["sales-transactions"] },
      ...analyticsKeys.map((key) => ({ queryKey: key })),
    ],
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: ["service", `${id}`] })
    },
  })

  const toggleServiceItemsChecked = useApiMutation({
    mutationFn: (id: number) =>
      api.post(`${url}${id}/toggle-service-items-checked/`),
    invalidateQueries: [
      { queryKey: ["services"] },
      { queryKey: ["pending-items-stats"] },
      { queryKey: ["notifications"] },
      { queryKey: ["unread-notification-count"] },
    ],
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: ["service", `${id}`] })
    },
  })

  const linkAirconUnits = useApiMutation({
    mutationFn: ({ id, data }: { id: number; data: LinkAirconUnitsPayload }) =>
      api.post(`${url}${id}/link-aircon-units/`, data),
    invalidateQueries: [
      { queryKey: ["services"] },
      { queryKey: ["aircon-units"] },
      { queryKey: ["warranty-claims"] },
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
    cancelService,
    refundService,
    reopenService,
    toggleServiceItemsChecked,
    linkAirconUnits,
  }
}
