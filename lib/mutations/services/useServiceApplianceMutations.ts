"use client"

import { ServiceAppliancePayload } from "@/lib/constants/interface"
import { useApiMutation } from "@/lib/hooks/useApiMutation"
import api from "@/lib/utils/api"
import { useQueryClient } from "@tanstack/react-query"

export function useServiceApplianceMutations() {
  const queryClient = useQueryClient()
  const url = "services/service-appliances/"

  const addAppliance = useApiMutation({
    mutationFn: (data: ServiceAppliancePayload) => api.post(url, data),
    successMessage: "Appliance added successfully.",
    invalidateQueries: [
      { queryKey: ["service-appliances"] },
      { queryKey: ["services"] },
      { queryKey: ["sales-transactions"] },
      { queryKey: ["remittances"] },
      { queryKey: ["summary"] },
      { queryKey: ["cash_flow"] },
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
      { queryKey: ["service-appliances"] },
      { queryKey: ["services"] },
      { queryKey: ["sales-transactions"] },
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
      { queryKey: ["service-appliances"] },
      { queryKey: ["services"] },
      { queryKey: ["sales-transactions"] },
      { queryKey: ["remittances"] },
      { queryKey: ["summary"] },
      { queryKey: ["cash_flow"] },
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
      { queryKey: ["service-appliances"] },
      { queryKey: ["services"] },
      { queryKey: ["pending-items-stats"] },
      { queryKey: ["notifications"] },
      { queryKey: ["unread-notification-count"] },
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
      { queryKey: ["service-appliances"] },
      { queryKey: ["services"] },
      { queryKey: ["unclaimed-alerts"] },
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
      { queryKey: ["service-appliances"] },
      { queryKey: ["services"] },
      { queryKey: ["company-assets"] },
      { queryKey: ["unclaimed-alerts"] },
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
      { queryKey: ["service-appliances"] },
      { queryKey: ["services"] },
      { queryKey: ["company-assets"] },
      { queryKey: ["unclaimed-alerts"] },
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
