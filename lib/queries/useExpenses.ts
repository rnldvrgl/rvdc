import { Expense } from '@/lib/constants/interface'
import type {
  PaginatedFilterProps,
  PaginatedResult,
} from '@/lib/constants/types'
import { useApiQuery } from '@/lib/hooks/useApiQuery'

const url = '/expenses/'

export function useExpense(id: string) {
  return useApiQuery<Expense>(['expense', id], `${url}${id}/`, undefined)
}

export function useExpenses({
  page = 1,
  limit = 10,
  search,
  ordering,
}: PaginatedFilterProps) {
  return useApiQuery<PaginatedResult<Expense>>(
    ['expenses', page, limit, search, ordering],
    url,
    {
      page,
      limit,
      search: search || undefined,
      ordering: ordering || undefined,
    },
  )
}
