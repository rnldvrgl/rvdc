"use client"

import { ClientPayload } from "@/lib/constants/types"
import { useApiMutation } from "@/lib/hooks/useApiMutation"
import api from "@/lib/utils/api"
import { useQueryClient } from "@tanstack/react-query"

export function useClientMutations() {
  const queryClient = useQueryClient()
  const url = "/clients/"

  const analyticsKeys = [["summary"], ["top_clients"], ["client-choices"]]

  const addClient = useApiMutation({
    mutationFn: (data: ClientPayload) => api.post(url, data),
    successMessage: "Client created successfully.",
    invalidateQueries: [
      { queryKey: ["clients"] },
      ...analyticsKeys.map((key) => ({ queryKey: key })),
    ],
  })

  const updateClient = useApiMutation({
    mutationFn: ({ id, data }: { id: number; data: ClientPayload }) =>
      api.patch(`${url}${id}/`, data),
    successMessage: "Client updated successfully.",
    invalidateQueries: [
      { queryKey: ["clients"] },
      ...analyticsKeys.map((key) => ({ queryKey: key })),
    ],
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["client", `${variables.id}`] })
    },
  })

  const deleteClient = useApiMutation({
    mutationFn: (id: number) => api.delete(`${url}${id}/`),
    successMessage: "Client archived successfully.",
    invalidateQueries: [
      { queryKey: ["clients"] },
      { queryKey: ["clients-archived"] },
      ...analyticsKeys.map((key) => ({ queryKey: key })),
    ],
  })

  return { addClient, updateClient, deleteClient }
}
