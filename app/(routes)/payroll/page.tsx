"use client";

import React, { useMemo, useState } from "react";

import {
	useWeeklyPayrolls,
	useWeeklyPayroll,
	useRecomputeWeeklyPayroll,
	useTimeEntries,
	useCreateTimeEntry,
	useUpdateTimeEntry,
	useDeleteTimeEntry,
	useWeeklyPayrollFilters,
} from "@/lib/queries/usePayroll";

type ID = number;

import { DataTable } from "@/components/custom/table/DataTable";

import { getWeeklyPayrollColumns } from "@/app/(routes)/payroll/columns";

import { Button } from "@/components/ui/button";

import useUserProfileStore from "@/lib/store/useUserProfileStore";

import useSearchParameters from "@/lib/hooks/useSearchParameters";

import {
	formatCurrency,
	formatHours,
	formatDateDisplay,
	getWeekEnd as getWeekEndInclusive,
	getWeekEndExclusive,
} from "@/lib/utils/helpers";

export default function PayrollPage() {
	const { page, limit, search, ordering, filter } = useSearchParameters();

	const [selectedId, setSelectedId] = useState<ID | null>(null);

	const { filters, orderingOptions } = useWeeklyPayrollFilters();

	// Weekly payrolls list

	const {
		data: weeklyList,
		isLoading: loadingWeeklyList,
		refetch: refetchWeeklyList,
	} = useWeeklyPayrolls({
		page,
		limit,
		search,
		ordering,
		filter,
	});

	// Selected payroll detail

	const { data: selectedPayroll, isLoading: loadingSelected } =
		useWeeklyPayroll(selectedId ?? undefined);

	// Derived filters for time entries (based on selected payroll)

	const { employee, week_start } = selectedPayroll ?? {};

	const weekEnd = useMemo(
		() => getWeekEndInclusive(week_start),
		[week_start],
	);

	// Time entries for selected employee within the selected week

	const {
		data: timeEntries,
		isLoading: loadingEntries,
		refetch: refetchEntries,
	} = useTimeEntries(
		selectedPayroll
			? {
					employee: employee,
					start_date: week_start,
					end_date: getWeekEndExclusive(week_start),
					page: 1,
				}
			: undefined,
	);

	const recomputeMutation = useRecomputeWeeklyPayroll(selectedId ?? 0);

	const createEntryMutation = useCreateTimeEntry();

	const userProfile = useUserProfileStore((state) => state.userProfile);

	const role = userProfile?.role || "guest";

	const handleRecomputeItem = async (wp: { id: ID }) => {
		setSelectedId(wp.id);
		await recomputeMutation.mutateAsync({ include_unapproved: false });
		await refetchWeeklyList();
	};

	const columns = getWeeklyPayrollColumns({
		onEdit: (wp) => setSelectedId(wp.id),
		onDelete: () => {},
		onView: (wp) => setSelectedId(wp.id),
		onRecompute: handleRecomputeItem,
		role,
	});

	// Local form state for creating a time entry

	const [form, setForm] = useState<{
		clock_in: string;
		clock_out: string;
		unpaid_break_minutes: number;
		notes?: string;
		approved: boolean;
		source: "manual" | "schedule" | "import";
	}>({
		clock_in: "",
		clock_out: "",
		unpaid_break_minutes: 0,
		approved: true,
		source: "manual",
		notes: "",
	});

	const handleCreateEntry = async () => {
		if (!selectedPayroll?.employee) return;

		if (!form.clock_in || !form.clock_out) return;

		await createEntryMutation.mutateAsync({
			employee: selectedPayroll.employee,
			clock_in: form.clock_in,
			clock_out: form.clock_out,
			unpaid_break_minutes: Number(form.unpaid_break_minutes || 0),
			approved: form.approved,
			source: form.source,
			notes: form.notes,
		});

		await refetchEntries();

		await refetchWeeklyList();
	};

	const handleRecompute = async () => {
		if (!selectedId) return;

		await recomputeMutation.mutateAsync({
			include_unapproved: false,

			// Optionally pass allowances or deductions here:

			// allowances: Number(selectedPayroll?.allowances ?? 0),

			// extra_flat_deductions: { 'Cash Advance': 500 },

			// percent_deductions: { 'Tax': 0.12 },
		});

		await refetchWeeklyList();
	};

	return (
		<div className="p-4 space-y-8">
			<header className="space-y-1">
				<h1 className="text-2xl font-semibold">Payroll</h1>

				<p className="text-sm text-muted-foreground">
					Weekly payroll summaries, detail view, and time entries
					management.
				</p>
			</header>

			{/* Weekly Payrolls List */}

			<section className="space-y-4">
				<div className="flex items-center justify-between">
					<h2 className="text-lg font-medium">Weekly Payrolls</h2>
				</div>

				<DataTable
					withoutDateRangeFilter
					isLoading={loadingWeeklyList}
					columns={columns}
					filters={filters}
					orderingOptions={orderingOptions}
					data={
						weeklyList || {
							count: 0,
							next: null,
							previous: null,
							results: [],
						}
					}
					headerActions={
						<div className="flex items-center gap-2">
							<Button onClick={() => refetchWeeklyList()}>
								Refresh
							</Button>
						</div>
					}
				/>
			</section>

			{/* Selected Weekly Payroll Detail */}
			{selectedId && (
				<section className="space-y-4">
					<div className="flex items-center justify-between">
						<h2 className="text-lg font-medium">
							Weekly Payroll Detail
						</h2>
						<div className="flex items-center gap-2">
							<button
								className="px-3 py-1.5 rounded border text-sm"
								onClick={handleRecompute}
								disabled={
									recomputeMutation.isPending ||
									loadingSelected
								}
							>
								{recomputeMutation.isPending
									? "Recomputing..."
									: "Recompute"}
							</button>
						</div>
					</div>

					{loadingSelected ? (
						<div className="text-sm">
							Loading selected payroll...
						</div>
					) : selectedPayroll ? (
						<div className="grid grid-cols-1 md:grid-cols-3 gap-4">
							<div className="p-3 border rounded">
								<div className="font-medium mb-2">Summary</div>

								<div className="text-sm">
									<div>
										Employee: {selectedPayroll.employee}
									</div>

									<div>
										Week Start:{" "}
										{formatDateDisplay(
											selectedPayroll.week_start,
										)}
									</div>

									<div>
										Hourly Rate:{" "}
										{formatCurrency(
											selectedPayroll.hourly_rate,
										)}
									</div>

									<div>
										Overtime Threshold:{" "}
										{Number(
											selectedPayroll.overtime_threshold ??
												0,
										).toFixed(2)}{" "}
										h
									</div>

									<div>
										Overtime Multiplier:{" "}
										{Number(
											selectedPayroll.overtime_multiplier ??
												0,
										).toFixed(2)}
										x
									</div>
								</div>
							</div>

							<div className="p-3 border rounded">
								<div className="font-medium mb-2">
									Hours & Pay
								</div>

								<div className="text-sm">
									<div>
										Regular Hours:{" "}
										{formatHours(
											selectedPayroll.regular_hours,
										)}
									</div>

									<div>
										Overtime Hours:{" "}
										{formatHours(
											selectedPayroll.overtime_hours,
										)}
									</div>

									<div>
										Allowances:{" "}
										{formatCurrency(
											selectedPayroll.allowances,
										)}
									</div>

									<div>
										Additional Earnings:{" "}
										{formatCurrency(
											selectedPayroll.additional_earnings_total,
										)}
									</div>

									<div>
										Gross Pay:{" "}
										{formatCurrency(
											selectedPayroll.gross_pay,
										)}
									</div>
								</div>
							</div>

							<div className="p-3 border rounded">
								<div className="font-medium mb-2">
									Deductions & Net
								</div>

								<div className="text-sm space-y-1">
									{Object.entries(
										selectedPayroll.deductions ?? {},
									).map(([name, amt]) => (
										<div
											key={name}
											className="flex items-center justify-between"
										>
											<span>{name}</span>

											<span>{formatCurrency(amt)}</span>
										</div>
									))}

									<div className="flex items-center justify-between font-medium border-t pt-1 mt-1">
										<span>Total Deductions</span>

										<span>
											{formatCurrency(
												selectedPayroll.total_deductions,
											)}
										</span>
									</div>

									<div className="flex items-center justify-between font-semibold">
										<span>Net Pay</span>

										<span>
											{formatCurrency(
												selectedPayroll.net_pay,
											)}
										</span>
									</div>
								</div>
							</div>
						</div>
					) : (
						<div className="text-sm">
							Select a payroll above to view its details.
						</div>
					)}
				</section>
			)}

			{/* Time Entries Management */}

			{selectedPayroll && (
				<section className="space-y-4">
					<div className="flex items-center justify-between">
						<h2 className="text-lg font-medium">Time Entries</h2>

						<button
							className="px-3 py-1.5 rounded border text-sm"
							onClick={() => refetchEntries()}
							disabled={loadingEntries}
						>
							Refresh
						</button>
					</div>

					<div className="grid grid-cols-1 md:grid-cols-3 gap-4">
						{/* Create Entry Form */}

						<div className="p-3 border rounded">
							<div className="font-medium mb-2">Add Entry</div>

							<div className="space-y-2 text-sm">
								<div>
									<label className="block mb-1">
										Clock In (ISO)
									</label>

									<input
										className="w-full border rounded px-2 py-1"
										type="datetime-local"
										value={form.clock_in}
										onChange={(e) =>
											setForm((f) => ({
												...f,

												clock_in: e.target.value,
											}))
										}
									/>
								</div>

								<div>
									<label className="block mb-1">
										Clock Out (ISO)
									</label>

									<input
										className="w-full border rounded px-2 py-1"
										type="datetime-local"
										value={form.clock_out}
										onChange={(e) =>
											setForm((f) => ({
												...f,

												clock_out: e.target.value,
											}))
										}
									/>
								</div>

								<div>
									<label className="block mb-1">
										Unpaid Break (minutes)
									</label>

									<input
										className="w-full border rounded px-2 py-1"
										type="number"
										min={0}
										value={form.unpaid_break_minutes}
										onChange={(e) =>
											setForm((f) => ({
												...f,

												unpaid_break_minutes: Number(
													e.target.value || 0,
												),
											}))
										}
									/>
								</div>

								<div>
									<label className="inline-flex items-center gap-2">
										<input
											type="checkbox"
											checked={form.approved}
											onChange={(e) =>
												setForm((f) => ({
													...f,

													approved: e.target.checked,
												}))
											}
										/>

										<span>Approved</span>
									</label>
								</div>

								<div>
									<label className="block mb-1">Source</label>

									<select
										className="w-full border rounded px-2 py-1"
										value={form.source}
										onChange={(e) =>
											setForm((f) => ({
												...f,

												source: e.target.value as
													| "manual"
													| "schedule"
													| "import",
											}))
										}
									>
										<option value="manual">Manual</option>

										<option value="schedule">
											From Schedule
										</option>

										<option value="import">Imported</option>
									</select>
								</div>

								<div>
									<label className="block mb-1">Notes</label>

									<textarea
										className="w-full border rounded px-2 py-1"
										value={form.notes}
										onChange={(e) =>
											setForm((f) => ({
												...f,

												notes: e.target.value,
											}))
										}
									/>
								</div>

								<div className="flex items-center gap-2">
									<button
										className="px-3 py-1.5 rounded border text-sm"
										onClick={handleCreateEntry}
										disabled={createEntryMutation.isPending}
									>
										{createEntryMutation.isPending
											? "Adding..."
											: "Add Entry"}
									</button>

									<button
										className="px-3 py-1.5 rounded border text-sm"
										onClick={() =>
											setForm({
												clock_in: "",

												clock_out: "",

												unpaid_break_minutes: 0,

												approved: true,

												source: "manual",

												notes: "",
											})
										}
									>
										Reset
									</button>
								</div>
							</div>
						</div>

						{/* Entries Table */}

						<div className="md:col-span-2 p-3 border rounded">
							<div className="font-medium mb-2">
								Entries for Employee #{selectedPayroll.employee}
							</div>

							<div className="text-xs mb-2">
								Week range:{" "}
								{formatDateDisplay(selectedPayroll.week_start)}{" "}
								— {formatDateDisplay(weekEnd)}
							</div>

							<div className="overflow-x-auto">
								<table className="min-w-full text-sm">
									<thead>
										<tr className="text-left border-b">
											<th className="py-2 pr-2">
												Clock In
											</th>

											<th className="py-2 pr-2">
												Clock Out
											</th>

											<th className="py-2 pr-2">
												Break (m)
											</th>

											<th className="py-2 pr-2">
												Approved
											</th>

											<th className="py-2 pr-2">
												Source
											</th>

											<th className="py-2 pr-2">
												Actions
											</th>
										</tr>
									</thead>

									<tbody>
										{loadingEntries ? (
											<tr>
												<td
													className="py-4"
													colSpan={6}
												>
													Loading entries...
												</td>
											</tr>
										) : timeEntries?.results?.length ? (
											timeEntries.results.map((e) => (
												<EntryRow
													key={e.id}
													entry={e}
													onChanged={async () => {
														await refetchEntries();

														await refetchWeeklyList();
													}}
												/>
											))
										) : (
											<tr>
												<td
													className="py-4"
													colSpan={6}
												>
													No entries found.
												</td>
											</tr>
										)}
									</tbody>
								</table>
							</div>
						</div>
					</div>
				</section>
			)}
		</div>
	);
}

/**

 * Entry Row Component with inline approve toggle and delete

 */

function EntryRow({
	entry,

	onChanged,
}: {
	entry: {
		id: ID;

		clock_in: string;

		clock_out: string;

		unpaid_break_minutes: number;

		approved: boolean;

		source: "manual" | "schedule" | "import";

		notes?: string;
	};

	onChanged?: () => void;
}) {
	const updateMutation = useUpdateTimeEntry(entry.id);

	const deleteMutation = useDeleteTimeEntry(entry.id);

	const toggleApproved = async () => {
		await updateMutation.mutateAsync({ approved: !entry.approved });

		onChanged?.();
	};

	const deleteEntry = async () => {
		if (!confirm("Delete this time entry?")) return;

		await deleteMutation.mutateAsync();

		onChanged?.();
	};

	return (
		<tr className="border-b">
			<td className="py-2 pr-2">
				{entry.clock_in
					? new Date(entry.clock_in).toLocaleString()
					: "-"}
			</td>

			<td className="py-2 pr-2">
				{entry.clock_out
					? new Date(entry.clock_out).toLocaleString()
					: "-"}
			</td>

			<td className="py-2 pr-2">{entry.unpaid_break_minutes ?? 0}</td>

			<td className="py-2 pr-2">
				<label className="inline-flex items-center gap-2">
					<input
						type="checkbox"
						checked={entry.approved}
						onChange={toggleApproved}
					/>

					<span className="text-xs">Approved</span>
				</label>
			</td>

			<td className="py-2 pr-2">
				<span className="px-2 py-0.5 rounded border text-xs">
					{entry.source}
				</span>
			</td>

			<td className="py-2 pr-2">
				<div className="flex items-center gap-2">
					<button
						className="px-2 py-1 rounded border text-xs"
						onClick={toggleApproved}
						disabled={updateMutation.isPending}
					>
						{updateMutation.isPending ? "Saving..." : "Toggle"}
					</button>

					<button
						className="px-2 py-1 rounded border text-xs"
						onClick={deleteEntry}
						disabled={deleteMutation.isPending}
					>
						{deleteMutation.isPending ? "Deleting..." : "Delete"}
					</button>
				</div>
			</td>
		</tr>
	);
}
