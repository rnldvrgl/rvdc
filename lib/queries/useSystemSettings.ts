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
  updated_at: string
}

export function useSystemSettings() {
  return useApiQuery<SystemSettings>({
    queryKey: ["system-settings"],
    url: "/users/settings/",
    staleTime: 1000 * 60 * 60 * 24,
  })
}
