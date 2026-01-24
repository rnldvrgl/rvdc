"use client";

import PageHeader from "@/components/custom/shared/PageHeader";
import { Wrapper } from "@/components/custom/shared/Wrapper";
import DashboardCalendar from "@/components/custom/shared/calendar/DashboardCalendar";
import { Calendar } from "lucide-react";
import { useGetSummary } from "@/lib/queries/analytics/useGetAnalytics";

const CalendarPage = () => {
	const { refetch } = useGetSummary({});

	return (
		<Wrapper>
			<PageHeader
				icon={Calendar}
				title="Calendar"
				description="View all birthdays, holidays, and scheduled services in a comprehensive calendar view."
				breadcrumbs={["Dashboard", "Calendar"]}
				onRefresh={refetch}
			/>

			<div className="space-y-6">
				<DashboardCalendar />
			</div>
		</Wrapper>
	);
};

export default CalendarPage;
