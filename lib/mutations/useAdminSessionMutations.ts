"use client"

import { useApiMutation } from "@/lib/hooks/useApiMutation"
import api from "@/lib/utils/api"

export function useAdminSessionMutations() {
  const revokeSession = useApiMutation({
    mutationFn: async (sessionId: number) => {
      const response = await api.post(
        `/auth/admin/sessions/${sessionId}/revoke/`,
      )
      return response.data
    },
    successMessage: "Session revoked successfully",
    invalidateQueries: [{ queryKey: ["admin-sessions"] }],
  })

  return {
    revokeSession,
  }
}
