import { CashAdvance } from "@/lib/constants/interface"
import api from "@/lib/utils/api"
import { useQuery } from "@tanstack/react-query"

interface CashAdvancesResponse {
  count: number
  next: string | null
  previous: string | null
  results: CashAdvance[]
}

interface UseCashAdvancesParams {
  employee?: number
  date?: string
  page?: number
  ordering?: string
}

export const useCashAdvances = (params?: UseCashAdvancesParams) => {
  return useQuery<CashAdvancesResponse>({
    queryKey: ["cash-advances", params],
    queryFn: async () => {
      const response = await api.get("/users/cash-advances/", { params })
      return response.data
    },
  })
}

export const useCashAdvance = (id: string | number) => {
  return useQuery<CashAdvance>({
    queryKey: ["cash-advances", id],
    queryFn: async () => {
      const response = await api.get(`/users/cash-advances/${id}/`)
      return response.data
    },
    enabled: !!id,
  })
}
