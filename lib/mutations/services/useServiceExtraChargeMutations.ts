"use client"

import { ServiceExtraChargePayload } from "@/lib/constants/interface"
import { useApiMutation } from "@/lib/hooks/useApiMutation"
import api from "@/lib/utils/api"
import { useQueryClient } from "@tanstack/react-query"

export function useServiceExtraChargeMutations() {
  const queryClient = useQueryClient()
  const url = "services/service-extra-charges/"

  const addExtraCharge = useApiMutation({
    mutationFn: (data: ServiceExtraChargePayload) => api.post(url, data),
    successMessage: "Extra charge added.",
    invalidateQueries: [{ queryKey: ["services"] }],
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["service", `${variables.service}`],
      })
      queryClient.invalidateQueries({
        queryKey: ["service-extra-charges", variables.service],
      })
    },
  })

  const updateExtraCharge = useApiMutation({
    mutationFn: ({
      id,
      data,
    }: {
      id: number
      data: Partial<ServiceExtraChargePayload>
    }) => api.patch(`${url}${id}/`, data),
    successMessage: "Extra charge updated.",
    invalidateQueries: [{ queryKey: ["services"] }],
    onSuccess: (_, variables) => {
      if (variables.data.service) {
        queryClient.invalidateQueries({
          queryKey: ["service", `${variables.data.service}`],
        })
        queryClient.invalidateQueries({
          queryKey: ["service-extra-charges", variables.data.service],
        })
      }
    },
  })

  const deleteExtraCharge = useApiMutation({
    mutationFn: ({ id }: { id: number; serviceId: number }) =>
      api.delete(`${url}${id}/`),
    successMessage: "Extra charge removed.",
    invalidateQueries: [{ queryKey: ["services"] }],
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["service", `${variables.serviceId}`],
      })
      queryClient.invalidateQueries({
        queryKey: ["service-extra-charges", variables.serviceId],
      })
    },
  })

  return { addExtraCharge, updateExtraCharge, deleteExtraCharge }
}
