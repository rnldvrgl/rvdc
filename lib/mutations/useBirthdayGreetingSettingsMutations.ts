import { useApiMutation } from "@/lib/hooks/useApiMutation"
import { SystemSettings } from "@/lib/queries/useSystemSettings"
import api from "@/lib/utils/api"

export type UpdateBirthdayGreetingSettingsPayload = Omit<
  SystemSettings,
  "id" | "updated_at"
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
