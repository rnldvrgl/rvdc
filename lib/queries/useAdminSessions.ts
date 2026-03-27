import { useApiQuery } from "@/lib/hooks/useApiQuery"

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
  const params: Record<string, unknown> = {}
  if (options?.userId) params.user_id = options.userId
  if (options?.includeRevoked) params.include_revoked = "true"

  return useApiQuery<AdminSession[]>({
    queryKey: ["admin-sessions", options?.userId, options?.includeRevoked],
    url: "/auth/admin/sessions/",
    params,
  })
}
