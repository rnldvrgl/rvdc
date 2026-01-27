import { useQuery } from "@tanstack/react-query";
import axios from "axios";
import { LucideIcon } from "lucide-react";

export interface CalendarEvent {
	id: string;
	title: string;
	start: string;
	end?: string;
	allDay?: boolean;
	backgroundColor?: string;
	borderColor?: string;
	textColor?: string;
	extendedProps: {
		type: "birthday" | "holiday" | "schedule" | "attendance";
		user_id?: number;
		user_name?: string;
		holiday_type?: string;
		holiday_id?: number;
		service_type?: string;
		client_name?: string;
		technician_names?: string[];
		schedule_id?: number;
		notes?: string;
		// Attendance specific props
		attendance_status?: "present" | "absent" | "late" | "sick" | "vacation";
		employee_name?: string;
		employeeName?: string;
		status?: "present" | "absent" | "late" | "sick" | "vacation";
		check_in?: string;
		check_out?: string;
		checkIn?: string;
		checkOut?: string;
		hours?: number;
		iconComponent?: LucideIcon;
	};
}

interface UseCalendarEventsParams {
	start?: string;
	end?: string;
	enabled?: boolean;
}

export const useCalendarEvents = ({
	start,
	end,
	enabled = true,
}: UseCalendarEventsParams = {}) => {
	return useQuery<CalendarEvent[]>({
		queryKey: ["calendar-events", start, end],
		queryFn: async () => {
			const params: Record<string, string> = {};
			if (start) params.start = start;
			if (end) params.end = end;

			const response = await axios.get(
				"/api/analytics/calendar/events/",
				{
					params,
				},
			);
			return response.data;
		},
		staleTime: 5 * 60 * 1000, // 5 minutes
		gcTime: 10 * 60 * 1000, // 10 minutes
		enabled,
	});
};

export default useCalendarEvents;
