import { usePathname, useRouter } from 'next/navigation'
import { useCallback } from 'react'

export const useNavigation = () => {
  const router = useRouter()
  const pathname = usePathname()

  const push = useCallback(
    ({
      page,
      limit,
      search,
      ordering,
    }: {
      page?: string | number
      limit?: string | number
      search?: string
      ordering?: string
    }) => {
      if (typeof window === 'undefined') return

      const params = new URLSearchParams()

      if (page) params.set('page', String(page))
      if (limit) params.set('limit', String(limit))
      if (search) params.set('search', search)
      if (ordering) params.set('ordering', ordering)

      router.push(`${pathname}?${params.toString()}`)
    },
    [pathname, router],
  )

  return { pathname, push }
}
