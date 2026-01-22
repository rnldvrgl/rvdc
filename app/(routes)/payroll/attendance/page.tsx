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
import PageHeader from "@/components/custom/shared/PageHeader";
import { Wrapper } from "@/components/custom/shared/Wrapper";
import { Button } from "@/components/ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
	Clock,
	RefreshCw,
	Calendar,
	Plus,
	Eye,
	Calculator,
} from "lucide-react";

import { useCurrentUser } from "@/lib/hooks/useCurrentUser";
import useSearchParameters from "@/lib/hooks/useSearchParameters";

import {
	formatCurrency,
	formatHours,
	formatDateDisplay,
	getWeekEnd as getWeekEndInclusive,
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
import { useEntitySheet } from "@/lib/hooks/useEntitySheet";

export default function PayrollAttendancePage() {
	const { isAdmin, role } = useCurrentUser();
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

	// Time entries for the selected payroll
	const {
		data: timeEntries,
		isLoading: loadingEntries,
		refetch: refetchEntries,
	} = useTimeEntries({
		employee: employee,
		start_date: week_start,
		end_date: weekEnd,
		page: 1,
	});

	const recomputeMutation = useRecomputeWeeklyPayroll(selectedId ?? 0);
	const { addTimeEntry } = useTimeEntryMutations();

	const handleRecomputeItem = (wp: { id: number }) => {
		setSelectedId(wp.id);
		recomputeMutation.mutate({ include_unapproved: false });
	};

	const columns = getWeeklyPayrollColumns({
		onEdit: () => {},
		onDelete: () => {},
		onView: (payroll) => setSelectedId(payroll.id ?? null),
		onRecompute: handleRecomputeItem,
		role: role || "guest",
	});

	// Add Time Entry Form
	type AddEntryFormValues = {
		clock_in: string;
		clock_out: string;
		unpaid_break_minutes?: number;
		approved?: boolean;
		source: "manual" | "schedule" | "import";
		notes?: string;
	};

	const addEntrySchema = z.object({
		clock_in: z.string().min(1, "Clock in time is required"),
		clock_out: z.string().min(1, "Clock out time is required"),
		unpaid_break_minutes: z
			.number()
			.min(0, "Break minutes must be positive")
			.optional(),
		approved: z.boolean().optional(),
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
			source: "manual" as const,
			notes: "",
		},
	});

	const handleCreateEntry = async (values: AddEntryFormValues) => {
		if (!selectedPayroll) return;

		await addTimeEntry.mutateAsync({
			employee: selectedPayroll.employee,
			clock_in: values.clock_in,
			clock_out: values.clock_out,
			unpaid_break_minutes: values.unpaid_break_minutes || 0,
			approved: values.approved || true,
			source: values.source,
			notes: values.notes || "",
		});

		await refetchEntries();
		await refetchWeeklyList();
		closeAddSheet();
	};

	const handleRecompute = async () => {
		if (!selectedId) return;

		await recomputeMutation.mutateAsync({
			include_unapproved: false,
		});

		await refetchWeeklyList();
	};

	const {
		entityState,
		openEntity: openAddSheet,
		closeEntity: closeAddSheet,
	} = useEntitySheet<AddEntryFormValues>();

	return (
		<Wrapper>
			<PageHeader
				icon={Clock}
				title="Payroll & Attendance"
				description="Manage weekly payroll summaries, track employee attendance, and review time entries for accurate payroll processing."
				variant="default"
				theme="default"
				breadcrumbs={["Dashboard", "Payroll", "Attendance"]}
				isAdminOnly={!isAdmin}
				onRefresh={refetchWeeklyList}
				actionButton={
					isAdmin && (
						<Button onClick={() => openAddSheet()}>
							<Plus className="size-4 mr-1" />
							Add Holiday
						</Button>
					)
				}
			/>

			{/* Weekly Payrolls DataTable */}
			<DataTable
				title="Weekly Payroll Summary"
				description="Review and manage weekly payroll records for all employees"
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
				withoutDateRangeFilter
			/>

			{/* Selected Payroll Detail */}
			{selectedId && (
				<div className="space-y-6">
					<div className="flex items-center justify-between">
						<div className="space-y-1">
							<h2 className="text-xl font-semibold flex items-center gap-2">
								<Eye className="size-5" />
								Payroll Details
							</h2>
							<p className="text-sm text-muted-foreground">
								Detailed view of selected weekly payroll record
							</p>
						</div>
						<div className="flex items-center gap-2">
							<Button
								variant="outline"
								onClick={handleRecompute}
								disabled={
									recomputeMutation.isPending ||
									loadingSelected
								}
							>
								<Calculator className="size-4 mr-2" />
								{recomputeMutation.isPending
									? "Recomputing..."
									: "Recompute"}
							</Button>
							<Button
								variant="ghost"
								onClick={() => setSelectedId(null)}
							>
								Close
							</Button>
						</div>
					</div>

					{loadingSelected ? (
						<Card>
							<CardContent className="flex items-center justify-center py-8">
								<div className="flex items-center gap-2">
									<RefreshCw className="size-4 animate-spin" />
									Loading payroll details...
								</div>
							</CardContent>
						</Card>
					) : selectedPayroll ? (
						<div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
							{/* Summary Card */}
							<Card>
								<CardHeader>
									<CardTitle className="text-base">
										Employee Summary
									</CardTitle>
								</CardHeader>
								<CardContent className="space-y-3">
									<div>
										<label className="text-sm font-medium text-muted-foreground">
											Employee ID
										</label>
										<p className="text-base font-medium">
											#{selectedPayroll.employee}
										</p>
									</div>
									<div>
										<label className="text-sm font-medium text-muted-foreground">
											Week Period
										</label>
										<p className="text-base font-medium">
											{formatDateDisplay(
												selectedPayroll.week_start,
											)}{" "}
											- {formatDateDisplay(weekEnd)}
										</p>
									</div>
									<div>
										<label className="text-sm font-medium text-muted-foreground">
											Hourly Rate
										</label>
										<p className="text-base font-medium">
											{formatCurrency(
												selectedPayroll.hourly_rate,
											)}
										</p>
									</div>
									<div>
										<label className="text-sm font-medium text-muted-foreground">
											Overtime Threshold
										</label>
										<p className="text-base font-medium">
											{Number(
												selectedPayroll.overtime_threshold ??
													0,
											).toFixed(2)}{" "}
											hours
										</p>
									</div>
									<div>
										<label className="text-sm font-medium text-muted-foreground">
											Overtime Multiplier
										</label>
										<p className="text-base font-medium">
											{Number(
												selectedPayroll.overtime_multiplier ??
													0,
											).toFixed(2)}
											x
										</p>
									</div>
								</CardContent>
							</Card>

							{/* Hours & Earnings Card */}
							<Card>
								<CardHeader>
									<CardTitle className="text-base">
										Hours & Earnings
									</CardTitle>
								</CardHeader>
								<CardContent className="space-y-3">
									<div>
										<label className="text-sm font-medium text-muted-foreground">
											Regular Hours
										</label>
										<p className="text-base font-medium">
											{formatHours(
												selectedPayroll.regular_hours,
											)}
										</p>
									</div>
									<div>
										<label className="text-sm font-medium text-muted-foreground">
											Overtime Hours
										</label>
										<p className="text-base font-medium">
											{formatHours(
												selectedPayroll.overtime_hours,
											)}
										</p>
									</div>
									<div>
										<label className="text-sm font-medium text-muted-foreground">
											Allowances
										</label>
										<p className="text-base font-medium">
											{formatCurrency(
												selectedPayroll.allowances,
											)}
										</p>
									</div>
									<div>
										<label className="text-sm font-medium text-muted-foreground">
											Additional Earnings
										</label>
										<p className="text-base font-medium">
											{formatCurrency(
												selectedPayroll.additional_earnings_total,
											)}
										</p>
									</div>
									<Separator />
									<div>
										<label className="text-sm font-medium text-muted-foreground">
											Gross Pay
										</label>
										<p className="text-lg font-semibold text-green-600 dark:text-green-400">
											{formatCurrency(
												selectedPayroll.gross_pay,
											)}
										</p>
									</div>
								</CardContent>
							</Card>

							{/* Deductions & Net Pay Card */}
							<Card>
								<CardHeader>
									<CardTitle className="text-base">
										Deductions & Net Pay
									</CardTitle>
								</CardHeader>
								<CardContent className="space-y-3">
									{Object.entries(
										selectedPayroll.deductions ?? {},
									).map(([name, amt]) => (
										<div
											key={name}
											className="flex justify-between items-center"
										>
											<label className="text-sm font-medium text-muted-foreground">
												{name}
											</label>
											<p className="text-base font-medium text-red-600 dark:text-red-400">
												-{" "}
												{formatCurrency(
													Number(
														amt as number | string,
													),
												)}
											</p>
										</div>
									))}
									<Separator />
									<div className="flex justify-between items-center">
										<label className="text-sm font-medium text-muted-foreground">
											Total Deductions
										</label>
										<p className="text-base font-medium text-red-600 dark:text-red-400">
											-{" "}
											{formatCurrency(
												selectedPayroll.total_deductions,
											)}
										</p>
									</div>
									<Separator />
									<div className="flex justify-between items-center">
										<label className="text-sm font-semibold">
											Net Pay
										</label>
										<p className="text-lg font-bold text-blue-600 dark:text-blue-400">
											{formatCurrency(
												selectedPayroll.net_pay,
											)}
										</p>
									</div>
								</CardContent>
							</Card>
						</div>
					) : (
						<Card>
							<CardContent className="flex items-center justify-center py-8">
								<p className="text-muted-foreground">
									Select a payroll record above to view
									details.
								</p>
							</CardContent>
						</Card>
					)}

					{/* Time Entries Section */}
					{selectedPayroll && (
						<Card>
							<CardHeader>
								<div className="flex items-center justify-between">
									<div>
										<CardTitle className="flex items-center gap-2">
											<Calendar className="size-5" />
											Time Entries
										</CardTitle>
										<CardDescription>
											Manage individual time entries for
											Employee #{selectedPayroll.employee}
										</CardDescription>
									</div>
									{isAdmin && (
										<Button
											onClick={() => openAddSheet()}
											size="sm"
										>
											<Plus className="size-4 mr-2" />
											Add Entry
										</Button>
									)}
								</div>
							</CardHeader>
							<CardContent>
								<div className="space-y-4">
									<div className="text-sm text-muted-foreground">
										Week range:{" "}
										{formatDateDisplay(
											selectedPayroll.week_start,
										)}{" "}
										— {formatDateDisplay(weekEnd)}
									</div>

									{loadingEntries ? (
										<div className="flex items-center justify-center py-8">
											<div className="flex items-center gap-2">
												<RefreshCw className="size-4 animate-spin" />
												Loading time entries...
											</div>
										</div>
									) : timeEntries?.results?.length ? (
										<div className="space-y-2">
											{timeEntries.results.map(
												(entry) => (
													<TimeEntryRow
														key={entry.id}
														entry={entry}
														onChanged={async () => {
															await refetchEntries();
															await refetchWeeklyList();
														}}
													/>
												),
											)}
										</div>
									) : (
										<div className="text-center py-8 text-muted-foreground">
											No time entries found for this week.
										</div>
									)}
								</div>
							</CardContent>
						</Card>
					)}
				</div>
			)}

			{/* Add Time Entry Sheet */}
			<EntitySheet
				open={entityState.open}
				onClose={closeAddSheet}
				title="Add Time Entry"
				description="Create a new time entry for the selected employee."
				withCloseConfirmation
				renderForm={({ forceClose }) => (
					<Form {...addEntryForm}>
						<form
							onSubmit={addEntryForm.handleSubmit(
								async (values) => {
									await handleCreateEntry(values);
									addEntryForm.reset();
									forceClose();
								},
							)}
							className="space-y-4"
						>
							<div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
								<FormField
									control={addEntryForm.control}
									name="clock_in"
									render={({ field }) => (
										<FormItem>
											<FormLabel>Clock In</FormLabel>
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
											<FormLabel>Clock Out</FormLabel>
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
							</div>

							<div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
								<FormField
									control={addEntryForm.control}
									name="unpaid_break_minutes"
									render={({ field }) => (
										<FormItem>
											<FormLabel>
												Unpaid Break (minutes)
											</FormLabel>
											<FormControl>
												<Input
													type="number"
													min={0}
													value={field.value}
													onChange={(e) =>
														field.onChange(
															Number(
																e.target
																	.value || 0,
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
									name="source"
									render={({ field }) => (
										<FormItem>
											<FormLabel>Source</FormLabel>
											<FormControl>
												<Select
													value={field.value}
													onValueChange={
														field.onChange
													}
												>
													<SelectTrigger>
														<SelectValue placeholder="Select source" />
													</SelectTrigger>
													<SelectContent>
														<SelectItem value="manual">
															Manual
														</SelectItem>
														<SelectItem value="schedule">
															From Schedule
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
							</div>

							<FormField
								control={addEntryForm.control}
								name="notes"
								render={({ field }) => (
									<FormItem>
										<FormLabel>Notes</FormLabel>
										<FormControl>
											<Input
												placeholder="Optional notes"
												{...field}
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
									<FormItem className="flex flex-row items-start space-x-3 space-y-0">
										<FormControl>
											<Checkbox
												checked={field.value}
												onCheckedChange={field.onChange}
											/>
										</FormControl>
										<div className="space-y-1 leading-none">
											<FormLabel>
												Mark as approved
											</FormLabel>
											<p className="text-sm text-muted-foreground">
												Approved entries are included in
												payroll calculations
											</p>
										</div>
									</FormItem>
								)}
							/>

							<div className="flex items-center gap-2 pt-4">
								<Button
									type="submit"
									disabled={addTimeEntry.isPending}
								>
									{addTimeEntry.isPending
										? "Adding..."
										: "Add Entry"}
								</Button>
								<Button
									type="button"
									variant="outline"
									onClick={() => addEntryForm.reset()}
								>
									Reset
								</Button>
							</div>
						</form>
					</Form>
				)}
			/>
		</Wrapper>
	);
}

/**
 * Time Entry Row Component
 */
function TimeEntryRow({
	entry,
	onChanged,
}: {
	entry: {
		id: number;
		clock_in: string;
		clock_out: string;
		unpaid_break_minutes: number;
		approved: boolean;
		source: string;
	};
	onChanged: () => Promise<void>;
}) {
	const { updateTimeEntry, deleteTimeEntry } = useTimeEntryMutations();

	const updateMutation = updateTimeEntry;
	const deleteMutation = deleteTimeEntry;

	const toggleApproved = async () => {
		await updateMutation.mutateAsync({
			id: entry.id,
			data: {
				approved: !entry.approved,
			},
		});
		await onChanged();
	};

	const deleteEntry = async () => {
		await deleteMutation.mutateAsync(entry.id);
		await onChanged();
	};

	return (
		<div className="flex items-center justify-between p-4 border rounded-lg">
			<div className="grid grid-cols-1 sm:grid-cols-4 gap-4 flex-1">
				<div>
					<label className="text-xs font-medium text-muted-foreground">
						Clock In
					</label>
					<p className="text-sm font-medium">
						{new Date(entry.clock_in).toLocaleString()}
					</p>
				</div>
				<div>
					<label className="text-xs font-medium text-muted-foreground">
						Clock Out
					</label>
					<p className="text-sm font-medium">
						{entry.clock_out
							? new Date(entry.clock_out).toLocaleString()
							: "Not clocked out"}
					</p>
				</div>
				<div>
					<label className="text-xs font-medium text-muted-foreground">
						Break (min)
					</label>
					<p className="text-sm font-medium">
						{entry.unpaid_break_minutes || 0}
					</p>
				</div>
				<div>
					<label className="text-xs font-medium text-muted-foreground">
						Status
					</label>
					<div className="flex items-center gap-2">
						<Badge
							variant={entry.approved ? "default" : "secondary"}
						>
							{entry.approved ? "Approved" : "Pending"}
						</Badge>
						<Badge variant="outline" className="text-xs">
							{entry.source}
						</Badge>
					</div>
				</div>
			</div>
			<div className="flex items-center gap-2">
				<Button
					variant="outline"
					size="sm"
					onClick={toggleApproved}
					disabled={updateMutation.isPending}
				>
					{entry.approved ? "Unapprove" : "Approve"}
				</Button>
				<Button
					variant="outline"
					size="sm"
					onClick={deleteEntry}
					disabled={deleteMutation.isPending}
				>
					Delete
				</Button>
			</div>
		</div>
	);
}
