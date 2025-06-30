import { User } from '@/lib/constants/interface'
import { create } from 'zustand'

interface UserProfileStore {
  userProfile: User | null
  setUserProfile: (userData: User) => void
}

const useUserProfileStore = create<UserProfileStore>((set) => ({
  userProfile: null,
  setUserProfile: (userData) => set({ userProfile: userData }),
}))

export default useUserProfileStore
