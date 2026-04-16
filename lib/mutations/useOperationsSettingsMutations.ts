import { useApiMutation } from "@/lib/hooks/useApiMutation"
import api from "@/lib/utils/api"

export interface UpdateOperationsSettingsPayload {
  maintenance_mode?: boolean
  check_stock_on_sale?: boolean
  notification_sound?: string
  remove_notification_sound?: boolean
}

export function useOperationsSettingsMutations() {
  const updateOperationsSettings = useApiMutation({
    mutationFn: (data: UpdateOperationsSettingsPayload | FormData) => {
      if (data instanceof FormData) {
        return api.patch("/users/settings/", data, {
          headers: { "Content-Type": "multipart/form-data" },
        })
      }
      return api.patch("/users/settings/", data)
    },
    successMessage: "Settings updated.",
    invalidateQueries: [{ queryKey: ["system-settings"] }],
  })

  return { updateOperationsSettings }
}
