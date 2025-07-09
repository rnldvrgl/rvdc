import { CursorPaginatedResponse } from '@/lib/constants/types'
import api from '@/lib/utils/api'
import { useInfiniteQuery } from '@tanstack/react-query'

function extractCursorFromUrl(url: string | null): string | null {
  if (!url) return null
  const u = new URL(url)
  return u.searchParams.get('cursor')
}

export function useFlattenedCursorInfiniteQuery<T>(
  queryKey: any[],
  url: string,
  params: Record<string, any> = {},
) {
  const query = useInfiniteQuery<CursorPaginatedResponse<T>, Error>({
    queryKey,
    queryFn: async ({ pageParam = null }) => {
      const res = await api.get<CursorPaginatedResponse<T>>(url, {
        params: { ...params, cursor: pageParam },
      })
      return res.data
    },
    getNextPageParam: (lastPage) => extractCursorFromUrl(lastPage.next),
    initialPageParam: null,
  })

  const items = query.data?.pages.flatMap((page) => page.results) ?? []

  return {
    ...query,
    items,
  }
}
