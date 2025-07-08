import { CursorPaginatedResponse } from '@/lib/constants/types'
import { UseInfiniteQueryResult } from '@tanstack/react-query'

export function useMergedCursorResults<T>(
  queryResult: UseInfiniteQueryResult<CursorPaginatedResponse<T>, Error>,
) {
  const mergedResults: T[] =
    queryResult.data?.pages.flatMap((page) => page.results ?? []) ?? []

  return {
    ...queryResult,
    mergedResults,
  }
}
