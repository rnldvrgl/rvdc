'use client'

import { useSearchParams } from 'next/navigation'

interface SearchParameters {
  page: number
  limit: number
  search?: string
  ordering?: string
}

const useSearchParameters = (): SearchParameters => {
  const searchParams = useSearchParams()

  const getStringParam = (key: string): string | undefined => {
    const value = searchParams.get(key)
    return value && value.trim() !== '' ? value : undefined
  }

  const getIntParam = (key: string, defaultValue: number): number => {
    const value = parseInt(searchParams.get(key) || '', 10)
    return isNaN(value) || value < 1 ? defaultValue : value
  }

  const page = getIntParam('page', 1)
  const limitCandidate = getIntParam('limit', 10)
  const limit = [10, 20, 30, 40, 50].includes(limitCandidate)
    ? limitCandidate
    : 10

  return {
    page,
    limit,
    search: getStringParam('search'),
    ordering: getStringParam('ordering'),
  }
}

export default useSearchParameters
