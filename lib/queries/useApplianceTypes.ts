import { ApplianceType, PaginatedResponse } from "@/lib/constants/interface"
import { useApiQuery } from "@/lib/hooks/useApiQuery"

const url = "/services/appliance-types/"

interface UseApplianceTypesParams {
  page?: number
  limit?: number
  search?: string
  ordering?: string
}

export const useApplianceTypes = (params: UseApplianceTypesParams = {}) => {
  return useApiQuery<PaginatedResponse<ApplianceType>>({
    queryKey: ["appliance-types", params],
    url,
    params: {
      page: params.page,
      limit: params.limit,
      search: params.search,
      ordering: params.ordering,
    },
  })
}
