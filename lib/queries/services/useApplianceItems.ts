"use client"

import api from "@/lib/utils/api"
import { useQuery } from "@tanstack/react-query"

interface ApplianceItemUsed {
  id: number
  appliance: number
  item: number
  item_name: string
  item_sku: string
  item_price: string
  quantity: number
  is_free: boolean
  free_quantity: number
  promo_name?: string
  charged_quantity: number
  line_total: string
}

export function useApplianceItems(applianceId?: number) {
  return useQuery({
    queryKey: ["appliance-items", applianceId],
    queryFn: async () => {
      const params = new URLSearchParams()
      if (applianceId) params.append("appliance", applianceId.toString())

      const response = await api.get(
        `services/appliance-items/?${params.toString()}`,
      )
      // Handle paginated response (has results property) or direct array
      const data = response.data
      return (
        Array.isArray(data) ? data : data?.results || []
      ) as ApplianceItemUsed[]
    },
    enabled: !!applianceId,
  })
}
