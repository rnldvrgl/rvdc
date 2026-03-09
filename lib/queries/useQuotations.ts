import type {
  PaginatedFilterProps,
  PaginatedResult,
  Quotation,
} from "@/lib/constants/types"
import { useApiQuery } from "@/lib/hooks/useApiQuery"

const url = "/quotations/"

export function useQuotation(id: string) {
  return useApiQuery<Quotation>({
    queryKey: ["quotation", id],
    url: `${url}${id}/`,
    enabled: !!id,
  })
}

export function useQuotations({
  page = 1,
  limit = 10,
  search,
  ordering,
  filter = {},
}: PaginatedFilterProps) {
  return useApiQuery<PaginatedResult<Quotation>>({
    queryKey: ["quotations", page, limit, search, ordering, filter],
    url,
    params: {
      page,
      limit,
      search: search || undefined,
      ordering: ordering || undefined,
      ...filter,
    },
  })
}
