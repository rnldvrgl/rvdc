"use client"

import { ServiceExtraCharge } from "@/lib/constants/interface"
import api from "@/lib/utils/api"
import { useQuery } from "@tanstack/react-query"

export function useServiceExtraCharges(serviceId?: number) {
  return useQuery({
    queryKey: ["service-extra-charges", serviceId],
    queryFn: async () => {
      const params = new URLSearchParams()
      if (serviceId) params.append("service", serviceId.toString())
      const response = await api.get(
        `services/service-extra-charges/?${params.toString()}`,
      )
      const data = response.data
      return (
        Array.isArray(data) ? data : data?.results || []
      ) as ServiceExtraCharge[]
    },
    enabled: !!serviceId,
  })
}
