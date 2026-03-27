"use client"

import { useApiMutation } from "@/lib/hooks/useApiMutation"
import api from "@/lib/utils/api"
import { useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"

interface ErrorResponseData {
  response?: {
    data?: {
      detail?: string
    }
  }
}

function getErrorMessage(error: unknown): string {
  if (
    typeof error === "object" &&
    error !== null &&
    "response" in error &&
    typeof (error as ErrorResponseData).response === "object"
  ) {
    const detail = (error as ErrorResponseData).response?.data?.detail
    if (typeof detail === "string") {
      return detail
    }
  }
  return "Failed to revoke session. Please try again."
}

export function useAdminSessionMutations() {
  const queryClient = useQueryClient()

  const revokeSession = useApiMutation({
    mutationFn: async (sessionId: number) => {
      const response = await api.post(
        `/auth/admin/sessions/${sessionId}/revoke/`,
      )
      return response.data
    },
    onSuccess: () => {
      toast.success("Session revoked successfully")
      // Invalidate admin sessions query
      queryClient.invalidateQueries({
        queryKey: ["admin-sessions"],
      })
    },
    onError: (error: unknown) => {
      const message = getErrorMessage(error)
      toast.error(message)
    },
  })

  return {
    revokeSession,
  }
}
