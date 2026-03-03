"use client"

import { PaginatedFilterProps } from "@/lib/constants/types"
import { useApiMutation } from "@/lib/hooks/useApiMutation"
import { usePaginatedQuery } from "@/lib/hooks/usePaginatedQuery"
import api from "@/lib/utils/api"

/**
 * Reusable hook for archive (soft-delete) operations.
 *
 * Provides:
 *  - `archivedQuery`  – paginated query for archived (soft-deleted) records
 *  - `restoreItem`    – mutation to restore an archived record
 *  - `hardDeleteItem` – mutation to permanently delete an archived record
 *
 * The normal "delete" action on the page already soft-deletes via the backend
 * SoftDeleteViewSetMixin, so no change is needed for the delete flow.
 *
 * @param baseUrl       API base URL, e.g. "/clients/"
 * @param queryKeyBase  React Query cache key base, e.g. "clients"
 * @param paginationProps  Standard pagination / filter / search params
 * @param enabled       Whether the archived query should run (only when archive tab is active)
 */
export function useArchive<T>(
  baseUrl: string,
  queryKeyBase: string,
  paginationProps: PaginatedFilterProps,
  enabled = false,
) {
  const archivedQuery = usePaginatedQuery<T>({
    ...paginationProps,
    url: `${baseUrl}archived/`,
    queryKeyBase: `${queryKeyBase}-archived`,
    enabled,
  })

  const restoreItem = useApiMutation({
    mutationFn: (id: number) => api.post(`${baseUrl}${id}/restore/`),
    successMessage: "Record restored successfully.",
    invalidateQueries: [
      { queryKey: [queryKeyBase] },
      { queryKey: [`${queryKeyBase}-archived`] },
    ],
  })

  const hardDeleteItem = useApiMutation({
    mutationFn: (id: number) => api.delete(`${baseUrl}${id}/hard-delete/`),
    successMessage: "Record permanently deleted.",
    invalidateQueries: [
      { queryKey: [queryKeyBase] },
      { queryKey: [`${queryKeyBase}-archived`] },
    ],
  })

  return { archivedQuery, restoreItem, hardDeleteItem }
}
