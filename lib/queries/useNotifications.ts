import { STALE_TIME } from "@/lib/constants/general"
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
    staleTime: STALE_TIME.REAL_TIME,
    refetchInterval: 60 * 1000, // poll every 60 seconds for new notifications
    options: {
      refetchOnWindowFocus: true,
    },
  })
}
