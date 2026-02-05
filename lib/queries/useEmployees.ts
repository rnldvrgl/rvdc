import type { Employee, PaginatedFilterProps } from "@/lib/constants/types"
import { useApiQuery } from "@/lib/hooks/useApiQuery"
import { usePaginatedQuery } from "@/lib/hooks/usePaginatedQuery"

const url = "/users/employees/"

export function useEmployee(id: string) {
  return useApiQuery<Employee>({
    queryKey: ["employee", id],
    url: `${url}${id}/`,
    options: {
      enabled: !!id,
    },
  })
}

export function useEmployees(
  props: PaginatedFilterProps & { includeInPayroll?: boolean } = {},
) {
  return usePaginatedQuery<Employee>({
    ...props,
    url,
    queryKeyBase: "employees",
  })
}
