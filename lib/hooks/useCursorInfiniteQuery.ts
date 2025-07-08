import { CursorPaginatedResponse } from '@/lib/constants/types'
import api from '@/lib/utils/api'
import {
  useInfiniteQuery,
  UseInfiniteQueryOptions,
  UseInfiniteQueryResult,
} from '@tanstack/react-query'

export function useCursorInfiniteQuery<T>(
  queryKey: any[],
  url: string,
  params: Record<string, any> = {},
  options?: Omit<
    UseInfiniteQueryOptions<
      CursorPaginatedResponse<T>,
      Error,
      CursorPaginatedResponse<T>,
      CursorPaginatedResponse<T>[],
      string | null
    >,
    'queryKey' | 'queryFn' | 'getNextPageParam' | 'initialPageParam'
  >,
): UseInfiniteQueryResult<CursorPaginatedResponse<T>, Error> {
  return useInfiniteQuery({
    queryKey,
    queryFn: async ({ pageParam = null }) => {
      const res = await api.get<CursorPaginatedResponse<T>>(url, {
        params: { ...params, cursor: pageParam },
      })
      return res.data
    },
    getNextPageParam: (lastPage) => lastPage.next,
    initialPageParam: null,
    ...options,
  })
}
