import type { QueryKey } from "@tanstack/react-query"

export const bg = (key: QueryKey) => ({
  queryKey: key,
  refetchType: "inactive" as const,
})
