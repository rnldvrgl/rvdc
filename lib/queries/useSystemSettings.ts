import { STALE_TIME } from "@/lib/constants/general"
import { useApiQuery } from "@/lib/hooks/useApiQuery"

export interface SystemSettings {
  id: number
  birthday_greeting_enabled: boolean
  birthday_greeting_title: string
  birthday_greeting_message: string
  birthday_greeting_button_text: string
  birthday_greeting_show_confetti: boolean
  birthday_greeting_show_emojis: boolean
  birthday_greeting_male_emojis: string
  birthday_greeting_female_emojis: string
  birthday_greeting_variant: string
  maintenance_mode: boolean
  check_stock_on_sale: boolean
  sub_stall_unit_revenue_additional: string
  notification_sound: string
  google_sheets_sync_enabled: boolean
  google_sheets_spreadsheet_id: string
  google_sheets_main_spreadsheet_id: string
  google_sheets_worksheet_name: string
  google_sheets_sub_stall_type: string
  google_sheets_share_email: string
  google_service_account_configured: boolean
  updated_at: string
}

export function useSystemSettings() {
  return useApiQuery<SystemSettings>({
    queryKey: ["system-settings"],
    url: "/users/settings/",
    staleTime: STALE_TIME.STATIC,
  })
}
