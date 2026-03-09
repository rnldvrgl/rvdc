"use client"

import type { QuotationTermsTemplatePayload } from "@/lib/constants/types"
import { useApiMutation } from "@/lib/hooks/useApiMutation"
import api from "@/lib/utils/api"

export function useQuotationTemplateMutations() {
  const url = "quotations/templates/"

  const addTemplate = useApiMutation({
    mutationFn: (data: QuotationTermsTemplatePayload) => api.post(url, data),
    successMessage: "Template created successfully.",
    invalidateQueries: [{ queryKey: ["quotation-templates"] }],
  })

  const updateTemplate = useApiMutation({
    mutationFn: ({
      id,
      data,
    }: {
      id: number
      data: Partial<QuotationTermsTemplatePayload>
    }) => api.patch(`${url}${id}/`, data),
    successMessage: "Template updated successfully.",
    invalidateQueries: [{ queryKey: ["quotation-templates"] }],
  })

  const deleteTemplate = useApiMutation({
    mutationFn: (id: number) => api.delete(`${url}${id}/`),
    successMessage: "Template deleted successfully.",
    invalidateQueries: [{ queryKey: ["quotation-templates"] }],
  })

  return { addTemplate, updateTemplate, deleteTemplate }
}
