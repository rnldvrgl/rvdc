"use client"

import { ApplianceItemUsed } from "@/lib/constants/interface"
import api from "@/lib/utils/api"
import { useQuery } from "@tanstack/react-query"

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
