import { STALE_TIME } from "@/lib/constants/general"
import { useApiQuery } from "@/lib/hooks/useApiQuery"

const url = "/services/jo-template-prints/"

export interface JobOrderTemplatePrint {
  id: number
  start_number: number
  end_number: number
  printed_by: number
  printed_by_name: string
  printed_at: string
}

interface PaginatedResult {
  count: number
  next: string | null
  previous: string | null
  results: JobOrderTemplatePrint[]
}

export function useJobOrderTemplatePrints(params: {
  page?: number
  limit?: number
  ordering?: string
} = {}) {
  return useApiQuery<PaginatedResult>({
    queryKey: ["jo-template-prints", params],
    url,
    params: {
      page: params.page,
      limit: params.limit ?? 10,
      ordering: params.ordering ?? "-printed_at",
    },
  })
}

export function useNextJobOrderNumber() {
  return useApiQuery<{ next_number: number }>({
    queryKey: ["jo-next-number"],
    url: `${url}next_number/`,
    staleTime: STALE_TIME.SHORT,
  })
}
