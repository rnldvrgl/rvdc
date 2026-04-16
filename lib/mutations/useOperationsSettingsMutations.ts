import { useApiMutation } from "@/lib/hooks/useApiMutation"
import api from "@/lib/utils/api"

export interface UpdateOperationsSettingsPayload {
  maintenance_mode?: boolean
  check_stock_on_sale?: boolean
  notification_sound?: string
}

export function useOperationsSettingsMutations() {
  const updateOperationsSettings = useApiMutation({
    mutationFn: (data: UpdateOperationsSettingsPayload) =>
      api.patch("/users/settings/", data),
    successMessage: "Settings updated.",
    invalidateQueries: [{ queryKey: ["system-settings"] }],
  })

  return { updateOperationsSettings }
}
