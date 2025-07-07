'use client'

import { useSearchParams } from 'next/navigation'

interface SearchParameters {
  page: number
  limit: number
  search?: string
  ordering?: string
  filter: Record<string, string>
}

const ALLOWED_LIMITS = [10, 20, 30, 40, 50]

const useSearchParameters = (): SearchParameters => {
  const searchParams = useSearchParams()

  const getStringParam = (key: string): string | undefined => {
    const value = searchParams.get(key)
    return value && value.trim() !== '' ? value : undefined
  }

  const getIntParam = (key: string, defaultValue: number): number => {
    const raw = searchParams.get(key)
    const value = parseInt(raw || '', 10)
    return isNaN(value) || value < 1 ? defaultValue : value
  }

  const page = getIntParam('page', 1)
  const limitCandidate = getIntParam('limit', 10)
  const limit = ALLOWED_LIMITS.includes(limitCandidate) ? limitCandidate : 10
  const search = getStringParam('search')
  const ordering = getStringParam('ordering')?.toLowerCase()

  // Build dynamic filter: exclude known parameters
  const filter: Record<string, string> = {}
  searchParams.forEach((value, key) => {
    if (!['page', 'limit', 'search', 'ordering'].includes(key)) {
      filter[key] = value
    }
  })

  return {
    page,
    limit,
    search,
    ordering,
    filter,
  }
}

export default useSearchParameters
