import { STALE_TIME } from "@/lib/constants/general"
import { CursorPaginatedResponse, PaginatedFilterProps } from "@/lib/constants/types"
import { useApiQuery } from "@/lib/hooks/useApiQuery"
import qs from "qs"

interface UseCursorPaginatedQueryOptions<T, TSelect = CursorPaginatedResponse<T>>
  extends PaginatedFilterProps {
  url: string
  queryKeyBase: string
  enabled?: boolean
  select?: (data: CursorPaginatedResponse<T>) => TSelect
}

export function useCursorPaginatedQuery<T>({
  url,
  queryKeyBase,
  limit = 10,
  search,
  ordering,
  start_date,
  end_date,
  filter = {},
  cursor,
  enabled = true,
  select,
}: UseCursorPaginatedQueryOptions<T>) {
  const serializedFilter = qs.stringify(filter, {
    sort: (a, b) => a.localeCompare(b),
  })

  return useApiQuery<CursorPaginatedResponse<T>>({
    queryKey: [
      queryKeyBase,
      "cursor",
      cursor || "",
      limit,
      search || "",
      ordering || "",
      start_date || "",
      end_date || "",
      serializedFilter,
    ],
    url,
    params: {
      pagination: "cursor",
      cursor: cursor || undefined,
      limit,
      search: search || undefined,
      ordering: ordering || undefined,
      start_date: start_date || undefined,
      end_date: end_date || undefined,
      ...filter,
    },
    staleTime: STALE_TIME.DEFAULT,
    options: {
      enabled,
      select,
    },
  })
}