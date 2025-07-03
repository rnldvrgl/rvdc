'use client'

import { useDRFToastError } from '@/lib/hooks/useDRFToastError'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import toast from 'react-hot-toast'

interface UseApiMutationProps<TFn extends (...args: any[]) => any> {
  mutationFn: TFn
  successMessage?: string
  invalidateQueries?: { queryKey: string[] }[]
  onSuccess?: (
    data: Awaited<ReturnType<TFn>>,
    variables: Parameters<TFn>[0],
  ) => void
  onError?: (error: any) => void
}

/**
 * A generic wrapper around useMutation that handles:
 * ✅ DRF-style errors via useDRFToastError
 * ✅ Success toasts
 * ✅ Automatic query invalidation
 */
export function useApiMutation<TFn extends (...args: any[]) => any>({
  mutationFn,
  successMessage,
  invalidateQueries = [],
  onSuccess,
  onError,
}: UseApiMutationProps<TFn>) {
  const queryClient = useQueryClient()
  const { handleError } = useDRFToastError()

  return useMutation<Awaited<ReturnType<TFn>>, unknown, Parameters<TFn>[0]>({
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
}
