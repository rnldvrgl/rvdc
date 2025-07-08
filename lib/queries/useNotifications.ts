import { Notification } from '@/lib/constants/interface'
import { useApiQuery } from '@/lib/hooks/useApiQuery'
import { useCursorInfiniteQuery } from '@/lib/hooks/useCursorInfiniteQuery'

const url = '/notifications/'

export const useNotifications = () =>
  useCursorInfiniteQuery<Notification>(['notifications'], url)

export const useUnreadNotificationCount = () => {
  return useApiQuery<{ unread_count: number }>(
    ['unread-notification-count'],
    `${url}count_unread/`,
  )
}
