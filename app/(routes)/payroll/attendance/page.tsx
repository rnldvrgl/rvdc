"use client";

import React, { useMemo, useState } from "react";
import { getWeeklyPayrollColumns } from "./columns";
import {
	useWeeklyPayrolls,
	useWeeklyPayroll,
	useTimeEntries,
	useWeeklyPayrollFilters,
} from "@/lib/queries/usePayroll";

import { DataTable } from "@/components/custom/table/DataTable";
import EntitySheet from "@/components/custom/shared/EntitySheet";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";

import useUserProfileStore from "@/lib/store/useUserProfileStore";

import useSearchParameters from "@/lib/hooks/useSearchParameters";

import {
	formatCurrency,
	formatHours,
	formatDateDisplay,
	getWeekEnd as getWeekEndInclusive,
	getWeekEndExclusive,
} from "@/lib/utils/helpers";

import { useTimeEntryMutations } from "@/lib/mutations/payroll/useTimeEntryMutations";

import type { ID } from "@/lib/queries/usePayroll";

import { useRecomputeWeeklyPayroll } from "@/lib/mutations/payroll/usePayrollMutations";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";

import { useForm } from "react-hook-form";
import {
	Form,
	FormField,
	FormItem,
	FormLabel,
	FormControl,
	FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import {
	Select,
	SelectTrigger,
	SelectValue,
	SelectContent,
	SelectItem,
} from "@/components/ui/select";

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

	const { addTimeEntry } = useTimeEntryMutations();

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

	// Local form state for creating a time entry (react-hook-form)

	type AddEntryFormValues = {
		clock_in: string;
		clock_out: string;
		unpaid_break_minutes: number;

		approved: boolean;
		source: "manual" | "schedule" | "import";

		notes?: string;
	};

	const addEntrySchema = z.object({
		clock_in: z.string().min(1, "Clock in is required"),
		clock_out: z.string().min(1, "Clock out is required"),
		unpaid_break_minutes: z
			.number({ invalid_type_error: "Break must be a number" })
			.min(0, "Break must be non-negative"),
		approved: z.boolean(),
		source: z.enum(["manual", "schedule", "import"]),
		notes: z.string().optional(),
	});

	const addEntryForm = useForm<AddEntryFormValues>({
		resolver: zodResolver(addEntrySchema),
		defaultValues: {
			clock_in: "",

			clock_out: "",

			unpaid_break_minutes: 0,

			approved: true,

			source: "manual",

			notes: "",
		},
	});

	// Sheet state for custom form
	const [addOpen, setAddOpen] = useState(false);

	const handleCreateEntry = async (values: AddEntryFormValues) => {
		if (!selectedPayroll?.employee) return;

		await addTimeEntry.mutateAsync({
			employee: selectedPayroll.employee,

			clock_in: values.clock_in,
			clock_out: values.clock_out,
			unpaid_break_minutes: Number(values.unpaid_break_minutes || 0),

			approved: values.approved,
			source: values.source,
			notes: values.notes,
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

											<span>
												{formatCurrency(
													Number(
														amt as number | string,
													),
												)}
											</span>
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
							<div className="flex items-center justify-between mb-2">
								<div className="font-medium">Add Entry</div>
								<Button onClick={() => setAddOpen(true)}>
									<Plus className="size-4 mr-1" />
									New Entry
								</Button>
							</div>

							<EntitySheet
								open={addOpen}
								onClose={() => setAddOpen(false)}
								title="Add Time Entry"
								description="Fill out the form to add a new time entry for the selected employee."
								withCloseConfirmation
								renderForm={({ forceClose }) => (
									<Form {...addEntryForm}>
										<form
											onSubmit={addEntryForm.handleSubmit(
												async (values) => {
													await handleCreateEntry(
														values,
													);
													addEntryForm.reset();
													forceClose();
												},
											)}
											className="space-y-3 text-sm"
										>
											<FormField
												control={addEntryForm.control}
												name="clock_in"
												render={({ field }) => (
													<FormItem>
														<FormLabel>
															Clock In
														</FormLabel>
														<FormControl>
															<Input
																type="datetime-local"
																{...field}
															/>
														</FormControl>
														<FormMessage />
													</FormItem>
												)}
											/>

											<FormField
												control={addEntryForm.control}
												name="clock_out"
												render={({ field }) => (
													<FormItem>
														<FormLabel>
															Clock Out
														</FormLabel>
														<FormControl>
															<Input
																type="datetime-local"
																{...field}
															/>
														</FormControl>
														<FormMessage />
													</FormItem>
												)}
											/>

											<FormField
												control={addEntryForm.control}
												name="unpaid_break_minutes"
												render={({ field }) => (
													<FormItem>
														<FormLabel>
															Unpaid Break
															(minutes)
														</FormLabel>
														<FormControl>
															<Input
																type="number"
																min={0}
																value={
																	field.value
																}
																onChange={(e) =>
																	field.onChange(
																		Number(
																			e
																				.target
																				.value ||
																				0,
																		),
																	)
																}
															/>
														</FormControl>
														<FormMessage />
													</FormItem>
												)}
											/>

											<FormField
												control={addEntryForm.control}
												name="approved"
												render={({ field }) => (
													<FormItem>
														<FormLabel>
															Approved
														</FormLabel>
														<FormControl>
															<div className="flex items-center gap-2">
																<Checkbox
																	checked={
																		field.value
																	}
																	onCheckedChange={
																		field.onChange
																	}
																/>
															</div>
														</FormControl>

														<FormMessage />
													</FormItem>
												)}
											/>

											<FormField
												control={addEntryForm.control}
												name="source"
												render={({ field }) => (
													<FormItem>
														<FormLabel>
															Source
														</FormLabel>
														<FormControl>
															<Select
																value={
																	field.value
																}
																onValueChange={
																	field.onChange
																}
															>
																<SelectTrigger>
																	<SelectValue placeholder="Select a source" />
																</SelectTrigger>
																<SelectContent>
																	<SelectItem value="manual">
																		Manual
																	</SelectItem>
																	<SelectItem value="schedule">
																		From
																		Schedule
																	</SelectItem>
																	<SelectItem value="import">
																		Imported
																	</SelectItem>
																</SelectContent>
															</Select>
														</FormControl>
														<FormMessage />
													</FormItem>
												)}
											/>

											<FormField
												control={addEntryForm.control}
												name="notes"
												render={({ field }) => (
													<FormItem>
														<FormLabel>
															Notes
														</FormLabel>
														<FormControl>
															<Input {...field} />
														</FormControl>
														<FormMessage />
													</FormItem>
												)}
											/>

											<div className="flex items-center gap-2 pt-2">
												<Button
													type="submit"
													disabled={
														addTimeEntry.isPending
													}
												>
													{addTimeEntry.isPending
														? "Adding..."
														: "Add Entry"}
												</Button>
												<Button
													type="button"
													variant="ghost"
													onClick={() =>
														addEntryForm.reset()
													}
												>
													Reset
												</Button>
											</div>
										</form>
									</Form>
								)}
							/>

							<p className="text-xs text-muted-foreground">
								Entries are automatically associated with the
								selected employee and week.
							</p>
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
											timeEntries.results.map(
												(e: any) => (
													<EntryRow
														key={e.id}
														entry={e}
														onChanged={async () => {
															await refetchEntries();

															await refetchWeeklyList();
														}}
													/>
												),
											)
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
	const {
		useUpdateTimeEntry,
		useDeleteTimeEntry,
	} = require("@/lib/mutations/payroll/usePayrollMutations");

	const updateMutation = useUpdateTimeEntry(entry.id);

	const deleteMutation = useDeleteTimeEntry(entry.id);

	const toggleApproved = async () => {
		await updateMutation.mutateAsync({ approved: !entry.approved });

		onChanged?.();
	};

	const deleteEntry = async () => {
		// if (!confirm("Delete this time entry?")) return;
		// await deleteMutation.mutateAsync();
		// onChanged?.();
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
