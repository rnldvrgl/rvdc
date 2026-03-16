import { CustomItemTemplate } from "@/lib/constants/interface"
import type { PaginatedFilterProps } from "@/lib/constants/types"
import { useApiQuery } from "@/lib/hooks/useApiQuery"
import { usePaginatedQuery } from "@/lib/hooks/usePaginatedQuery"

const url = "/inventory/custom-item-templates/"

export function useCustomItemTemplates(props: PaginatedFilterProps = {}) {
  return usePaginatedQuery<CustomItemTemplate>({
    ...props,
    url,
    queryKeyBase: "custom-item-templates",
  })
}

export function useCustomItemTemplateChoices() {
  return useApiQuery<CustomItemTemplate[]>({
    queryKey: ["custom-item-template-choices"],
    url,
    params: { is_active: true, limit: 200 },
    options: {
      select: (data: unknown) => {
        if (data && typeof data === "object" && "results" in data) {
          return (data as { results: CustomItemTemplate[] }).results
        }
        return data as CustomItemTemplate[]
      },
    },
  })
}
