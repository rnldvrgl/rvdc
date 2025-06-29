import { User } from '@/lib/constants/interface'
import { create } from 'zustand'

interface UserStore {
  user: User | null
  setUser: (userData: User) => void
  clearUser: () => void
  isLoggedIn: () => boolean
}

const useUserStore = create<UserStore>((set, get) => ({
  user: null,

  setUser: (userData) => set({ user: userData }),

  clearUser: () => set({ user: null }),

  isLoggedIn: () => !!get().user,
}))

export default useUserStore
