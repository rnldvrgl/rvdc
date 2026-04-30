"use client"

import type {
  QuotationPriceListTemplate,
} from "@/lib/constants/types"
import { useApiMutation } from "@/lib/hooks/useApiMutation"
import api from "@/lib/utils/api"

type QuotationPriceListTemplatePayload = Pick<
  QuotationPriceListTemplate,
  "name" | "description" | "aircon_models" | "is_active" | "is_default"
>

export function useQuotationPriceListTemplateMutations() {
  const url = "quotations/price-list-templates/"

  const addTemplate = useApiMutation({
    mutationFn: (data: QuotationPriceListTemplatePayload) => api.post(url, data),
    successMessage: "Price list template created successfully.",
    invalidateQueries: [{ queryKey: ["quotation-price-list-templates"] }],
  })

  const updateTemplate = useApiMutation({
    mutationFn: ({
      id,
      data,
    }: {
      id: number
      data: Partial<QuotationPriceListTemplatePayload>
    }) => api.patch(`${url}${id}/`, data),
    successMessage: "Price list template updated successfully.",
    invalidateQueries: [{ queryKey: ["quotation-price-list-templates"] }],
  })

  const deleteTemplate = useApiMutation({
    mutationFn: (id: number) => api.delete(`${url}${id}/`),
    successMessage: "Price list template deleted successfully.",
    invalidateQueries: [{ queryKey: ["quotation-price-list-templates"] }],
  })

  return { addTemplate, updateTemplate, deleteTemplate }
}
