import { User } from '@/lib/constants/interface'
import { create } from 'zustand'
import { createJSONStorage, persist } from 'zustand/middleware'

interface UserProfileStore {
  userProfile: User | null
  setUserProfile: (userData: User) => void
  resetUserProfile: () => void
  clearUserProfile: () => void
}

const useUserProfileStore = create<UserProfileStore>()(
  persist(
    (set) => ({
      userProfile: null,
      setUserProfile: (userData) => set({ userProfile: userData }),
      resetUserProfile: () => set({ userProfile: null }),
      clearUserProfile: () => set({ userProfile: null }),
    }),
    {
      name: 'user-profile-storage', // localStorage key
      storage: createJSONStorage(() => localStorage),
    },
  ),
)

export default useUserProfileStore
