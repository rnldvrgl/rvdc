"use client"

import { ServicePartTemplatePayload } from "@/lib/constants/interface"
import { useApiMutation } from "@/lib/hooks/useApiMutation"
import api from "@/lib/utils/api"

const url = "services/service-part-templates/"

const sharedInvalidations = [{ queryKey: ["service-part-templates"] }]

export function useServicePartTemplateMutations() {
  const addTemplate = useApiMutation({
    mutationFn: (data: ServicePartTemplatePayload) => api.post(url, data),
    successMessage: "Service parts template created.",
    invalidateQueries: sharedInvalidations,
  })

  const updateTemplate = useApiMutation({
    mutationFn: ({ id, data }: { id: number; data: ServicePartTemplatePayload }) =>
      api.patch(`${url}${id}/`, data),
    successMessage: "Service parts template updated.",
    invalidateQueries: sharedInvalidations,
  })

  const deleteTemplate = useApiMutation({
    mutationFn: (id: number) => api.delete(`${url}${id}/`),
    successMessage: "Service parts template deleted.",
    invalidateQueries: sharedInvalidations,
  })

  return { addTemplate, updateTemplate, deleteTemplate }
}
