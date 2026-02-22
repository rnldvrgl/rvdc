import { CashAdvanceMovement } from "@/lib/constants/interface"
import api from "@/lib/utils/api"
import { useQuery } from "@tanstack/react-query"

interface CashAdvanceMovementsResponse {
  count: number
  next: string | null
  previous: string | null
  results: CashAdvanceMovement[]
}

interface UseCashAdvanceMovementsParams {
  employee?: number
  date?: string
  movement_type?: string
  page?: number
  ordering?: string
}

export const useCashAdvanceMovements = (
  params?: UseCashAdvanceMovementsParams,
) => {
  return useQuery<CashAdvanceMovementsResponse>({
    queryKey: ["cash-advance-movements", params],
    queryFn: async () => {
      const response = await api.get("/users/cash-advance-movements/", {
        params,
      })
      return response.data
    },
  })
}

export const useCashAdvanceMovement = (id: string | number) => {
  return useQuery<CashAdvanceMovement>({
    queryKey: ["cash-advance-movements", id],
    queryFn: async () => {
      const response = await api.get(`/users/cash-advance-movements/${id}/`)
      return response.data
    },
    enabled: !!id,
  })
}
