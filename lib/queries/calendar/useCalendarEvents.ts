import { useQuery } from "@tanstack/react-query"
import axios from "axios"
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
    type: "birthday" | "holiday" | "schedule" | "attendance" | "leave"
    user_id?: number
    user_name?: string
    holiday_type?: string
    holiday_id?: number
    service_type?: string
    client_name?: string
    technician_names?: string[]
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

      const response = await axios.get("/api/analytics/calendar/events/", {
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
