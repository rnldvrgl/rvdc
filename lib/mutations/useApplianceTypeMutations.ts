import { useApiMutation } from "@/lib/hooks/useApiMutation"
import api from "@/lib/utils/api"

export function useApplianceTypeMutations() {
  const url = "services/appliance-types/"

  const commonInvalidations = [
    { queryKey: ["appliance-types"] },
    { queryKey: ["appliance-type-choices"] },
  ]

  const addApplianceType = useApiMutation({
    mutationFn: (data: { name: string }) => api.post(url, data),
    successMessage: "Appliance type created successfully",
    invalidateQueries: commonInvalidations,
  })

  const updateApplianceType = useApiMutation({
    mutationFn: ({ id, data }: { id: number; data: { name: string } }) =>
      api.patch(`${url}${id}/`, data),
    successMessage: "Appliance type updated successfully",
    invalidateQueries: commonInvalidations,
  })

  const deleteApplianceType = useApiMutation({
    mutationFn: (id: number) => api.delete(`${url}${id}/`),
    successMessage: "Appliance type deleted successfully",
    invalidateQueries: commonInvalidations,
  })

  return {
    addApplianceType,
    updateApplianceType,
    deleteApplianceType,
  }
}
