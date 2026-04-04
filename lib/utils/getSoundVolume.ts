import useSettingsStore, { DEFAULT_SOUND_VOLUME } from "@/lib/store/useSettingsStore"
import useUserProfileStore from "@/lib/store/useUserProfileStore"

/**
 * Returns the active user's preferred sound volume (0–1).
 * Safe to call outside React components (reads Zustand state directly).
 */
export function getSoundVolume(): number {
  try {
    const userId = useUserProfileStore.getState().userProfile?.id
    if (!userId) return DEFAULT_SOUND_VOLUME
    return useSettingsStore.getState().getSoundVolume(userId)
  } catch {
    return DEFAULT_SOUND_VOLUME
  }
}
