/**
 * Half Day Schedules API
 *
 * Hooks for managing admin-designated half-day schedules.
 */

import { PaginatedFilterProps } from "@/lib/constants/types"
import { useApiMutation } from "@/lib/hooks/useApiMutation"
import { useApiQuery } from "@/lib/hooks/useApiQuery"
import { usePaginatedQuery } from "@/lib/hooks/usePaginatedQuery"
import api from "@/lib/utils/api"
import { useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"

export interface HalfDaySchedule {
  id: number
  date: string
  reason: string
  created_by: number
  created_by_name: string
  created_at: string
  updated_at: string
  is_deleted: boolean
}

export interface HalfDayScheduleCreate {
  date: string
  reason?: string
}

/**
 * Fetch all half-day schedules (paginated)
 */
export const useHalfDaySchedules = (props: PaginatedFilterProps = {}) => {
  return usePaginatedQuery<HalfDaySchedule>({
    ...props,
    queryKeyBase: "half-day-schedules",
    url: "/attendance/half-day-schedules/",
  })
}

/**
 * Fetch a single half-day schedule
 */
export const useHalfDaySchedule = (id: number) => {
  return useApiQuery<HalfDaySchedule>({
    queryKey: ["half-day-schedule", id],
    url: `/attendance/half-day-schedules/${id}/`,
    enabled: !!id,
  })
}

/**
 * Create a half-day schedule
 */
export const useCreateHalfDaySchedule = () => {
  const queryClient = useQueryClient()

  return useApiMutation({
    mutationFn: async (data: HalfDayScheduleCreate) => {
      const response = await api.post("/attendance/half-day-schedules/", data)
      return response.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["half-day-schedules"] })
      toast.success("Half-day schedule created successfully")
    },
  })
}

/**
 * Update a half-day schedule
 */
export const useUpdateHalfDaySchedule = () => {
  const queryClient = useQueryClient()

  return useApiMutation({
    mutationFn: async ({
      id,
      data,
    }: {
      id: number
      data: Partial<HalfDayScheduleCreate>
    }) => {
      const response = await api.patch(
        `/attendance/half-day-schedules/${id}/`,
        data,
      )
      return response.data
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["half-day-schedules"] })
      queryClient.invalidateQueries({
        queryKey: ["half-day-schedule", variables.id],
      })
      toast.success("Half-day schedule updated successfully")
    },
  })
}

/**
 * Delete a half-day schedule
 */
export const useDeleteHalfDaySchedule = () => {
  const queryClient = useQueryClient()

  return useApiMutation({
    mutationFn: async (id: number) => {
      await api.delete(`/attendance/half-day-schedules/${id}/`)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["half-day-schedules"] })
      queryClient.invalidateQueries({
        queryKey: ["half-day-schedules-archived"],
      })
      toast.success("Half-day schedule archived successfully")
    },
  })
}
