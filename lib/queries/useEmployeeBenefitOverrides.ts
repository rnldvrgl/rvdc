import { usePaginatedQuery } from "@/lib/hooks/usePaginatedQuery"
import type { EmployeeBenefitOverride } from "@/lib/schemas/employeeBenefitOverrideSchema"

interface UseEmployeeBenefitOverridesOptions {
  employee?: number
  benefit_type?: string
  is_active?: boolean
  enabled?: boolean
}

export function useEmployeeBenefitOverrides(
  options?: UseEmployeeBenefitOverridesOptions,
) {
  const params = new URLSearchParams()

  if (options?.employee) {
    params.append("employee", options.employee.toString())
  }
  if (options?.benefit_type) {
    params.append("benefit_type", options.benefit_type)
  }
  if (options?.is_active !== undefined) {
    params.append("is_active", options.is_active.toString())
  }

  const queryString = params.toString()

  return usePaginatedQuery<EmployeeBenefitOverride>({
    queryKeyBase: "employee-benefit-overrides",
    url: `/payroll/employee-benefit-overrides/${queryString ? `?${queryString}` : ""}`,
    enabled: options?.enabled ?? true, // Default to true if not specified
  })
}
