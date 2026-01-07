"use client";

import React, { useMemo } from "react";

import Link from "next/link";

import { useParams, useRouter } from "next/navigation";

import {
	useWeeklyPayroll,
	useTimeEntries,
	useRecomputeWeeklyPayroll,
} from "@/lib/queries/usePayroll";

function formatCurrency(value: string | number | undefined) {
	const num = Number(value ?? 0);

	return `₱${num.toLocaleString(undefined, {
		minimumFractionDigits: 2,

		maximumFractionDigits: 2,
	})}`;
}

function formatHours(value: string | number | undefined) {
	const num = Number(value ?? 0);

	return `${num.toFixed(2)} h`;
}

function parseISODateToDisplay(d?: string) {
	if (!d) return "-";

	const date = new Date(d);

	return date.toLocaleDateString();
}

function getWeekEnd(weekStart?: string) {
	if (!weekStart) return undefined;

	const start = new Date(weekStart);

	const end = new Date(start);

	end.setDate(start.getDate() + 6); // inclusive end (Saturday–Friday week)

	return end.toISOString().slice(0, 10); // YYYY-MM-DD
}

function getWeekEndExclusive(weekStart?: string) {
	if (!weekStart) return undefined;

	const start = new Date(weekStart);

	const end = new Date(start);

	end.setDate(start.getDate() + 7); // exclusive end for range filters

	return end.toISOString().slice(0, 10); // YYYY-MM-DD
}

export default function PayrollDetailPage() {
	const params = useParams();

	const router = useRouter();

	const idParam = params?.id;

	const id =
		typeof idParam === "string"
			? Number(idParam)
			: Array.isArray(idParam)
				? Number(idParam[0])
				: NaN;

	const {
		data: payroll,

		isLoading: loadingPayroll,

		refetch: refetchPayroll,
	} = useWeeklyPayroll(isNaN(id) ? undefined : id);

	const recomputeMutation = useRecomputeWeeklyPayroll(isNaN(id) ? 0 : id);

	const weekEnd = useMemo(
		() => getWeekEnd(payroll?.week_start),
		[payroll?.week_start],
	);

	const {
		data: entries,

		isLoading: loadingEntries,

		refetch: refetchEntries,
	} = useTimeEntries(
		payroll
			? {
					employee: payroll.employee,

					start_date: payroll.week_start,

					end_date: getWeekEndExclusive(payroll.week_start),

					page: 1,
				}
			: undefined,
	);

	const handleRecompute = async () => {
		if (!payroll?.id) return;

		await recomputeMutation.mutateAsync({
			include_unapproved: false,

			// Example of passing custom allowances/deductions if needed:

			// allowances: Number(payroll.allowances ?? 0),

			// extra_flat_deductions: { 'Cash Advance': 500 },

			// percent_deductions: { 'Tax': 0.12 },
		});

		await refetchPayroll();

		await refetchEntries();
	};

	return (
		<div className="container mx-auto p-6 space-y-8">
			<header className="space-y-2">
				<div className="flex items-center justify-between">
					<h1 className="text-2xl font-bold tracking-tight">
						Payroll Detail
					</h1>

					<div className="flex items-center gap-2">
						<Link
							href="/payroll"
							className="px-3 py-1.5 rounded-md border text-sm hover:bg-muted"
						>
							Back to List
						</Link>

						<button
							className="px-3 py-1.5 rounded-md border text-sm hover:bg-muted"
							onClick={handleRecompute}
							disabled={
								recomputeMutation.isPending || loadingPayroll
							}
						>
							{recomputeMutation.isPending
								? "Recomputing..."
								: "Recompute"}
						</button>

						<button
							className="px-3 py-1.5 rounded-md border text-sm hover:bg-muted"
							onClick={() => {
								refetchPayroll();

								refetchEntries();
							}}
							disabled={loadingPayroll || loadingEntries}
						>
							Refresh
						</button>
					</div>
				</div>

				<p className="text-sm text-muted-foreground">
					View weekly payroll summary, time entries, and recompute
					totals.
				</p>
			</header>

			{/* Summary */}

			<section className="space-y-4">
				{loadingPayroll ? (
					<div className="text-sm">Loading payroll...</div>
				) : payroll ? (
					<div className="grid grid-cols-1 md:grid-cols-3 gap-6">
						<div className="p-4 border rounded-lg bg-card shadow-sm">
							<div className="font-semibold mb-2">Summary</div>

							<div className="text-sm space-y-2">
								<div className="flex items-center justify-between">
									<span className="text-muted-foreground">
										Payroll ID
									</span>

									<span className="font-mono">
										{payroll.id}
									</span>
								</div>

								<div className="flex items-center justify-between">
									<span className="text-muted-foreground">
										Employee
									</span>

									<span className="font-mono">
										{payroll.employee}
									</span>
								</div>

								<div className="flex items-center justify-between">
									<span className="text-muted-foreground">
										Week Start
									</span>

									<span>
										{parseISODateToDisplay(
											payroll.week_start,
										)}
									</span>
								</div>

								<div className="flex items-center justify-between">
									<span className="text-muted-foreground">
										Week End
									</span>

									<span>
										{parseISODateToDisplay(weekEnd)}
									</span>
								</div>

								<div className="flex items-center justify-between">
									<span className="text-muted-foreground">
										Status
									</span>

									<span className="px-2 py-0.5 rounded-md border text-xs bg-muted/50">
										{payroll.status}
									</span>
								</div>

								<div className="flex items-center justify-between">
									<span className="text-muted-foreground">
										Hourly Rate
									</span>

									<span>
										{formatCurrency(payroll.hourly_rate)}
									</span>
								</div>

								<div className="flex items-center justify-between">
									<span className="text-muted-foreground">
										OT Threshold
									</span>

									<span>
										{Number(
											payroll.overtime_threshold ?? 0,
										).toFixed(2)}{" "}
										h
									</span>
								</div>

								<div className="flex items-center justify-between">
									<span className="text-muted-foreground">
										OT Multiplier
									</span>

									<span>
										{Number(
											payroll.overtime_multiplier ?? 0,
										).toFixed(2)}
										x
									</span>
								</div>
							</div>
						</div>

						<div className="p-4 border rounded-lg bg-card shadow-sm">
							<div className="font-semibold mb-2">
								Hours & Pay
							</div>

							<div className="text-sm space-y-2">
								<div className="flex items-center justify-between">
									<span>Regular Hours</span>

									<span>
										{formatHours(payroll.regular_hours)}
									</span>
								</div>

								<div className="flex items-center justify-between">
									<span>Overtime Hours</span>

									<span>
										{formatHours(payroll.overtime_hours)}
									</span>
								</div>

								<div className="flex items-center justify-between">
									<span>Night Diff Hours</span>

									<span>
										{formatHours(payroll.night_diff_hours)}
									</span>
								</div>

								<div className="flex items-center justify-between">
									<span>Approved OT Hours</span>

									<span>
										{formatHours(payroll.approved_ot_hours)}
									</span>
								</div>

								<div className="flex items-center justify-between">
									<span>Allowances</span>

									<span>
										{formatCurrency(payroll.allowances)}
									</span>
								</div>

								<div className="flex items-center justify-between">
									<span>Additional Earnings</span>

									<span>
										{formatCurrency(
											payroll.additional_earnings_total,
										)}
									</span>
								</div>

								<div className="flex items-center justify-between">
									<span>Night Diff Pay</span>

									<span>
										{formatCurrency(payroll.night_diff_pay)}
									</span>
								</div>

								<div className="flex items-center justify-between">
									<span>Approved OT Pay</span>

									<span>
										{formatCurrency(
											payroll.approved_ot_pay,
										)}
									</span>
								</div>

								<div className="flex items-center justify-between font-medium border-t pt-2 mt-2">
									<span>Gross Pay</span>

									<span>
										{formatCurrency(payroll.gross_pay)}
									</span>
								</div>
							</div>
						</div>

						<div className="p-4 border rounded-lg bg-card shadow-sm">
							<div className="font-semibold mb-2">
								Deductions & Net
							</div>

							<div className="text-sm space-y-2">
								{Object.entries(payroll.deductions ?? {}).map(
									([name, amt]) => (
										<div
											key={name}
											className="flex items-center justify-between"
										>
											<span>{name}</span>

											<span className="text-red-600">
												{formatCurrency(amt)}
											</span>
										</div>
									),
								)}

								<div className="flex items-center justify-between font-medium border-t pt-2 mt-2">
									<span>Total Deductions</span>

									<span className="text-red-600">
										{formatCurrency(
											payroll.total_deductions,
										)}
									</span>
								</div>

								<div className="flex items-center justify-between font-semibold">
									<span>Net Pay</span>

									<span className="text-green-600">
										{formatCurrency(payroll.net_pay)}
									</span>
								</div>
							</div>
						</div>
					</div>
				) : (
					<div className="text-sm">
						No payroll found for the specified ID.
					</div>
				)}
			</section>

			{/* Time Entries */}

			<section className="space-y-3">
				<div className="flex items-center justify-between">
					<h2 className="text-lg font-medium">Time Entries</h2>

					<div className="text-xs text-muted-foreground">
						{payroll ? (
							<>
								Employee #{payroll.employee} • Week:{" "}
								{parseISODateToDisplay(payroll.week_start)} —{" "}
								{parseISODateToDisplay(weekEnd)}
							</>
						) : (
							"—"
						)}
					</div>
				</div>

				<div className="overflow-x-auto">
					<table className="min-w-full text-sm">
						<thead>
							<tr className="text-left border-b">
								<th className="py-2 pr-2">Clock In</th>

								<th className="py-2 pr-2">Clock Out</th>

								<th className="py-2 pr-2">Break (m)</th>

								<th className="py-2 pr-2">Approved</th>

								<th className="py-2 pr-2">Source</th>
							</tr>
						</thead>

						<tbody>
							{loadingEntries ? (
								<tr>
									<td className="py-4" colSpan={5}>
										Loading entries...
									</td>
								</tr>
							) : entries?.results?.length ? (
								entries.results.map((e) => (
									<tr key={e.id} className="border-b">
										<td className="py-2 pr-2">
											{e.clock_in
												? new Date(
														e.clock_in,
													).toLocaleString()
												: "-"}
										</td>

										<td className="py-2 pr-2">
											{e.clock_out
												? new Date(
														e.clock_out,
													).toLocaleString()
												: "-"}
										</td>

										<td className="py-2 pr-2">
											{e.unpaid_break_minutes ?? 0}
										</td>

										<td className="py-2 pr-2">
											<span className="px-2 py-0.5 rounded border text-xs">
												{e.approved ? "Yes" : "No"}
											</span>
										</td>

										<td className="py-2 pr-2">
											<span className="px-2 py-0.5 rounded border text-xs">
												{e.source}
											</span>
										</td>
									</tr>
								))
							) : (
								<tr>
									<td className="py-4" colSpan={5}>
										No entries found for this week.
									</td>
								</tr>
							)}
						</tbody>
					</table>
				</div>
			</section>

			{/* Payout Checklist */}
			<section className="space-y-3">
				<h2 className="text-lg font-medium">Payout Checklist</h2>
				<p className="text-xs text-muted-foreground">
					Salary is given every Saturday. Review and mark items below
					before payout.
				</p>
				<div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
					<div className="p-3 border rounded">
						<div className="flex items-center justify-between">
							<span>Time entries approved</span>
							<span className="px-2 py-0.5 rounded border text-xs">
								Pending
							</span>
						</div>
						<div className="flex items-center justify-between mt-1">
							<span>Sessions review cleared</span>
							<span className="px-2 py-0.5 rounded border text-xs">
								Pending
							</span>
						</div>
						<div className="flex items-center justify-between mt-1">
							<span>Additional earnings approved</span>
							<span className="px-2 py-0.5 rounded border text-xs">
								Pending
							</span>
						</div>
					</div>
					<div className="p-3 border rounded">
						<div className="flex items-center justify-between">
							<span>Deductions applied</span>
							<span className="px-2 py-0.5 rounded border text-xs">
								Pending
							</span>
						</div>
						<div className="flex items-center justify-between mt-1">
							<span>Weekly payroll recomputed</span>
							<span className="px-2 py-0.5 rounded border text-xs">
								Pending
							</span>
						</div>
						<div className="flex items-center justify-between mt-1">
							<span>Weekly payroll approved</span>
							<span className="px-2 py-0.5 rounded border text-xs">
								Pending
							</span>
						</div>
					</div>
				</div>
				<div className="text-xs text-muted-foreground">
					Note: Sundays may be half-day at the shop. Ensure Sunday
					entries reflect reduced hours when applicable.
				</div>
			</section>

			{/* Navigation */}
			<section>
				<div className="flex items-center gap-2">
					<button
						className="px-3 py-1.5 rounded border text-sm"
						onClick={() => router.push("/payroll")}
					>
						Back
					</button>

					<button
						className="px-3 py-1.5 rounded border text-sm"
						onClick={handleRecompute}
						disabled={recomputeMutation.isPending || loadingPayroll}
					>
						{recomputeMutation.isPending
							? "Recomputing..."
							: "Recompute"}
					</button>
				</div>
			</section>
		</div>
	);
}
