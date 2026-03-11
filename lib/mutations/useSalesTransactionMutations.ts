"use client"

import {
  SalesTransactionPayload,
  SalesTransactionVoidingPayload,
} from "@/lib/constants/interface"
import { useApiMutation } from "@/lib/hooks/useApiMutation"
import api from "@/lib/utils/api"
import { useQueryClient } from "@tanstack/react-query"

export function useSalesTransactionMutations() {
  const queryClient = useQueryClient()
  const url = "sales/transactions/"

  const analyticsKeys = [
    ["summary"],
    ["cash_flow"],
    ["top_items"],
    ["unpaid_statuses"],
  ]

  const commonInvalidations = [
    { queryKey: ["sales-transactions"] },
    { queryKey: ["stall-stocks"] },
    ...analyticsKeys.map((key) => ({ queryKey: key })),
  ]

  const addTransaction = useApiMutation({
    mutationFn: (data: SalesTransactionPayload) => api.post(url, data),
    successMessage: "Sales transaction created successfully.",
    invalidateQueries: commonInvalidations,
  })

  const updateTransaction = useApiMutation({
    mutationFn: ({ id, data }: { id: number; data: SalesTransactionPayload }) =>
      api.patch(`${url}${id}/`, data),
    successMessage: "Sales transaction updated successfully.",
    invalidateQueries: commonInvalidations,
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["sales-transaction", `${variables.id}`],
      })
    },
  })

  const deleteTransaction = useApiMutation({
    mutationFn: (id: number) => api.delete(`${url}${id}/`),
    successMessage: "Sales transaction archived.",
    invalidateQueries: [
      ...commonInvalidations,
      { queryKey: ["sales-transactions-archived"] },
    ],
  })

  const voidTransaction = useApiMutation({
    mutationFn: ({
      id,
      data,
    }: {
      id: number
      data: SalesTransactionVoidingPayload
    }) => api.post(`${url}${id}/void/`, data),
    successMessage: "Sales transaction voided.",
    invalidateQueries: [
      ...commonInvalidations,
      { queryKey: ["sales-transactions-voided"] },
    ],
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["sales-transaction", `${variables.id}`],
      })
    },
  })

  const unvoidTransaction = useApiMutation({
    mutationFn: (id: number) => api.post(`${url}${id}/unvoid/`),
    successMessage: "Sales transaction restored.",
    invalidateQueries: [
      ...commonInvalidations,
      { queryKey: ["sales-transactions-voided"] },
    ],
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({
        queryKey: ["sales-transaction", `${id}`],
      })
    },
  })

  const hardDeleteVoided = useApiMutation({
    mutationFn: (id: number) => api.delete(`${url}${id}/hard-delete-voided/`),
    successMessage: "Transaction permanently deleted.",
    invalidateQueries: [
      ...commonInvalidations,
      { queryKey: ["sales-transactions-voided"] },
    ],
  })

  return {
    addTransaction,
    updateTransaction,
    deleteTransaction,
    voidTransaction,
    unvoidTransaction,
    hardDeleteVoided,
  }
}
