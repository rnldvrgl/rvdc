"use client";

import DateRangePicker from "@/components/custom/inputs/DateRangePicker";
import DashboardCharts from "@/components/custom/shared/charts/DashboardCharts";
import SummaryCards from "@/components/custom/shared/charts/SummaryCards";
import PageHeader from "@/components/custom/shared/PageHeader";
import { Wrapper } from "@/components/custom/shared/Wrapper";
import DashboardCalendar from "@/components/custom/shared/calendar/DashboardCalendar";
import { FormProvider, useForm } from "react-hook-form";
import { BarChart3, TrendingUp } from "lucide-react";
import { useGetSummary } from "@/lib/queries/analytics/useGetAnalytics";

type DashboardFormValues = {
	range?: {
		from?: Date | null;
		to?: Date | null;
	};
	stall?: number;
};

const DashboardPage = () => {
	const { refetch } = useGetSummary({});

	const form = useForm<DashboardFormValues>({
		defaultValues: {
			range: {
				from: new Date(),
				to: new Date(),
			},
			stall: undefined,
		},
	});

	return (
		<Wrapper>
			<PageHeader
				icon={BarChart3}
				title="Dashboard Overview"
				description="Monitor your business performance with real-time analytics, sales metrics, and operational insights."
				breadcrumbs={["Dashboard"]}
				onRefresh={refetch}
			/>
			{/* Calendar */}
			<DashboardCalendar />

			<FormProvider {...form}>
				<div className="space-y-6">
					{/* Date Range Controls */}
					<div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
						<div className="space-y-1">
							<h2 className="text-lg font-semibold flex items-center gap-2">
								<TrendingUp className="size-5" />
								Analytics & Metrics
							</h2>
							<p className="text-sm text-muted-foreground">
								Select a date range to view performance data
							</p>
						</div>
						<div className="flex items-center gap-2">
							<DateRangePicker />
						</div>
					</div>

					{/* Summary Cards */}
					<SummaryCards />

					{/* Charts */}
					<DashboardCharts />
				</div>
			</FormProvider>
		</Wrapper>
	);
};

export default DashboardPage;
