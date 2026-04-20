import { useApiMutation } from "@/lib/hooks/useApiMutation"
import api from "@/lib/utils/api"

export interface UpdateOperationsSettingsPayload {
  maintenance_mode?: boolean
  check_stock_on_sale?: boolean
  notification_sound?: string
  remove_notification_sound?: boolean
  google_sheets_sync_enabled?: boolean
  google_sheets_spreadsheet_id?: string
  google_sheets_main_spreadsheet_id?: string
  google_sheets_worksheet_name?: string
  google_sheets_sub_stall_type?: string
  google_service_account_json?: string
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
