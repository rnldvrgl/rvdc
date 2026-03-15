import type { PaginatedResult, WorkRequest } from "@/lib/constants/types"
import api from "@/lib/utils/api"
import { useQuery } from "@tanstack/react-query"

export type WorkRequestFilters = {
  status?: string
  date?: string
  employee?: number
}

export function useWorkRequests(filters?: WorkRequestFilters) {
  return useQuery({
    queryKey: ["attendance", "work-requests", filters],
    queryFn: async () => {
      const params = new URLSearchParams()

      if (filters?.status) params.append("status", filters.status)
      if (filters?.date) params.append("date", filters.date)
      if (filters?.employee)
        params.append("employee", filters.employee.toString())

      const { data } = await api.get<PaginatedResult<WorkRequest>>(
        `/attendance/work-requests/?${params}`,
      )
      return data
    },
  })
}

export function useMyWorkRequest(date: string | undefined) {
  return useQuery({
    queryKey: ["attendance", "work-requests", "my-request", date],
    queryFn: async () => {
      const { data } = await api.get<WorkRequest | null>(
        `/attendance/work-requests/my-request/?date=${date}`,
      )
      return data
    },
    enabled: !!date,
  })
}
