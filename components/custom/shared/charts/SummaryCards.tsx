"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { AnalyticsSummary } from "@/lib/constants/interface";
import { useDateParamsFromForm } from "@/lib/hooks/useDateParamsFromForm";
import { useGetSummary } from "@/lib/queries/analytics/useGetAnalytics";
import { formatCurrency, formatNumber } from "@/lib/utils/helpers";
import {
	AlertCircle,
	Ban,
	Boxes,
	DollarSign,
	LucideIcon,
	Receipt,
	Users,
} from "lucide-react";
import { useMemo } from "react";

interface CardProps {
	title: string;
	value: string | React.ReactNode;
	icon: LucideIcon;
	iconColor: string;
	bgColor: string;
	darkBgColor: string;
}

type SummaryGroup = {
	title: string;
	cards: CardProps[];
};

function buildCard(
	title: string,
	value: string | React.ReactNode,
	icon: LucideIcon,
	iconColor: string,
	bgColor: string,
	darkBgColor: string,
): CardProps {
	return { title, value, icon, iconColor, bgColor, darkBgColor };
}

function getSummaryGroups(data: AnalyticsSummary): SummaryGroup[] {
	return [
		{
			title: "Revenue",
			cards: [
				buildCard(
					"Total Sales",
					formatCurrency(data.total_sales),
					DollarSign,
					"text-green-600 dark:text-green-400",
					"bg-green-100",
					"dark:bg-green-900",
				),
				buildCard(
					"Net Income",
					formatCurrency(data.net_income),
					DollarSign,
					"text-green-600 dark:text-green-400",
					"bg-green-100",
					"dark:bg-green-900",
				),
			],
		},
		{
			title: "Inventory",
			cards: [
				buildCard(
					"Low Stock Items",
					formatNumber(data.low_stock_items),
					AlertCircle,
					"text-orange-600 dark:text-orange-400",
					"bg-orange-100",
					"dark:bg-orange-900",
				),
				buildCard(
					"No Stock Items",
					formatNumber(data.no_stock_items),
					Ban,
					"text-red-600 dark:text-red-400",
					"bg-red-100",
					"dark:bg-red-900",
				),
			],
		},
		{
			title: "Expenses",
			cards: [
				buildCard(
					"Total Expenses",
					formatCurrency(data.total_expense),
					Receipt,
					"text-rose-600 dark:text-rose-400",
					"bg-rose-100",
					"dark:bg-rose-900",
				),
				buildCard(
					"Number of Expenses",
					formatNumber(data.expense_count),
					Receipt,
					"text-fuchsia-600 dark:text-fuchsia-400",
					"bg-fuchsia-100",
					"dark:bg-fuchsia-900",
				),
			],
		},
		{
			title: "Clients & Top Item",
			cards: [
				buildCard(
					"Total Clients",
					formatNumber(data.total_clients),
					Users,
					"text-blue-600 dark:text-blue-400",
					"bg-blue-100",
					"dark:bg-blue-900",
				),
				buildCard(
					"Top Selling Item",
					data.top_selling_item?.name ? (
						<div className="space-y-1">
							<div className="text-md font-bold text-foreground truncate">
								{data.top_selling_item.name}
							</div>
							<div className="text-xs text-muted-foreground">
								{formatNumber(data.top_selling_item.quantity)}{" "}
								sold
							</div>
						</div>
					) : (
						"N/A"
					),
					Boxes,
					"text-indigo-600 dark:text-indigo-400",
					"bg-indigo-100",
					"dark:bg-indigo-900",
				),
			],
		},
	];
}

const SummaryCards = () => {
	const { start_date, end_date, stall } = useDateParamsFromForm();
	const { data, isLoading } = useGetSummary({ start_date, end_date, stall });

	const summaryGroups = useMemo(() => {
		if (!data) return [];
		return getSummaryGroups(data);
	}, [data]);

	return (
		<div className="space-y-6 grid grid-cols-1 gap-4 xl:grid-cols-2">
			{isLoading
				? Array.from({ length: 4 }).map((_, i) => (
						<div key={i}>
							<div className="mb-4">
								<Skeleton className="h-4 w-24" />
							</div>
							<div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
								{Array.from({ length: 2 }).map((_, j) => (
									<Card
										key={j}
										className="rounded-2xl border border-border bg-background shadow-md h-full  flex flex-col justify-between"
									>
										<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
											<CardTitle className="text-sm font-medium text-muted-foreground">
												<Skeleton className="h-4 w-24" />
											</CardTitle>
											<Skeleton className="size-8 rounded-full" />
										</CardHeader>
										<CardContent className="grow flex flex-col justify-center min-h-20">
											<Skeleton className="h-6 w-32" />
										</CardContent>
									</Card>
								))}
							</div>
						</div>
					))
				: summaryGroups.map((group, i) => (
						<div key={i}>
							<h2 className="mb-2 text-nd font-semibold text-foreground">
								{group.title}
							</h2>
							<div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
								{group.cards.map((card, j) => {
									const Icon = card.icon;
									return (
										<Card
											key={j}
											className="rounded-2xl border border-border shadow-md h-full flex flex-col justify-between"
										>
											<CardHeader className="flex flex-row items-center justify-between space-y-0 ">
												<CardTitle className="text-sm font-medium text-muted-foreground truncate">
													{card.title}
												</CardTitle>
												<div
													className={`p-2 rounded-full ${card.bgColor} ${card.darkBgColor}`}
												>
													<Icon
														className={`size-5 ${card.iconColor}`}
													/>
												</div>
											</CardHeader>
											<CardContent className="grow flex flex-col justify-center min-h-[45px]">
												{typeof card.value ===
												"string" ? (
													<div className="text-2xl font-bold text-foreground truncate">
														{card.value}
													</div>
												) : (
													<div className="space-y-1">
														{card.value}
													</div>
												)}
											</CardContent>
										</Card>
									);
								})}
							</div>
						</div>
					))}
		</div>
	);
};

export default SummaryCards;
