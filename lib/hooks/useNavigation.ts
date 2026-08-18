import { usePathname, useRouter } from 'next/navigation'
import { useCallback } from 'react'

type NavigateOptions = {
  page?: string | number
  limit?: string | number
  search?: string
  ordering?: string
  start_date?: string
  end_date?: string
  cursor?: string
  filter?: Record<string, string | number | boolean | undefined>
}

export const useNavigation = () => {
  const router = useRouter()
  const pathname = usePathname()

  const push = useCallback(
    ({
      page,
      limit,
      search,
      ordering,
      start_date,
      end_date,
      cursor,
      filter = {},
    }: NavigateOptions) => {
      if (typeof window === 'undefined') return

      const params = new URLSearchParams()

      if (page) params.set('page', String(page))
      if (limit) params.set('limit', String(limit))
      if (search) params.set('search', search)
      if (ordering) params.set('ordering', ordering)
      if (start_date) params.set('start_date', start_date)
      if (end_date) params.set('end_date', end_date)
      if (cursor) params.set('cursor', cursor)

      Object.entries(filter).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          params.set(key, String(value))
        }
      })

      router.push(`${pathname}?${params.toString()}`)
    },
    [pathname, router],
  )

  return { pathname, push }
}
