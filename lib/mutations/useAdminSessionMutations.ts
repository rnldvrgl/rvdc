"use client"

import { useApiMutation } from "@/lib/hooks/useApiMutation"
import { useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"
import api from "@/lib/utils/api"

export function useAdminSessionMutations() {
  const queryClient = useQueryClient()

  const revokeSession = useApiMutation({
    mutationFn: async (sessionId: number) => {
      const response = await api.post(`/auth/admin/sessions/${sessionId}/revoke/`)
      return response.data
    },
    onSuccess: () => {
      toast.success("Session revoked successfully")
      // Invalidate admin sessions query
      queryClient.invalidateQueries({
        queryKey: ["admin-sessions"],
      })
    },
    onError: (error: any) => {
      const message =
        error?.response?.data?.detail ||
        "Failed to revoke session. Please try again."
      toast.error(message)
    },
  })

  return {
    revokeSession,
  }
}
