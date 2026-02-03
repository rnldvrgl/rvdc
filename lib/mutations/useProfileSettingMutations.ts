"use client"

import { UserProfilePayload } from "@/lib/constants/types"
import { useApiMutation } from "@/lib/hooks/useApiMutation"
import api from "@/lib/utils/api"

export function useProfileSettingMutations() {
  const url = "/users/profile/"

  const sharedInvalidations = [
    { queryKey: ["user-profile"] },
    { queryKey: ["current-user"] },
    { queryKey: ["calendar-events"] },
  ]

  const updateUserProfile = useApiMutation({
    mutationFn: (data: Partial<UserProfilePayload>) =>
      api.patch(url, data).then((res) => res.data),
    usePromiseToast: true,
    loadingMessage: "Updating profile...",
    successMessage: "Profile updated successfully.",
    invalidateQueries: sharedInvalidations,
  })

  return {
    updateUserProfile,
  }
}
