import { create } from "zustand"

interface ChatStore {
  openWithUserId: number | null
  openChat: (userId: number) => void
  clearOpenChat: () => void
}

const useChatStore = create<ChatStore>()((set) => ({
  openWithUserId: null,
  openChat: (userId) => set({ openWithUserId: userId }),
  clearOpenChat: () => set({ openWithUserId: null }),
}))

export default useChatStore
