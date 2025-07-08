import { CursorPaginatedResponse } from '@/lib/constants/types'
import api from '@/lib/utils/api'
import { useInfiniteQuery, UseInfiniteQueryResult } from '@tanstack/react-query'

export function useCursorInfiniteQuery<T>(
  queryKey: any[],
  url: string,
  params: Record<string, any> = {},
): UseInfiniteQueryResult<CursorPaginatedResponse<T>, Error> {
  return useInfiniteQuery<
    CursorPaginatedResponse<T>, // TQueryFnData
    Error, // TError
    CursorPaginatedResponse<T>, // TData (transformed data, defaults to same)
    CursorPaginatedResponse<T>, // TQueryData (for initialData caching, etc)
    string | null // TPageParam
  >({
    queryKey,
    queryFn: async ({ pageParam = null }) => {
      const res = await api.get<CursorPaginatedResponse<T>>(url, {
        params: { ...params, cursor: pageParam },
      })
      return res.data
    },
    getNextPageParam: (lastPage) => lastPage.next,
    initialPageParam: null,
  })
}
