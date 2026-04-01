"use client"

import { CompanyAsset, FilterDefinition, Service, SortOption } from "@/lib/constants/interface"
import { useApiQuery } from "@/lib/hooks/useApiQuery"
import { usePaginatedQuery } from "@/lib/hooks/usePaginatedQuery"
import type { PaginatedFilterProps } from "@/lib/constants/types"

export function useCompanyAssetFilters(): { filters: FilterDefinition[]; orderingOptions: SortOption[] } {
  return {
    filters: [
      {
        key: "acquisition_type",
        label: "Acquisition Type",
        options: [
          { label: "Unclaimed", value: "unclaimed" },
          { label: "Client Sold", value: "client_sold" },
        ],
      },
      {
        key: "status",
        label: "Status",
        options: [
          { label: "In Storage", value: "holding" },
          { label: "Sold", value: "sold" },
          { label: "Repurposed", value: "repurposed" },
          { label: "Disposed", value: "disposed" },
        ],
      },
    ],
    orderingOptions: [
      { label: "Acquired (Newest)", value: "-acquired_at" },
      { label: "Acquired (Oldest)", value: "acquired_at" },
      { label: "Appliance", value: "appliance_description" },
      { label: "Client", value: "client_name" },
    ],
  }
}

const url = "services/company-assets/"

export function useCompanyAssets(props: PaginatedFilterProps = {}) {
  return usePaginatedQuery<CompanyAsset>({
    ...props,
    url,
    queryKeyBase: "company-assets",
  })
}

/** Services that have been completed ≥60 days without being claimed — eligible for forfeiture. */
export function useUnclaimedEligibleServices() {
  return useApiQuery<Service[]>({
    queryKey: ["unclaimed-eligible"] as const,
    url: "services/services/unclaimed-eligible/",
    options: {
      select: (data) => (Array.isArray(data) ? data : []) as Service[],
    },
  })
}
