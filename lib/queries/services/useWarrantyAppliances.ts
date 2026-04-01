"use client"

import { ServiceAppliance } from "@/lib/constants/interface"
import { useApiQuery } from "@/lib/hooks/useApiQuery"

type AppliancePage = { results: ServiceAppliance[]; count: number }

export function useClientWarrantyAppliances(clientId?: number) {
  return useApiQuery<AppliancePage>({
    queryKey: ["client-warranty-appliances", clientId] as const,
    url: "services/service-appliances/",
    params: {
      client: clientId,
      warranty_active: "true",
      limit: 200,
    },
    enabled: !!clientId,
    options: {
      select: (data) =>
        ({
          results: Array.isArray(data) ? data : (data?.results ?? []),
          count: Array.isArray(data) ? data.length : (data?.count ?? 0),
        }) as AppliancePage,
    },
  })
}
