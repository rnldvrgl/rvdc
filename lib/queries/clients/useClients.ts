import type { Client, PaginatedFilterProps } from "@/lib/constants/types"
import { useApiQuery } from "@/lib/hooks/useApiQuery"
import { useFilters } from "@/lib/hooks/useFilters"
import { usePaginatedQuery } from "@/lib/hooks/usePaginatedQuery"

const url = "/clients/"

export function useClients(props: PaginatedFilterProps) {
  return usePaginatedQuery<Client>({
    ...props,
    url,
    queryKeyBase: "clients",
  })
}

export function useClient(id: number | string | undefined) {
  return useApiQuery<Client>({
    queryKey: ["client", id],
    url: `${url}${id}/`,
    options: {
      enabled: !!id,
    },
  })
}

export function useClientFilters() {
  return useFilters("client-filters", `${url}filters/`)
}
