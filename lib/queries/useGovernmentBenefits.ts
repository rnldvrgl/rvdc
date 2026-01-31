import type {
  PaginatedFilterProps,
  PaginatedResult,
} from "@/lib/constants/types"
import { useApiQuery } from "@/lib/hooks/useApiQuery"
import { useFilters } from "@/lib/hooks/useFilters"
import { GovernmentBenefit } from "@/lib/schemas/governmentBenefitSchema"

const url = "/payroll/government-benefits/"

/**
 * Single government benefit
 */
export function useGovernmentBenefit(id: number) {
  return useApiQuery<GovernmentBenefit>({
    queryKey: ["government-benefit", id],
    url: `${url}${id}/`,
    enabled: !!id,
  })
}

/**
 * Government benefits list (Expense-style)
 */
export function useGovernmentBenefits({
  page = 1,
  limit = 10,
  search,
  ordering,
  filter = {},
}: PaginatedFilterProps & {
  filter?: {
    benefit_type?: string
    is_active?: boolean
    as_of_date?: string
  }
}) {
  return useApiQuery<PaginatedResult<GovernmentBenefit>>({
    queryKey: ["government-benefits", page, limit, search, ordering, filter],
    url,
    params: {
      page,
      limit,
      search: search || undefined,
      ordering: ordering || undefined,
      ...filter,
    },
  })
}

/**
 * Filters metadata (same pattern as expenses)
 */
export function useGovernmentBenefitFilters() {
  return useFilters("government-benefit-filters", `${url}filters/`)
}
