"use client"

import type { QuotationPayload } from "@/lib/constants/types"
import { useApiMutation } from "@/lib/hooks/useApiMutation"
import api from "@/lib/utils/api"
import { useQueryClient } from "@tanstack/react-query"

export function useQuotationMutations() {
  const queryClient = useQueryClient()
  const url = "quotations/"

  const addQuotation = useApiMutation({
    mutationFn: (data: QuotationPayload) =>
      api.post(url, data, {
        headers: { "Idempotency-Key": crypto.randomUUID() },
      }),
    successMessage: "Quotation created successfully.",
    invalidateQueries: [{ queryKey: ["quotations"] }],
  })

  const updateQuotation = useApiMutation({
    mutationFn: ({ id, data }: { id: number; data: QuotationPayload }) =>
      api.patch(`${url}${id}/`, data),
    successMessage: "Quotation updated successfully.",
    invalidateQueries: [{ queryKey: ["quotations"] }],
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["quotation", `${variables.id}`],
      })
    },
  })

  const deleteQuotation = useApiMutation({
    mutationFn: (id: number) => api.delete(`${url}${id}/`),
    successMessage: "Quotation archived successfully.",
    invalidateQueries: [
      { queryKey: ["quotations"] },
      { queryKey: ["quotations-archived"] },
    ],
  })

  return { addQuotation, updateQuotation, deleteQuotation }
}
