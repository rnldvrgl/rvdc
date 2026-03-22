import { STALE_TIME } from "@/lib/constants/general"
import { Conversation, ConversationDetail } from "@/lib/constants/types"
import { useApiQuery } from "@/lib/hooks/useApiQuery"

const url = "/messaging/conversations/"

export const useConversations = (search?: string) => {
  return useApiQuery<Conversation[]>({
    queryKey: ["conversations", search || ""],
    url,
    params: search ? { search } : undefined,
    staleTime: STALE_TIME.REAL_TIME,
    refetchInterval: 10 * 1000,
  })
}

export const useConversationDetail = (id: number | null) => {
  return useApiQuery<ConversationDetail>({
    queryKey: ["conversations", id],
    url: `${url}${id}/`,
    staleTime: STALE_TIME.REAL_TIME,
    refetchInterval: 5 * 1000,
    enabled: id !== null,
  })
}
