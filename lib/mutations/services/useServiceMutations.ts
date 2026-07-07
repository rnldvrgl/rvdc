"use client"

import { LinkAirconUnitsPayload, ServicePayload } from "@/lib/constants/interface"
import { useApiMutation } from "@/lib/hooks/useApiMutation"
import api from "@/lib/utils/api"
import { bg } from "@/lib/utils/queryInvalidation"
import { useQueryClient } from "@tanstack/react-query"

export function useServiceMutations() {
  const queryClient = useQueryClient()
  const url = "services/services/"

  const analyticsKeys = [["summary"], ["cash_flow"]]

  const addService = useApiMutation({
    mutationFn: (data: ServicePayload) => api.post(url, data),
    successMessage: "Service created successfully.",
    invalidateQueries: [
      bg(["services"]),
      bg(["calendar-events"]),
      ...analyticsKeys.map(bg),
    ],
  })

  const updateService = useApiMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<ServicePayload> }) =>
      api.patch(`${url}${id}/`, data),
    successMessage: "Service updated successfully.",
    invalidateQueries: [
      bg(["services"]),
      bg(["calendar-events"]),
      ...analyticsKeys.map(bg),
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
      bg(["services"]),
      bg(["services-archived"]),
      ...analyticsKeys.map(bg),
    ],
  })

  const completeService = useApiMutation({
    mutationFn: (id: number) => api.post(`${url}${id}/complete/`),
    successMessage: "Service completed successfully.",
    invalidateQueries: [
      bg(["services"]),
      bg(["stocks"]),
      bg(["sales-transactions"]),
      ...analyticsKeys.map(bg),
    ],
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: ["service", `${id}`] })
    },
  })

  const editPayment = useApiMutation({
    mutationFn: ({
      id,
      payment_id,
      payment_type,
      amount,
      notes,
      payment_date,
    }: {
      id: number
      payment_id: number
      payment_type?: string
      amount?: string | number
      notes?: string
      payment_date?: string
    }) =>
      api.post(`${url}${id}/edit-payment/`, {
        payment_id,
        ...(payment_type !== undefined && { payment_type }),
        ...(amount !== undefined && { amount }),
        ...(notes !== undefined && { notes }),
        ...(payment_date !== undefined && { payment_date }),
      }),
    successMessage: "Payment updated successfully.",
    invalidateQueries: [
      bg(["services"]),
      bg(["sales-transactions"]),
      bg(["remittances"]),
      bg(["daily-sales"]),
      bg(["cheque-choices"]),
      ...analyticsKeys.map(bg),
    ],
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: ["service", `${id}`] })
    },
  })

  const voidPayment = useApiMutation({
    mutationFn: ({
      id,
      payment_id,
      reason,
    }: {
      id: number
      payment_id: number
      reason?: string
    }) => api.post(`${url}${id}/void-payment/`, { payment_id, reason }),
    successMessage: "Payment voided successfully.",
    invalidateQueries: [
      bg(["services"]),
      bg(["sales-transactions"]),
      bg(["remittances"]),
      bg(["daily-sales"]),
      bg(["cheque-choices"]),
      ...analyticsKeys.map(bg),
    ],
    onSuccess: (_, { id }) => {
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
        payment_date?: string
      }
    }) => api.post(`${url}${id}/payments/`, data),
    successMessage: "Payment recorded successfully.",
    invalidateQueries: [
      bg(["services"]),
      bg(["sales-transactions"]),
      bg(["remittances"]),
      bg(["daily-sales"]),
      bg(["cheque-choices"]),
      ...analyticsKeys.map(bg),
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
      bg(["services"]),
      bg(["stocks"]),
      bg(["sales-transactions"]),
      ...analyticsKeys.map(bg),
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
      bg(["services"]),
      bg(["sales-transactions"]),
      bg(["cheque-choices"]),
      ...analyticsKeys.map(bg),
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
      bg(["services"]),
      bg(["stocks"]),
      bg(["sales-transactions"]),
      ...analyticsKeys.map(bg),
    ],
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: ["service", `${id}`] })
    },
  })

  const toggleServiceItemsChecked = useApiMutation({
    mutationFn: (id: number) =>
      api.post(`${url}${id}/toggle-service-items-checked/`),
    invalidateQueries: [
      bg(["services"]),
      bg(["pending-items-stats"]),
      bg(["notifications"]),
      bg(["unread-notification-count"]),
    ],
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: ["service", `${id}`] })
    },
  })

  const linkAirconUnits = useApiMutation({
    mutationFn: ({ id, data }: { id: number; data: LinkAirconUnitsPayload }) =>
      api.post(`${url}${id}/link-aircon-units/`, data),
    invalidateQueries: [
      bg(["services"]),
      bg(["aircon-units"]),
      bg(["warranty-claims"]),
    ],
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: ["service", `${id}`] })
    },
  })

  const markClaimed = useApiMutation({
    mutationFn: ({ id, claimed_at }: { id: number; claimed_at?: string }) =>
      api.post(`${url}${id}/mark-claimed/`, claimed_at ? { claimed_at } : {}),
    successMessage: "Marked as claimed / delivered.",
    invalidateQueries: [bg(["services"]), bg(["unclaimed-eligible"])],
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: ["service", `${id}`] })
    },
  })

  const markForfeited = useApiMutation({
    mutationFn: ({ id, forfeiture_notes }: { id: number; forfeiture_notes?: string }) =>
      api.post(`${url}${id}/mark-forfeited/`, { forfeiture_notes }),
    successMessage: "Service forfeited. Appliance recorded as company asset.",
    invalidateQueries: [
      bg(["services"]),
      bg(["unclaimed-eligible"]),
      bg(["company-assets"]),
    ],
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: ["service", `${id}`] })
    },
  })

  const convertToAcquisition = useApiMutation({
    mutationFn: ({
      id,
      acquisition_price,
      notes,
    }: {
      id: number
      acquisition_price?: number | null
      notes?: string
    }) => api.post(`${url}${id}/convert-to-acquisition/`, { acquisition_price, notes }),
    successMessage: "Converted to company acquisition.",
    invalidateQueries: [bg(["services"]), bg(["company-assets"])],
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: ["service", `${id}`] })
    },
  })

  return {
    addService,
    updateService,
    deleteService,
    completeService,
    editPayment,
    voidPayment,
    recordPayment,
    cancelService,
    refundService,
    reopenService,
    toggleServiceItemsChecked,
    linkAirconUnits,
    markClaimed,
    markForfeited,
    convertToAcquisition,
  }
}
