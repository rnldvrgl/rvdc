'use client'

import { ProductCategoryPayload } from '@/lib/constants/interface'
import { useApiMutation } from '@/lib/hooks/useApiMutation'
import api from '@/lib/utils/api'
import { useQueryClient } from '@tanstack/react-query'

export function useItemCategoryMutations() {
  const queryClient = useQueryClient()

  const addCategory = useApiMutation({
    mutationFn: (data: ProductCategoryPayload) =>
      api.post('/inventory/categories/', data),
    successMessage: 'Category created successfully.',
    invalidateQueries: [{ queryKey: ['categories'] }],
  })

  const updateCategory = useApiMutation({
    mutationFn: ({ id, data }: { id: number; data: ProductCategoryPayload }) =>
      api.patch(`/inventory/categories/${id}/`, data),
    successMessage: 'Category updated successfully.',
    invalidateQueries: [{ queryKey: ['categories'] }],
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: ['category', `${variables.id}`],
      })
    },
  })

  const deleteCategory = useApiMutation({
    mutationFn: (id: number) => api.delete(`/inventory/categories/${id}/`),
    successMessage: 'Category deleted successfully.',
    invalidateQueries: [{ queryKey: ['categories'] }],
  })

  return { addCategory, updateCategory, deleteCategory }
}
