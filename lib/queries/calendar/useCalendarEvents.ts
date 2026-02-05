import api from "@/lib/utils/api"
import { useQuery } from "@tanstack/react-query"
import { LucideIcon } from "lucide-react"

export interface CalendarEvent {
  id: string
  title: string
  start: string
  end?: string
  allDay?: boolean
  backgroundColor?: string
  borderColor?: string
  textColor?: string
  extendedProps: {
    type:
      | "birthday"
      | "holiday"
      | "schedule"
      | "delivery"
      | "attendance"
      | "leave"
      | "custom_event"
    user_id?: number
    user_name?: string
    holiday_type?: string
    holiday_id?: number
    schedule_type?: string
    schedule_type_display?: string
    service_type?: string // Service type from linked Service (e.g., "REPAIR", "MAINTENANCE")
    service_type_display?: string // Service type display name
    client_name?: string
    client_id?: number
    technician_names?: string[]
    technician_ids?: number[]
    technician_display?: string
    technician_count?: number
    schedule_id?: number
    notes?: string
    // Attendance specific props
    attendance_status?: "present" | "absent" | "late" | "leave" | "invalid"
    employee_name?: string
    employeeName?: string
    status?: "present" | "absent" | "late" | "leave" | "invalid"
    check_in?: string
    check_out?: string
    checkIn?: string
    checkOut?: string
    hours?: number
    iconComponent?: LucideIcon
    // Leave specific props
    leave_id?: number
    employee_id?: number
    leave_type?: "SICK" | "EMERGENCY"
    leave_type_display?: string
    is_half_day?: boolean
    shift_period?: string
    shift_period_display?: string
    reason?: string
    // Custom event props
    custom_event_id?: number
    description?: string
    event_type?:
      | "holiday"
      | "meeting"
      | "maintenance"
      | "training"
      | "deadline"
      | "other"
    created_by?: string
  }
}

interface UseCalendarEventsParams {
  start?: string
  end?: string
  enabled?: boolean
}

export const useCalendarEvents = ({
  start,
  end,
  enabled = true,
}: UseCalendarEventsParams = {}) => {
  return useQuery<CalendarEvent[]>({
    queryKey: ["calendar-events", start, end],
    queryFn: async () => {
      const params: Record<string, string> = {}
      if (start) params.start = start
      if (end) params.end = end

      const response = await api.get("/analytics/calendar/events/", {
        params,
      })
      return response.data
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
    enabled,
  })
}

export default useCalendarEvents
