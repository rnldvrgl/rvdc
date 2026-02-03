"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useDateParamsFromForm } from "@/lib/hooks/useDateParamsFromForm";
import {
	useCashFlow,
	useExpensesOverTime,
	useSalesOverTime,
	useTopClients,
	useTopSellingItems,
	useUnpaidSalesStatus,
} from "@/lib/queries/analytics/useGetAnalytics";
import TimeSeriesChart from "./TimeSeriesChart";
import BarChart from "./BarChart";
import DonutChart from "./DonutChart";
import {
	TrendingUp,
	TrendingDown,
	DollarSign,
	Users,
	Package,
	PieChart,
} from "lucide-react";

const ChartCard = ({
	title,
	isLoading,
	children,
	icon: Icon,
	description,
}: {
	title: string;
	isLoading: boolean;
	children: React.ReactNode;
	icon?: React.ElementType;
	description?: string;
}) => (
	<div className="transform transition-all duration-200 hover:-translate-y-0.5">
		<Card className="overflow-hidden border-0 shadow-sm hover:shadow-md transition-all duration-200 bg-linear-to-br from-white/80 to-slate-50/40 dark:from-slate-900/50 dark:to-slate-800/30">
			<CardHeader className="pb-3 border-b border-slate-200/50 dark:border-slate-700/30">
				<CardTitle className="text-lg font-semibold flex items-center gap-2.5">
					{Icon && (
						<div className="p-2 rounded-lg bg-slate-100/80 dark:bg-slate-800/60">
							<Icon className="size-4 text-slate-600 dark:text-slate-400" />
						</div>
					)}
					{title}
				</CardTitle>
				{description && (
					<p className="text-sm text-muted-foreground/80">
						{description}
					</p>
				)}
			</CardHeader>
			<CardContent className="h-80">
				{isLoading ? (
					<Skeleton className="w-full h-full rounded-lg" />
				) : (
					children
				)}
			</CardContent>
		</Card>
	</div>
);

export default function DashboardCharts() {
	const { start_date, end_date, stall } = useDateParamsFromForm();

	const { data: salesOvertime, isLoading: salesOvertimeLoading } =
		useSalesOverTime({ start_date, end_date, stall });
	const { data: expensesOvertime, isLoading: expensesOvertimeLoading } =
		useExpensesOverTime({ start_date, end_date, stall });
	const { data: topSellingItems, isLoading: topSellingItemsLoading } =
		useTopSellingItems({ start_date, end_date, stall });
	const { data: cashFlow, isLoading: cashFlowLoading } = useCashFlow({
		start_date,
		end_date,
		stall,
	});
	const { data: topClients, isLoading: topClientsLoading } = useTopClients({
		start_date,
		end_date,
		stall,
	});
	const { data: unpaidSalesStatus, isLoading: unpaidSalesStatusLoading } =
		useUnpaidSalesStatus({ start_date, end_date, stall });

	return (
		<div className="grid gap-6 xl:grid-cols-2">
			<ChartCard
				title="Sales Performance"
				icon={TrendingUp}
				description="Track your sales growth over time"
				isLoading={salesOvertimeLoading}
			>
				<TimeSeriesChart
					data={salesOvertime || []}
					lines={[
						{
							key: "total_sales",
							color: "#10b981",
							label: "Total Sales",
							gradientId: "salesGradient",
						},
					]}
					height={280}
				/>
			</ChartCard>

			<ChartCard
				title="Expense Tracking"
				icon={TrendingDown}
				description="Monitor your business expenses"
				isLoading={expensesOvertimeLoading}
			>
				<TimeSeriesChart
					data={expensesOvertime || []}
					lines={[
						{
							key: "total_expense",
							color: "#ef4444",
							label: "Total Expenses",
							gradientId: "expenseGradient",
						},
					]}
					height={280}
				/>
			</ChartCard>

			<ChartCard
				title="Cash Flow Analysis"
				icon={DollarSign}
				description="Compare income vs expenses"
				isLoading={cashFlowLoading}
			>
				<TimeSeriesChart
					data={cashFlow || []}
					lines={[
						{
							key: "income",
							color: "#3b82f6",
							label: "Income",
							gradientId: "incomeGradient",
						},
						{
							key: "expense",
							color: "#f97316",
							label: "Expense",
							gradientId: "expenseFlowGradient",
						},
					]}
					height={280}
				/>
			</ChartCard>

			<ChartCard
				title="Top Selling Items"
				icon={Package}
				description="Best performing products"
				isLoading={topSellingItemsLoading}
			>
				<BarChart
					data={topSellingItems || []}
					xKey="item"
					yKey="quantity"
					color="#64748b"
					height={280}
					gradientIntensity={0.3}
				/>
			</ChartCard>

			<ChartCard
				title="Top Clients"
				icon={Users}
				description="Your most valuable customers"
				isLoading={topClientsLoading}
			>
				<BarChart
					data={topClients || []}
					xKey="client"
					yKey="total_spent"
					color="#6b7280"
					height={280}
					gradientIntensity={0.3}
				/>
			</ChartCard>

			<ChartCard
				title="Sales Status Overview"
				icon={PieChart}
				description="Payment status breakdown"
				isLoading={unpaidSalesStatusLoading}
			>
				<DonutChart
					data={unpaidSalesStatus || []}
					nameKey="status"
					valueKey="count"
					height={280}
					innerRadius={50}
					outerRadius={90}
					showPercentage={true}
					showLegend={true}
				/>
			</ChartCard>
		</div>
	);
}
