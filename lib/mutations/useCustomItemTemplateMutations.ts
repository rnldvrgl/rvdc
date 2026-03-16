"use client"

import { CustomItemTemplatePayload } from "@/lib/constants/interface"
import { useApiMutation } from "@/lib/hooks/useApiMutation"
import api from "@/lib/utils/api"

const url = "/inventory/custom-item-templates/"

const sharedInvalidations = [
  { queryKey: ["custom-item-templates"] },
  { queryKey: ["custom-item-template-choices"] },
]

export function useCustomItemTemplateMutations() {
  const addTemplate = useApiMutation({
    mutationFn: (data: CustomItemTemplatePayload) => api.post(url, data),
    successMessage: "Custom item template created.",
    invalidateQueries: sharedInvalidations,
  })

  const updateTemplate = useApiMutation({
    mutationFn: ({
      id,
      data,
    }: {
      id: number
      data: CustomItemTemplatePayload
    }) => api.patch(`${url}${id}/`, data),
    successMessage: "Custom item template updated.",
    invalidateQueries: sharedInvalidations,
  })

  const deleteTemplate = useApiMutation({
    mutationFn: (id: number) => api.delete(`${url}${id}/`),
    successMessage: "Custom item template deleted.",
    invalidateQueries: sharedInvalidations,
  })

  return { addTemplate, updateTemplate, deleteTemplate }
}
