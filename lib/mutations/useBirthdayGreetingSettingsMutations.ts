import { useApiMutation } from "@/lib/hooks/useApiMutation"
import { SystemSettings } from "@/lib/queries/useSystemSettings"
import api from "@/lib/utils/api"

export type UpdateBirthdayGreetingSettingsPayload = Pick<
  SystemSettings,
  | "birthday_greeting_enabled"
  | "birthday_greeting_title"
  | "birthday_greeting_message"
  | "birthday_greeting_button_text"
  | "birthday_greeting_show_confetti"
  | "birthday_greeting_show_emojis"
  | "birthday_greeting_male_emojis"
  | "birthday_greeting_female_emojis"
  | "birthday_greeting_variant"
>

export function useBirthdayGreetingSettingsMutations() {
  const updateSettings = useApiMutation({
    mutationFn: (data: UpdateBirthdayGreetingSettingsPayload) =>
      api.patch("/users/settings/", data),
    successMessage: "Birthday greeting settings updated successfully.",
    invalidateQueries: [{ queryKey: ["system-settings"] }],
  })

  return { updateSettings }
}
