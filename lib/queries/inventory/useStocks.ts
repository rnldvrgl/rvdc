import { Stock } from '@/lib/constants/interface'
import type {
  PaginatedFilterProps,
  PaginatedResult,
} from '@/lib/constants/types'
import { useApiQuery } from '@/lib/hooks/useApiQuery'

const url = '/inventory/stalls/stocks/'

export function useStallStocks({
  page = 1,
  limit = 10,
  search,
  ordering,
}: PaginatedFilterProps = {}) {
  return useApiQuery<PaginatedResult<Stock>>(
    ['stall-stocks', page, limit, search, ordering],
    `${url}`,
    {
      page,
      limit,
      search: search || undefined,
      ordering: ordering || undefined,
    },
  )
}

export function useStockRoomStocks({
  page = 1,
  limit = 10,
  search,
  ordering,
}: PaginatedFilterProps = {}) {
  return useApiQuery<PaginatedResult<Stock>>(
    ['stockroom-stocks', page, limit, search, ordering],
    `${url}management/`,
    {
      page,
      limit,
      search: search || undefined,
      ordering: ordering || undefined,
    },
  )
}

export function useStockTransfers({
  page = 1,
  limit = 10,
  search,
  ordering,
}: PaginatedFilterProps = {}) {
  return useApiQuery<PaginatedResult<Stock>>(
    ['transfers', page, limit, search, ordering],
    `${url}transfers/`,
    {
      page,
      limit,
      search: search || undefined,
      ordering: ordering || undefined,
    },
  )
}
