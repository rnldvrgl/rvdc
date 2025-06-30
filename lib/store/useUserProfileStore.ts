import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface UserProfileStore {
  userProfile: any | null
  setUserProfile: (userData: any) => void
}

const useUserProfileStore = create<UserProfileStore>()(
  persist(
    (set, _) => ({
      userProfile: null,
      setUserProfile: (userData) => set({ userProfile: userData }),
    }),
    {
      name: 'user-profile',
    },
  ),
)

export default useUserProfileStore
