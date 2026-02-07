"use client"

import { Schedule } from "@/lib/constants/interface"
import api from "@/lib/utils/api"
import { useQuery } from "@tanstack/react-query"

export function useSchedulesByService(serviceId: number | undefined) {
  return useQuery<Schedule[]>({
    queryKey: ["schedules", "service", serviceId],
    queryFn: async () => {
      if (!serviceId) return []
      const { data } = await api.get("/schedules/", {
        params: {
          service: serviceId,
          ordering: "-scheduled_date",
        },
      })
      return data.results || []
    },
    enabled: !!serviceId,
    staleTime: 5 * 60 * 1000, // 5 minutes
  })
}

export function useSchedule(scheduleId: number | undefined) {
  return useQuery<Schedule>({
    queryKey: ["schedule", scheduleId],
    queryFn: async () => {
      if (!scheduleId) throw new Error("Schedule ID is required")
      const { data } = await api.get(`/schedules/${scheduleId}/`)
      return data
    },
    enabled: !!scheduleId,
    staleTime: 5 * 60 * 1000, // 5 minutes
  })
}
