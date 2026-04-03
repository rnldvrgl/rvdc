"use client"

import { useApiMutation } from "@/lib/hooks/useApiMutation"
import api from "@/lib/utils/api"
import { useQueryClient } from "@tanstack/react-query"

const url = "services/company-assets/"

export function useCompanyAssetMutations() {
  const queryClient = useQueryClient()

  const dispose = useApiMutation({
    mutationFn: ({ id, notes }: { id: number; notes?: string }) =>
      api.post(`${url}${id}/dispose/`, { status: "disposed", disposal_notes: notes }),
    successMessage: "Asset marked as disposed.",
    invalidateQueries: [{ queryKey: ["company-assets"] }],
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: ["company-asset", id] })
    },
  })

  const sell = useApiMutation({
    mutationFn: ({
      id,
      sale_price,
      sold_to,
      disposal_notes,
    }: {
      id: number
      sale_price: number
      sold_to: number
      disposal_notes?: string
    }) =>
      api.post(`${url}${id}/dispose/`, {
        status: "sold",
        sale_price,
        sold_to,
        disposal_notes,
      }),
    successMessage: "Asset marked as sold.",
    invalidateQueries: [{ queryKey: ["company-assets"] }],
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: ["company-asset", id] })
    },
  })

  const updateStatus = useApiMutation({
    mutationFn: ({
      id,
      status,
      condition_notes,
    }: {
      id: number
      status: string
      condition_notes?: string
    }) => api.patch(`${url}${id}/`, { status, condition_notes }),
    successMessage: "Asset status updated.",
    invalidateQueries: [{ queryKey: ["company-assets"] }],
  })

  return { dispose, sell, updateStatus }
}
