"use client";

import PageHeader from "@/components/custom/shared/PageHeader";
import { Wrapper } from "@/components/custom/shared/Wrapper";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useCurrentUser } from "@/lib/hooks/useCurrentUser";
import { useWeeklyPayrolls } from "@/lib/queries/usePayroll";
import { format } from "date-fns";
import {
	Eye,
	PhilippinePesoIcon,
	CheckCircle2,
	Banknote,
	FilePenLine,
	AlertCircle,
} from "lucide-react";
import { useRouter } from "next/navigation";

/**
 * Employee view of their own payroll records
 */
export default function MyPayrollPage() {
	const { user_id } = useCurrentUser();
	const router = useRouter();

	const { data, isLoading } = useWeeklyPayrolls({
		filter: { employee: user_id },
		ordering: "-week_start",
	});

	const getStatusBadge = (status: string) => {
		const config: Record<
			string,
			{ color: string; label: string; icon: React.ReactNode }
		> = {
			draft: {
				color: "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300 border-gray-300 dark:border-gray-600",
				label: "Draft",
				icon: <FilePenLine className="h-3 w-3 mr-1" />,
			},
			approved: {
				color: "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300 border-green-300 dark:border-green-600",
				label: "Approved",
				icon: <CheckCircle2 className="h-3 w-3 mr-1" />,
			},
			paid: {
				color: "bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300 border-blue-300 dark:border-blue-600",
				label: "Paid",
				icon: <Banknote className="h-3 w-3 mr-1" />,
			},
			received: {
				color: "bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300 border-purple-300 dark:border-purple-600",
				label: "Received",
				icon: <CheckCircle2 className="h-3 w-3 mr-1" />,
			},
			cancelled: {
				color: "bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300 border-red-300 dark:border-red-600",
				label: "Cancelled",
				icon: <AlertCircle className="h-3 w-3 mr-1" />,
			},
		};

		const { color, label, icon } = config[status] || config.draft;

		return (
			<Badge
				variant="outline"
				className={`${color} flex items-center w-fit`}
			>
				{icon}
				{label}
			</Badge>
		);
	};

	return (
		<Wrapper>
			<div className="space-y-4 md:space-y-6">
				<PageHeader
					title="My Payroll"
					description="View your payroll history and payment details"
					icon={PhilippinePesoIcon}
				/>

				{isLoading ? (
					<div className="text-center py-8 text-muted-foreground">
						Loading your payroll records...
					</div>
				) : data?.results && data.results.length > 0 ? (
					<div className="grid gap-4">
						{data.results.map((payroll) => (
							<Card
								key={payroll.id}
								className="hover:shadow-md transition-shadow"
							>
								<CardHeader>
									<div className="flex items-center justify-between">
										<CardTitle className="text-lg">
											Pay Period:{" "}
											{format(
												new Date(payroll.week_start),
												"MMM dd",
											)}{" "}
											-{" "}
											{payroll.week_end
												? format(
														new Date(
															payroll.week_end,
														),
														"MMM dd, yyyy",
													)
												: ""}
										</CardTitle>
										{getStatusBadge(payroll.status)}
									</div>
								</CardHeader>
								<CardContent>
									<div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
										<div>
											<p className="text-sm text-muted-foreground">
												Gross Pay
											</p>
											<p className="text-lg font-semibold">
												₱
												{Number(
													payroll.gross_pay,
												).toLocaleString()}
											</p>
										</div>
										<div>
											<p className="text-sm text-muted-foreground">
												Deductions
											</p>
											<p className="text-lg font-semibold text-red-600">
												₱
												{Number(
													payroll.total_deductions,
												).toLocaleString()}
											</p>
										</div>
										<div>
											<p className="text-sm text-muted-foreground">
												Net Pay
											</p>
											<p className="text-lg font-semibold text-green-600">
												₱
												{Number(
													payroll.net_pay,
												).toLocaleString()}
											</p>
										</div>
										<div>
											<p className="text-sm text-muted-foreground">
												Total Hours
											</p>
											<p className="text-lg font-semibold">
												{Number(payroll.regular_hours) +
													Number(
														payroll.overtime_hours,
													)}
												h
											</p>
										</div>
									</div>
									<Button
										variant="outline"
										size="sm"
										onClick={() =>
											router.push(
												`/payroll/slip/${payroll.id}`,
											)
										}
										className="w-full md:w-auto"
									>
										<Eye className="size-4 mr-2" />
										View Payslip
									</Button>
								</CardContent>
							</Card>
						))}
					</div>
				) : (
					<Card>
						<CardContent className="py-8 text-center text-muted-foreground">
							No payroll records found. Payroll records will
							appear here once generated by management.
						</CardContent>
					</Card>
				)}
			</div>
		</Wrapper>
	);
}
