import api from '@/lib/utils/api'
import {
  useQuery,
  UseQueryOptions,
  UseQueryResult,
} from '@tanstack/react-query'

export function useApiQuery<T>({
  queryKey,
  url,
  params,
  options,
  staleTime,
}: {
  queryKey: readonly unknown[]
  url: string
  params?: Record<string, unknown>
  options?: Partial<UseQueryOptions<T, Error, T, readonly unknown[]>>
  staleTime?: number
}): UseQueryResult<T> {
  return useQuery<T, Error, T>({
    queryKey,
    queryFn: async (): Promise<T> => {
      const res = await api.get<T>(url, { params })
      return res.data
    },
    staleTime: staleTime || 1000 * 60 * 5,
    ...options,
  })
}
