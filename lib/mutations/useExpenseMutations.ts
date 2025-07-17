'use client'

import { Expense, ExpensePayload } from '@/lib/constants/interface'
import { useApiMutation } from '@/lib/hooks/useApiMutation'
import api from '@/lib/utils/api'
import { useQueryClient } from '@tanstack/react-query'

export function useExpenseMutations() {
  const queryClient = useQueryClient()
  const url = 'expenses/'

  const addExpense = useApiMutation({
    mutationFn: (data: ExpensePayload) => api.post(url, data),
    successMessage: 'Expense created successfully.',
    invalidateQueries: [{ queryKey: ['expenses'] }],
  })

  const updateExpense = useApiMutation({
    mutationFn: ({ id, data }: { id: number; data: ExpensePayload }) =>
      api.patch(`${url}${id}/`, data),
    successMessage: 'Expense updated successfully.',
    invalidateQueries: [{ queryKey: ['expenses'] }],
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: ['expense', `${variables.id}`],
      })
    },
  })

  const deleteExpense = useApiMutation({
    mutationFn: (id: number) => api.delete(`${url}${id}/`),
    successMessage: 'Expense deleted successfully.',
    invalidateQueries: [{ queryKey: ['expenses'] }],
  })

  const payExpense = useApiMutation({
    mutationFn: ({ id, data }: { id: number; data: Expense }) =>
      api.patch(`${url}${id}/pay/`, data),
    successMessage: 'Expense payment recorded.',
    invalidateQueries: [{ queryKey: ['expenses'] }],
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: ['expense', `${variables.id}`],
      })
    },
  })

  const markExpenseAsPaid = useApiMutation({
    mutationFn: (id: number) => api.post(`${url}${id}/mark-as-paid/`),
    successMessage: 'Expense marked as paid.',
    invalidateQueries: [{ queryKey: ['expenses'] }],
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({
        queryKey: ['expense', `${id}`],
      })
    },
  })

  return {
    addExpense,
    updateExpense,
    deleteExpense,
    payExpense,
    markExpenseAsPaid,
  }
}
