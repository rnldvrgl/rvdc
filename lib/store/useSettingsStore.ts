import { create } from "zustand"
import { createJSONStorage, persist } from "zustand/middleware"

export const DEFAULT_SOUND_VOLUME = 0.5 // 50% by default

type UserSettings = {
  soundVolume: number // 0–1
}

interface SettingsStore {
  byUser: Record<number, UserSettings>
  setSoundVolume: (userId: number, volume: number) => void
  getSoundVolume: (userId: number) => number
}

const useSettingsStore = create<SettingsStore>()(
  persist(
    (set, get) => ({
      byUser: {},
      setSoundVolume: (userId, volume) =>
        set((state) => ({
          byUser: {
            ...state.byUser,
            [userId]: {
              ...(state.byUser[userId] ?? {}),
              soundVolume: Math.max(0, Math.min(1, volume)),
            },
          },
        })),
      getSoundVolume: (userId) =>
        get().byUser[userId]?.soundVolume ?? DEFAULT_SOUND_VOLUME,
    }),
    {
      name: "user-settings-storage",
      storage: createJSONStorage(() => localStorage),
    },
  ),
)

export default useSettingsStore
