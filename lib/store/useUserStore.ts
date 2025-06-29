import { User } from '@/lib/constants/interface'
import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface UserStore {
  user: User | null
  setUser: (userData: User) => void
  clearUser: () => void
  isLoggedIn: () => boolean
}

const useUserStore = create<UserStore>()(
  persist(
    (set, get) => ({
      user: null,
      setUser: (userData) => set({ user: userData }),
      clearUser: () => set({ user: null }),
      isLoggedIn: () => !!get().user,
    }),
    {
      name: 'user-storage',
    },
  ),
)

export default useUserStore
