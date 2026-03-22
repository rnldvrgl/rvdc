"use client"

import { useApiMutation } from "@/lib/hooks/useApiMutation"
import api from "@/lib/utils/api"

export function useMessagingMutations() {
  const messagingInvalidations = [
    { queryKey: ["conversations"] },
  ]

  const sendMessage = useApiMutation<
    { conversationId: number; text: string },
    unknown
  >({
    mutationFn: ({ conversationId, text }) =>
      api.post(`/messaging/conversations/${conversationId}/send/`, { text }),
    invalidateQueries: messagingInvalidations,
  })

  const linkClient = useApiMutation<
    { conversationId: number; clientId: number | null },
    unknown
  >({
    mutationFn: ({ conversationId, clientId }) =>
      api.post(`/messaging/conversations/${conversationId}/link-client/`, {
        client_id: clientId,
      }),
    successMessage: "Client linked successfully.",
    invalidateQueries: messagingInvalidations,
  })

  const markRead = useApiMutation<number, unknown>({
    mutationFn: (conversationId) =>
      api.post(`/messaging/conversations/${conversationId}/mark-read/`),
    invalidateQueries: messagingInvalidations,
  })

  return { sendMessage, linkClient, markRead }
}
