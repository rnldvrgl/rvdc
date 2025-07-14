import { Expense } from '@/lib/constants/interface'
import type {
  PaginatedFilterProps,
  PaginatedResult,
} from '@/lib/constants/types'
import { useApiQuery } from '@/lib/hooks/useApiQuery'

const url = '/expenses/'

export function useExpense(id: string) {
  return useApiQuery<Expense>({
    queryKey: ['expense', id],
    url: `${url}${id}/`,
  })
}

export function useExpenses({
  page = 1,
  limit = 10,
  search,
  ordering,
}: PaginatedFilterProps) {
  return useApiQuery<PaginatedResult<Expense>>({
    queryKey: ['expenses', page, limit, search, ordering],
    url,
    params: {
      page,
      limit,
      search: search || undefined,
      ordering: ordering || undefined,
    },
  })
}
