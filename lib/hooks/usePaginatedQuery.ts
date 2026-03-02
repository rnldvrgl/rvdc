import { PaginatedFilterProps, PaginatedResult } from "@/lib/constants/types"
import { useApiQuery } from "@/lib/hooks/useApiQuery"
import qs from "qs"

interface UsePaginatedQueryOptions<
  T,
  TSelect = PaginatedResult<T>,
> extends PaginatedFilterProps {
  url: string
  queryKeyBase: string
  enabled?: boolean
  select?: (data: PaginatedResult<T>) => TSelect
}

export function usePaginatedQuery<T>({
  url,
  queryKeyBase,
  page = 1,
  limit = 10,
  search,
  ordering,
  start_date,
  end_date,
  filter = {},
  enabled = true,
  select,
}: UsePaginatedQueryOptions<T>) {
  const serializedFilter = qs.stringify(filter, {
    sort: (a, b) => a.localeCompare(b),
  })

  return useApiQuery<PaginatedResult<T>>({
    queryKey: [
      queryKeyBase,
      page,
      limit,
      search || "",
      ordering || "",
      start_date || "",
      end_date || "",
      serializedFilter,
    ],
    url,
    params: {
      page,
      limit,
      search: search || undefined,
      ordering: ordering || undefined,
      start_date: start_date || undefined,
      end_date: end_date || undefined,
      ...filter,
    },
    options: {
      enabled,
      select,
    },
  })
}
