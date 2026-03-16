"use client"

import api from "@/lib/utils/api"
import { useQuery } from "@tanstack/react-query"

export interface DuplicateMatch {
  id: number
  name: string
  sku: string
  category: string | null
  category_id: number | null
  match_type: "exact_same_category" | "exact" | "contains" | "similar"
}

export function useCheckDuplicateItems({
  name,
  categoryId,
  excludeId,
  enabled = true,
}: {
  name: string
  categoryId?: string | null
  excludeId?: number
  enabled?: boolean
}) {
  const trimmed = name.trim()

  return useQuery<DuplicateMatch[]>({
    queryKey: ["item-duplicates", trimmed, categoryId, excludeId],
    queryFn: async () => {
      const params: Record<string, string> = { name: trimmed }
      if (categoryId) params.category_id = categoryId
      if (excludeId) params.exclude_id = String(excludeId)
      const res = await api.get<DuplicateMatch[]>(
        "/inventory/items/check-duplicates/",
        { params }
      )
      return res.data
    },
    enabled: enabled && trimmed.length >= 2,
    staleTime: 10_000, // cache for 10s to avoid spamming on every keystroke
  })
}
