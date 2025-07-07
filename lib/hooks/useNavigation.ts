import { usePathname, useRouter } from 'next/navigation'
import { useCallback } from 'react'

type NavigateOptions = {
  page?: string | number
  limit?: string | number
  search?: string
  ordering?: string
  filter?: Record<string, string | number | boolean>
}

export const useNavigation = () => {
  const router = useRouter()
  const pathname = usePathname()

  const push = useCallback(
    ({ page, limit, search, ordering, filter = {} }: NavigateOptions) => {
      if (typeof window === 'undefined') return

      const params = new URLSearchParams()

      if (page) params.set('page', String(page))
      if (limit) params.set('limit', String(limit))
      if (search) params.set('search', search)
      if (ordering) params.set('ordering', ordering)

      // add any generic filters
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
