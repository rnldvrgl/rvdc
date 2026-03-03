import { Notification } from "@/lib/constants/interface"
import { useApiQuery } from "@/lib/hooks/useApiQuery"
import { useFlattenedCursorInfiniteQuery } from "@/lib/hooks/useCursorInfiniteQuery"

const url = "/notifications/"

export const useNotifications = () =>
  useFlattenedCursorInfiniteQuery<Notification>(["notifications"], url, {})
export const useUnreadNotificationCount = () => {
  return useApiQuery<{ unread_count: number }>({
    queryKey: ["unread-notification-count"],
    url: `${url}unread-count/`,
    staleTime: 30 * 1000, // 30 seconds — notifications don't need to be real-time
    refetchInterval: 60 * 1000, // poll every 60 seconds for new notifications
    options: {
      refetchOnWindowFocus: true,
    },
  })
}
