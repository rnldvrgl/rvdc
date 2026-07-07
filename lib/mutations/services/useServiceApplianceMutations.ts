"use client"

import { ServiceAppliancePayload } from "@/lib/constants/interface"
import { useApiMutation } from "@/lib/hooks/useApiMutation"
import api from "@/lib/utils/api"
import { bg } from "@/lib/utils/queryInvalidation"
import { useQueryClient } from "@tanstack/react-query"

export function useServiceApplianceMutations() {
  const queryClient = useQueryClient()
  const url = "services/service-appliances/"

  const addAppliance = useApiMutation({
    mutationFn: (data: ServiceAppliancePayload) => api.post(url, data),
    successMessage: "Appliance added successfully.",
    invalidateQueries: [
      bg(["service-appliances"]),
      bg(["services"]),
      bg(["sales-transactions"]),
      bg(["remittances"]),
      bg(["summary"]),
      bg(["cash_flow"]),
    ],
    onSuccess: (_, variables) => {
      if (variables.service) {
        queryClient.invalidateQueries({
          queryKey: ["service", `${variables.service}`],
        })
      }
    },
  })

  const updateAppliance = useApiMutation({
    mutationFn: ({ id, data }: { id: number; data: ServiceAppliancePayload }) =>
      api.patch(`${url}${id}/`, data),
    successMessage: "Appliance updated successfully.",
    invalidateQueries: [
      bg(["service-appliances"]),
      bg(["services"]),
      bg(["sales-transactions"]),
      bg(["remittances"]),
      bg(["summary"]),
      bg(["cash_flow"]),
      bg(["notifications"]),
      bg(["unread-notification-count"]),
      bg(["pending-items-stats"]),
    ],
    onSuccess: (_, variables) => {
      if (variables.data.service) {
        queryClient.invalidateQueries({
          queryKey: ["service", `${variables.data.service}`],
        })
      }
    },
  })

  const deleteAppliance = useApiMutation({
    mutationFn: ({ id }: { id: number; serviceId?: number }) =>
      api.delete(`${url}${id}/`),
    successMessage: "Appliance deleted successfully.",
    invalidateQueries: [
      bg(["service-appliances"]),
      bg(["services"]),
      bg(["sales-transactions"]),
      bg(["remittances"]),
      bg(["summary"]),
      bg(["cash_flow"]),
    ],
    onSuccess: (_, variables) => {
      if (variables.serviceId) {
        queryClient.invalidateQueries({
          queryKey: ["service", `${variables.serviceId}`],
        })
      }
    },
  })

  const toggleItemsChecked = useApiMutation({
    mutationFn: ({ id }: { id: number; serviceId?: number }) =>
      api.post(`${url}${id}/toggle-items-checked/`),
    invalidateQueries: [
      bg(["service-appliances"]),
      bg(["services"]),
      bg(["pending-items-stats"]),
      bg(["notifications"]),
      bg(["unread-notification-count"]),
    ],
    onSuccess: (_, variables) => {
      if (variables.serviceId) {
        queryClient.invalidateQueries({
          queryKey: ["service", `${variables.serviceId}`],
        })
      }
    },
  })

  const markApplianceClaimed = useApiMutation({
    mutationFn: ({ id, claimed_at }: { id: number; serviceId?: number; claimed_at?: string }) =>
      api.post(`${url}${id}/mark-claimed/`, { claimed_at }),
    successMessage: "Appliance marked as claimed.",
    invalidateQueries: [
      bg(["service-appliances"]),
      bg(["services"]),
      bg(["unclaimed-alerts"]),
    ],
    onSuccess: (_, variables) => {
      if (variables.serviceId) {
        queryClient.invalidateQueries({
          queryKey: ["service", `${variables.serviceId}`],
        })
      }
    },
  })

  const markApplianceForfeited = useApiMutation({
    mutationFn: ({ id, forfeiture_notes }: { id: number; serviceId?: number; forfeiture_notes?: string }) =>
      api.post(`${url}${id}/mark-forfeited/`, { forfeiture_notes }),
    successMessage: "Appliance forfeited and recorded as company asset.",
    invalidateQueries: [
      bg(["service-appliances"]),
      bg(["services"]),
      bg(["company-assets"]),
      bg(["unclaimed-alerts"]),
    ],
    onSuccess: (_, variables) => {
      if (variables.serviceId) {
        queryClient.invalidateQueries({
          queryKey: ["service", `${variables.serviceId}`],
        })
      }
    },
  })

  const convertApplianceToAcquisition = useApiMutation({
    mutationFn: ({
      id,
      acquisition_price,
      notes,
    }: { id: number; serviceId?: number; acquisition_price?: number | null; notes?: string }) =>
      api.post(`${url}${id}/convert-to-acquisition/`, { acquisition_price, notes }),
    successMessage: "Appliance converted to company acquisition.",
    invalidateQueries: [
      bg(["service-appliances"]),
      bg(["services"]),
      bg(["company-assets"]),
      bg(["unclaimed-alerts"]),
    ],
    onSuccess: (_, variables) => {
      if (variables.serviceId) {
        queryClient.invalidateQueries({
          queryKey: ["service", `${variables.serviceId}`],
        })
      }
    },
  })

  return {
    addAppliance,
    updateAppliance,
    deleteAppliance,
    toggleItemsChecked,
    markApplianceClaimed,
    markApplianceForfeited,
    convertApplianceToAcquisition,
  }
}
