import { useApiQuery } from "@/lib/hooks/useApiQuery"

export interface PendingApplianceInfo {
  id: number
  name: string
  parts_needed_notes: string
  items_count: number
}

export interface PendingServiceInfo {
  service_id: number
  client_name: string
  service_type: string
  status: string
  created_at: string
  total_appliances: number
  unchecked_appliances: number
  has_service_level_pending: boolean
  appliances: PendingApplianceInfo[]
}

export interface PendingItemsStats {
  total_pending_services: number
  total_unchecked_appliances: number
  total_service_level_pending: number
  total_pending_items: number
  services: PendingServiceInfo[]
}

export function usePendingItemsStats(enabled = true) {
  return useApiQuery<PendingItemsStats>({
    queryKey: ["pending-items-stats"],
    url: "/services/services/pending-items-stats/",
    enabled,
    staleTime: 1000 * 60 * 2, // 2 minutes
  })
}
