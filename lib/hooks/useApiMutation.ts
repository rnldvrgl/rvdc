'use client'

import { UseApiMutationProps } from '@/lib/constants/interface'
import { useDRFToastError } from '@/lib/hooks/useDRFToastError'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import toast from 'react-hot-toast'

export function useApiMutation<TFn extends (...args: any[]) => any>({
  mutationFn,
  successMessage,
  invalidateQueries = [],
  onSuccess,
  onError,
}: UseApiMutationProps<TFn>) {
  const queryClient = useQueryClient()
  const { handleError } = useDRFToastError()

  const mutation = useMutation<
    Awaited<ReturnType<TFn>>,
    unknown,
    Parameters<TFn>[0]
  >({
    mutationFn,
    onSuccess: (data, variables) => {
      if (successMessage) {
        toast.success(successMessage)
      }

      invalidateQueries.forEach(({ queryKey }) => {
        queryClient.invalidateQueries({ queryKey })
      })

      onSuccess?.(data, variables)
    },
    onError: (error) => {
      handleError(error)
      onError?.(error)
    },
  })

  return {
    ...mutation,
    isPending: mutation.isPending,
  }
}
