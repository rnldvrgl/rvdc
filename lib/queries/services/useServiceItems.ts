"use client"

import { ServiceItemUsed } from "@/lib/constants/interface"
import api from "@/lib/utils/api"
import { useQuery } from "@tanstack/react-query"

export function useServiceItems(serviceId?: number) {
  return useQuery({
    queryKey: ["service-items", serviceId],
    queryFn: async () => {
      const params = new URLSearchParams()
      if (serviceId) params.append("service", serviceId.toString())

      const response = await api.get(
        `services/service-items/?${params.toString()}`,
      )
      const data = response.data
      return (
        Array.isArray(data) ? data : data?.results || []
      ) as ServiceItemUsed[]
    },
    enabled: !!serviceId,
  })
}
