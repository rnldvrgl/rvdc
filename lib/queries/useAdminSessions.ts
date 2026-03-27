import { useQuery } from "@tanstack/react-query"
import { api } from "@/lib/utils/api"

export interface AdminSession {
  id: number
  user: {
    id: number
    username: string
    email: string
    first_name: string
    last_name: string
  }
  device_id: string
  device_label: string
  user_agent: string
  ip_address: string
  is_active: boolean
  created_at: string
  last_seen_at: string
  expires_at: string | null
  revoked_at: string | null
  is_current_device?: boolean
}

interface UseAdminSessionsOptions {
  userId?: string | number
  includeRevoked?: boolean
}

export function useAdminSessions(options?: UseAdminSessionsOptions) {
  return useQuery({
    queryKey: ["admin-sessions", options?.userId, options?.includeRevoked],
    queryFn: async (): Promise<AdminSession[]> => {
      const params = new URLSearchParams()
      if (options?.userId) {
        params.append("user_id", String(options.userId))
      }
      if (options?.includeRevoked) {
        params.append("include_revoked", "true")
      }

      const queryString = params.toString()
      const url = queryString
        ? `/api/auth/admin/sessions/?${queryString}`
        : "/api/auth/admin/sessions/"

      const response = await api.get<AdminSession[]>(url)
      return response.data
    },
    staleTime: 1000 * 60, // 1 minute
    gcTime: 1000 * 60 * 5, // 5 minutes
  })
}
