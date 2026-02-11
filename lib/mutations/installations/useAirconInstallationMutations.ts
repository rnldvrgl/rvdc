"use client"

import {
  AirconInstallationCreatePayload,
  AirconInstallationCreateResponse,
} from "@/lib/constants/interface"
import { useApiMutation } from "@/lib/hooks/useApiMutation"
import api from "@/lib/utils/api"

export function useAirconInstallationMutations() {
  const baseUrl = "/installations/aircon-units/"

  /**
   * Create an installation service for an aircon unit.
   * This can optionally sell the unit first if it hasn't been sold yet.
   */
  const createInstallation = useApiMutation<
    AirconInstallationCreatePayload,
    AirconInstallationCreateResponse
  >({
    mutationFn: (data: AirconInstallationCreatePayload) =>
      api.post(`${baseUrl}${data.unit_id}/create-installation/`, data),
    successMessage: "Installation service created successfully.",
    invalidateQueries: [
      { queryKey: ["aircon-units"] },
      { queryKey: ["services"] },
      { queryKey: ["service-appliances"] },
      { queryKey: ["sales-transactions"] },
    ],
  })

  return {
    createInstallation,
  }
}
