import { create } from "zustand"
import { createJSONStorage, persist } from "zustand/middleware"

export const DEFAULT_SOUND_VOLUME = 0.5 // 50% by default
export const DEFAULT_LANDING_PAGE = "/dashboard"
export const DEFAULT_SHOW_CHANGELOG_BANNER = true

type UserSettings = {
  soundVolume: number // 0–1
  landingPage: string
  showChangelogBanner: boolean
}

export interface SettingsStore {
  byUser: Record<number, Partial<UserSettings>>
  setSoundVolume: (userId: number, volume: number) => void
  getSoundVolume: (userId: number) => number
  setLandingPage: (userId: number, page: string) => void
  getLandingPage: (userId: number) => string
  setShowChangelogBanner: (userId: number, show: boolean) => void
  getShowChangelogBanner: (userId: number) => boolean
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

      setLandingPage: (userId, page) =>
        set((state) => ({
          byUser: {
            ...state.byUser,
            [userId]: {
              ...(state.byUser[userId] ?? {}),
              landingPage: page,
            },
          },
        })),
      getLandingPage: (userId) =>
        get().byUser[userId]?.landingPage ?? DEFAULT_LANDING_PAGE,

      setShowChangelogBanner: (userId, show) =>
        set((state) => ({
          byUser: {
            ...state.byUser,
            [userId]: {
              ...(state.byUser[userId] ?? {}),
              showChangelogBanner: show,
            },
          },
        })),
      getShowChangelogBanner: (userId) =>
        get().byUser[userId]?.showChangelogBanner ?? DEFAULT_SHOW_CHANGELOG_BANNER,
    }),
    {
      name: "user-settings-storage",
      storage: createJSONStorage(() => localStorage),
    },
  ),
)

export default useSettingsStore
