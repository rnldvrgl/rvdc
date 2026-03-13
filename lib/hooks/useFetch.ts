import { STALE_TIME } from "@/lib/constants/general"
import api from "@/lib/utils/api"
import { useQuery, UseQueryOptions } from "@tanstack/react-query"
import { AxiosRequestConfig } from "axios"

type UseFetchOptions<T> = AxiosRequestConfig & {
  queryOptions?: UseQueryOptions<T, Error>
}

export const useFetch = <T = unknown>(
  url: string,
  options?: UseFetchOptions<T>,
) => {
  const { queryOptions, ...axiosOptions } = options || {}

  const queryKey = [url, axiosOptions?.params]

  const query = useQuery<T, Error>({
    queryKey,
    queryFn: async () => {
      const response = await api.get<T>(url, axiosOptions)
      return response.data
    },
    staleTime: STALE_TIME.DEFAULT,
    ...queryOptions,
  })

  return {
    data: query.data,
    error: query.error?.message ?? null,
    isLoading: query.isLoading,
    isFetching: query.isFetching,
    refetch: query.refetch,
  }
}
