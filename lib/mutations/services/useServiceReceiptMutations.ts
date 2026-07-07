"use client"

import { ServiceReceiptPayload } from "@/lib/constants/interface"
import { useApiMutation } from "@/lib/hooks/useApiMutation"
import api from "@/lib/utils/api"
import { bg } from "@/lib/utils/queryInvalidation"
import { useQueryClient } from "@tanstack/react-query"

export function useServiceReceiptMutations() {
  const queryClient = useQueryClient()
  const url = "services/service-receipts/"

  const addReceipt = useApiMutation({
    mutationFn: (data: ServiceReceiptPayload) => api.post(url, data),
    successMessage: "Receipt added.",
    invalidateQueries: [bg(["services"])],
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["service", `${variables.service}`],
      })
    },
  })

  const updateReceipt = useApiMutation({
    mutationFn: ({
      id,
      data,
    }: {
      id: number
      data: Partial<ServiceReceiptPayload>
    }) => api.patch(`${url}${id}/`, data),
    successMessage: "Receipt updated.",
    invalidateQueries: [bg(["services"])],
    onSuccess: (_, variables) => {
      if (variables.data.service) {
        queryClient.invalidateQueries({
          queryKey: ["service", `${variables.data.service}`],
        })
      }
    },
  })

  const deleteReceipt = useApiMutation({
    mutationFn: ({ id }: { id: number; serviceId: number }) =>
      api.delete(`${url}${id}/`),
    successMessage: "Receipt removed.",
    invalidateQueries: [bg(["services"])],
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["service", `${variables.serviceId}`],
      })
    },
  })

  return { addReceipt, updateReceipt, deleteReceipt }
}
