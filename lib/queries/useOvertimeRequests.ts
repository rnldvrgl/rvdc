import type { PaginatedResult } from "@/lib/constants/types"
import api from "@/lib/utils/api"
import { useQuery } from "@tanstack/react-query"

/**
 * Overtime Request type definition
 */
export type OvertimeRequest = {
  id: number
  employee: number
  employee_detail: {
    id: number
    username: string
    email: string
    first_name: string
    last_name: string
    full_name: string
  }
  date: string
  time_start: string
  time_end: string
  reason: string
  approved: boolean
  approved_by: number | null
  approved_at: string | null
  created_at: string
  updated_at: string
}

/**
 * Query parameters for overtime requests
 */
export type OvertimeRequestFilters = {
  employee?: number
  approved?: boolean
  date_from?: string
  date_to?: string
  ordering?: string
}

/**
 * Hook to fetch list of overtime requests
 */
export function useOvertimeRequests(filters?: OvertimeRequestFilters) {
  return useQuery({
    queryKey: ["attendance", "overtime-requests", filters],
    queryFn: async () => {
      const params = new URLSearchParams()

      if (filters?.employee)
        params.append("employee", filters.employee.toString())
      if (filters?.approved !== undefined)
        params.append("approved", filters.approved.toString())
      if (filters?.date_from) params.append("date_from", filters.date_from)
      if (filters?.date_to) params.append("date_to", filters.date_to)
      if (filters?.ordering) params.append("ordering", filters.ordering)

      const { data } = await api.get<PaginatedResult<OvertimeRequest>>(
        `/attendance/overtime-requests/?${params}`,
      )
      return data
    },
  })
}

/**
 * Hook to fetch a single overtime request by ID
 */
export function useOvertimeRequest(id: number) {
  return useQuery({
    queryKey: ["attendance", "overtime-request", id],
    queryFn: async () => {
      const { data } = await api.get<OvertimeRequest>(
        `/attendance/overtime-requests/${id}/`,
      )
      return data
    },
    enabled: !!id,
  })
}
