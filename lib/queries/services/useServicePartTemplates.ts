import { ServicePartTemplate } from "@/lib/constants/interface"
import { useApiQuery } from "@/lib/hooks/useApiQuery"

const url = "/services/service-part-templates/"

export function useServicePartTemplates() {
  return useApiQuery<ServicePartTemplate[]>({
    queryKey: ["service-part-templates"],
    url,
    params: { ordering: "name", limit: 200 },
    options: {
      select: (data: unknown) => {
        if (data && typeof data === "object" && "results" in data) {
          return (data as { results: ServicePartTemplate[] }).results
        }
        return data as ServicePartTemplate[]
      },
    },
  })
}
