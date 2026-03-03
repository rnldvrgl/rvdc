"use client"

import { ProductCategoryPayload } from "@/lib/constants/interface"
import { useApiMutation } from "@/lib/hooks/useApiMutation"
import api from "@/lib/utils/api"
import { useQueryClient } from "@tanstack/react-query"

export function useItemCategoryMutations() {
  const queryClient = useQueryClient()
  const url = "/inventory/categories/"

  const analyticsKeys = [
    ["summary"],
    ["top_selling_items"],
    ["category-choices"],
  ]

  const addCategory = useApiMutation({
    mutationFn: (data: ProductCategoryPayload) => api.post(url, data),
    successMessage: "Category created successfully.",
    invalidateQueries: [
      { queryKey: ["categories"] },
      ...analyticsKeys.map((key) => ({ queryKey: key })),
    ],
  })

  const updateCategory = useApiMutation({
    mutationFn: ({ id, data }: { id: number; data: ProductCategoryPayload }) =>
      api.patch(`${url}${id}/`, data),
    successMessage: "Category updated successfully.",
    invalidateQueries: [
      { queryKey: ["categories"] },
      ...analyticsKeys.map((key) => ({ queryKey: key })),
    ],
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["category", `${variables.id}`],
      })
    },
  })

  const deleteCategory = useApiMutation({
    mutationFn: (id: number) => api.delete(`${url}${id}/`),
    successMessage: "Category archived successfully.",
    invalidateQueries: [
      { queryKey: ["categories"] },
      { queryKey: ["item-categories-archived"] },
      ...analyticsKeys.map((key) => ({ queryKey: key })),
    ],
  })

  return { addCategory, updateCategory, deleteCategory }
}
