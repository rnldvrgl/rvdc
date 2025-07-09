'use client'

import { useApiMutation } from '@/lib/hooks/useApiMutation'
import api from '@/lib/utils/api'

export function useNotificationMutations() {
  const markAsRead = useApiMutation({
    mutationFn: (id: number) => api.post(`/notifications/${id}/mark_as_read/`),
    successMessage: 'Notification marked as read.',
    invalidateQueries: [
      { queryKey: ['notifications'] },
      { queryKey: ['unread-notification-count'] },
    ],
  })

  const markAllAsRead = useApiMutation({
    mutationFn: () => api.post('/notifications/mark_all_as_read/'),
    successMessage: 'All notifications marked as read.',
    invalidateQueries: [
      { queryKey: ['notifications'] },
      { queryKey: ['unread-notification-count'] },
    ],
  })

  const deleteNotification = useApiMutation({
    mutationFn: (id: number) => api.delete(`/notifications/${id}/`),
    successMessage: 'Notification deleted successfully.',
    invalidateQueries: [
      { queryKey: ['notifications'] },
      { queryKey: ['unread-notification-count'] },
    ],
  })

  return {
    markAsRead,
    markAllAsRead,
    deleteNotification,
  }
}
