"use client"

import { useApiMutation } from "@/lib/hooks/useApiMutation"
import api from "@/lib/utils/api"

export function useNotificationMutations() {
  const notificationInvalidations = [
    { queryKey: ["notifications"] },
    { queryKey: ["unread-notification-count"] },
  ]

  const markAsRead = useApiMutation({
    mutationFn: (id: number) => api.post(`/notifications/${id}/mark-read/`),
    successMessage: "Notification marked as read.",
    invalidateQueries: notificationInvalidations,
  })

  const markAllAsRead = useApiMutation({
    mutationFn: () => api.post("/notifications/mark-all-read/"),
    successMessage: "All notifications marked as read.",
    invalidateQueries: notificationInvalidations,
  })

  const deleteNotification = useApiMutation({
    mutationFn: (id: number) => api.delete(`/notifications/${id}/`),
    successMessage: "Notification deleted successfully.",
    invalidateQueries: notificationInvalidations,
  })

  return {
    markAsRead,
    markAllAsRead,
    deleteNotification,
  }
}
