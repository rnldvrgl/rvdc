"use client"

import { UseApiMutationProps } from "@/lib/constants/interface"
import { useDRFToastError } from "@/lib/hooks/useDRFToastError"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"

interface ErrorResponse {
  response?: {
    data?: {
      non_field_errors?: string[]
      detail?: string
      [key: string]: unknown
    }
  }
}

export function useApiMutation<TVariables, TData>({
  mutationFn,
  successMessage,
  invalidateQueries = [],
  onSuccess,
  onError,
  usePromiseToast = false,
  loadingMessage = "Processing...",
  errorMessage,
  retry,
}: UseApiMutationProps<TVariables, TData>) {
  const queryClient = useQueryClient()
  const { handleError } = useDRFToastError()

  // Shared invalidation runner — respects an optional per-key refetchType
  // so collateral queries (analytics, other list views) can be marked
  // stale without forcing an immediate competing refetch.
  const runInvalidations = () => {
    invalidateQueries.forEach(({ queryKey, refetchType }) => {
      queryClient.invalidateQueries({
        queryKey,
        refetchType: refetchType ?? "active",
      })
    })
  }

  const mutation = useMutation<TData, unknown, TVariables>({
    mutationFn,
    retry,
    onSuccess: (data, variables) => {
      // Only show success toast if not using promise toast
      // (promise toast handles success automatically)
      if (successMessage && !usePromiseToast) {
        toast.success(successMessage)
      }

      runInvalidations()

      onSuccess?.(data, variables)
    },
    onError: (error) => {
      // Only handle error if not using promise toast
      // (promise toast handles error automatically)
      if (!usePromiseToast) {
        handleError(error)
      }
      onError?.(error)
    },
  })

  // Enhanced mutate function with toast.promise support
  const mutateWithPromise = async (variables: TVariables) => {
    if (usePromiseToast) {
      const promise = mutationFn(variables).then((data) => {
        runInvalidations()

        // Call onSuccess callback
        onSuccess?.(data, variables)

        return data
      })

      toast.promise(promise, {
        loading: loadingMessage,
        success: successMessage,
        error: (err) => {
          // Call onError callback
          onError?.(err)

          // Return custom error message or extract from DRF response
          if (errorMessage) {
            return errorMessage
          }

          // Handle server errors (500+)
          if (err && typeof err === "object" && "response" in err) {
            const status = (err as { response: { status: number } }).response
              ?.status
            if (status && status >= 500) {
              return "Something went wrong on our end. Please try again later or contact your administrator."
            }
          }

          // Try to extract DRF error message
          if (err && typeof err === "object" && "response" in err) {
            const errorResponse = err as ErrorResponse
            if (errorResponse.response?.data) {
              const data = errorResponse.response.data

              // Handle non_field_errors
              if (
                data.non_field_errors &&
                Array.isArray(data.non_field_errors)
              ) {
                return data.non_field_errors.join(", ")
              }

              // Handle detail field
              if (data.detail) {
                return data.detail
              }

              // Handle first field error
              const firstKey = Object.keys(data)[0]
              if (firstKey && data[firstKey]) {
                const value = data[firstKey]
                if (Array.isArray(value)) {
                  return `${firstKey}: ${value.join(", ")}`
                }
                return `${firstKey}: ${value}`
              }
            }
          }

          // Fallback error message
          return "An error occurred. Please try again."
        },
      })

      return promise
    } else {
      // Standard mutation without promise toast
      return mutation.mutateAsync(variables)
    }
  }

  return {
    ...mutation,
    mutate: mutation.mutate,
    mutateAsync: mutateWithPromise,
    isPending: mutation.isPending,
  }
}
