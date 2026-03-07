/**
 * Custom Calendar Events API
 *
 * Hooks for managing custom calendar events in the analytics calendar.
 */

import { PaginatedFilterProps } from "@/lib/constants/types"
import { useApiMutation } from "@/lib/hooks/useApiMutation"
import { useApiQuery } from "@/lib/hooks/useApiQuery"
import { usePaginatedQuery } from "@/lib/hooks/usePaginatedQuery"
import api from "@/lib/utils/api"
import { useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"

export interface CustomCalendarEvent {
  id: number
  title: string
  description?: string
  event_date: string
  event_type: "birthday" | "meeting" | "maintenance" | "training" | "deadline" | "other"
  event_type_display: string
  created_by: number
  created_by_name: string
  created_at: string
  updated_at: string
}

export interface CustomCalendarEventCreate {
  title: string
  description?: string
  event_date: string
  event_type: "birthday" | "meeting" | "maintenance" | "training" | "deadline" | "other"
}

/**
 * Fetch all custom calendar events
 */
export const useCustomCalendarEvents = (props: PaginatedFilterProps = {}) => {
  return usePaginatedQuery<CustomCalendarEvent>({
    ...props,
    queryKeyBase: "custom-calendar-events",
    url: "/analytics/calendar-events/",
  })
}

/**
 * Fetch a single custom calendar event
 */
export const useCustomCalendarEvent = (id: number) => {
  return useApiQuery<CustomCalendarEvent>({
    queryKey: ["custom-calendar-event", id],
    url: `/analytics/calendar-events/${id}/`,
    enabled: !!id,
  })
}

/**
 * Create a custom calendar event
 */
export const useCreateCustomCalendarEvent = () => {
  const queryClient = useQueryClient()

  return useApiMutation({
    mutationFn: async (data: CustomCalendarEventCreate) => {
      const response = await api.post("/analytics/calendar-events/", data)
      return response.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["custom-calendar-events"] })
      queryClient.invalidateQueries({ queryKey: ["calendar-events"] })
      toast.success("Event created successfully")
    },
  })
}

/**
 * Update a custom calendar event
 */
export const useUpdateCustomCalendarEvent = () => {
  const queryClient = useQueryClient()

  return useApiMutation({
    mutationFn: async ({
      id,
      data,
    }: {
      id: number
      data: Partial<CustomCalendarEventCreate>
    }) => {
      const response = await api.patch(
        `/analytics/calendar-events/${id}/`,
        data,
      )
      return response.data
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["custom-calendar-events"] })
      queryClient.invalidateQueries({
        queryKey: ["custom-calendar-event", variables.id],
      })
      queryClient.invalidateQueries({ queryKey: ["calendar-events"] })
      toast.success("Event updated successfully")
    },
  })
}

/**
 * Delete a custom calendar event
 */
export const useDeleteCustomCalendarEvent = () => {
  const queryClient = useQueryClient()

  return useApiMutation({
    mutationFn: async (id: number) => {
      await api.delete(`/analytics/calendar-events/${id}/`)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["custom-calendar-events"] })
      queryClient.invalidateQueries({
        queryKey: ["custom-calendar-events-archived"],
      })
      queryClient.invalidateQueries({ queryKey: ["calendar-events"] })
      toast.success("Event archived successfully")
    },
  })
}
