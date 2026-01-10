"use client";

import React, { useMemo, useState } from "react";

import {
	useHolidays,
	Holiday,
	useHolidayFilters,
} from "@/lib/queries/usePayroll";
import useSearchParameters from "@/lib/hooks/useSearchParameters";

import { formatDateDisplay } from "@/lib/utils/helpers";

import { usePayrollAdminMutations } from "@/lib/mutations/usePayrollAdminMutations";

import { useCurrentUser } from "@/lib/hooks/useCurrentUser";

import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useForm } from "react-hook-form";

import { Button } from "@/components/ui/button";

import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils/helpers";

import {
	Select,
	SelectTrigger,
	SelectValue,
	SelectContent,
	SelectItem,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Plus, RefreshCcw, Save, Trash2, CalendarDays } from "lucide-react";
import { useNavigation } from "@/lib/hooks/useNavigation";
import ConfirmAlert from "@/components/custom/shared/ConfirmAlert";
import { useDebounce } from "@/lib/hooks/useDebounce";
import { DataTableDateRangeFilter } from "@/components/custom/table/components/DataTableDateRangeFilter";
import { DataTableFilterDropdown } from "@/components/custom/table/components/DataTableFilterDropdown";

type HolidayKind = "regular" | "special";

const addHolidaySchema = z.object({
	date: z.string().min(1, "Date is required"),
	name: z.string().min(1, "Name is required"),
	kind: z.enum(["regular", "special"]),
});

export default function HolidaysAdminPage() {
	const { search, limit, ordering, page, filter } = useSearchParameters();
	const { isAdmin } = useCurrentUser();
	const { push } = useNavigation();
	const [localSearch, setLocalSearch] = React.useState(search || "");
	const debouncedSearch = useDebounce(localSearch, 1000);
	const { filters } = useHolidayFilters();
	React.useEffect(() => {
		if (debouncedSearch !== (search || "")) {
			push({
				page: 1,
				search: debouncedSearch || undefined,
				filter,
			});
		}
	}, [debouncedSearch, search, push, filter]);

	React.useEffect(() => {
		setLocalSearch(search || "");
	}, [search]);

	const { data, isLoading, refetch } = useHolidays({
		page: page || 1,
		limit: limit || 100,
		search,
		ordering,
		filter,
	});

	const { addHoliday, updateHoliday, deleteHoliday } =
		usePayrollAdminMutations();

	// Add holiday form
	const addForm = useForm<z.infer<typeof addHolidaySchema>>({
		resolver: zodResolver(addHolidaySchema),
		defaultValues: { date: "", name: "", kind: "regular" },
	});

	const onAddSubmit = async (values: z.infer<typeof addHolidaySchema>) => {
		if (!isAdmin) return;
		await addHoliday.mutateAsync(values);
		addForm.reset({ date: "", name: "", kind: "regular" });
		await refetch();
	};

	const handleRefresh = async () => {
		await refetch();
	};

	return (
		<div className="p-6 space-y-6">
			<header className="space-y-1">
				<div className="flex items-center justify-between">
					<h1 className="text-xl font-semibold flex items-center gap-2">
						<CalendarDays className="size-5" />
						Holidays
					</h1>

					<Badge variant="outline" className="text-xs">
						Admin only
					</Badge>
				</div>
				<p className="text-sm text-muted-foreground">
					Manage regular and special non-working holidays. These feed
					into weekly payroll computations according to your
					configured rules.
				</p>
			</header>

			<section className="p-6 border rounded-2xl bg-card shadow-sm">
				<div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-4">
					<div className="font-semibold text-lg flex items-center gap-2">
						<CalendarDays className="size-5 text-primary" />
						Holiday List
					</div>

					<div className="flex items-center gap-2">
						<Input
							value={localSearch}
							onChange={(e) => setLocalSearch(e.target.value)}
							placeholder="Search..."
							className="w-full sm:w-64 border-border focus-visible:ring-2 focus-visible:ring-primary/40"
						/>
						<DataTableFilterDropdown
							filters={filters}
							className="w-full sm:w-40 md:w-32"
						/>
						<DataTableDateRangeFilter
							defaultRangePreset="This Year"
							className="w-full sm:w-64"
						/>
						<Button
							type="button"
							variant="outline"
							onClick={handleRefresh}
							disabled={isLoading}
							className="transition-transform"
						>
							<RefreshCcw
								className={cn(
									"size-4 mr-2",
									isLoading ? "animate-spin" : "",
								)}
							/>
							Refresh
						</Button>
					</div>
				</div>

				{isLoading ? (
					<div className="text-sm">Loading...</div>
				) : data?.results?.length ? (
					<div className="overflow-x-auto">
						<table className="min-w-full text-sm">
							<thead>
								<tr className="text-left border-b">
									<th className="py-2 pr-2">Date</th>
									<th className="py-2 pr-2">Name</th>
									<th className="py-2 pr-2">Kind</th>
									<th className="py-2 pr-2">Actions</th>
								</tr>
							</thead>

							<tbody>
								{/* Inline add row */}
								<tr className="border-b">
									<td className="py-2 pr-2">
										<Input
											type="date"
											placeholder="YYYY-MM-DD"
											disabled={
												!isAdmin || addHoliday.isPending
											}
											value={
												addForm.getValues("date") || ""
											}
											onChange={(e) =>
												addForm.setValue(
													"date",
													e.target.value,
													{ shouldValidate: true },
												)
											}
										/>
									</td>
									<td className="py-2 pr-2">
										<Input
											placeholder="Holiday name"
											disabled={
												!isAdmin || addHoliday.isPending
											}
											value={
												addForm.getValues("name") || ""
											}
											onChange={(e) =>
												addForm.setValue(
													"name",
													e.target.value,
													{ shouldValidate: true },
												)
											}
										/>
									</td>
									<td className="py-2 pr-2">
										<Select
											disabled={
												!isAdmin || addHoliday.isPending
											}
											value={
												addForm.getValues("kind") ||
												"regular"
											}
											onValueChange={(v) =>
												addForm.setValue(
													"kind",
													v as "regular" | "special",
													{ shouldValidate: true },
												)
											}
										>
											<SelectTrigger>
												<SelectValue placeholder="Kind" />
											</SelectTrigger>
											<SelectContent>
												<SelectItem value="regular">
													Regular Holiday
												</SelectItem>
												<SelectItem value="special">
													Special Non-Working
												</SelectItem>
											</SelectContent>
										</Select>
									</td>
									<td className="py-2 pr-2">
										<div className="flex items-center gap-2">
											<Button
												onClick={addForm.handleSubmit(
													onAddSubmit,
												)}
												disabled={
													!isAdmin ||
													addHoliday.isPending ||
													!addForm.getValues(
														"date",
													) ||
													!addForm.getValues("name")
												}
												className="inline-flex items-center gap-2"
											>
												<Plus className="size-4" />
												Add
											</Button>
										</div>
									</td>
								</tr>

								{data.results.map((h) => (
									<HolidayRow
										key={h.id}
										holiday={h}
										canManage={isAdmin}
										updateMutation={updateHoliday}
										deleteMutation={deleteHoliday}
										onChanged={refetch}
									/>
								))}
							</tbody>
						</table>
					</div>
				) : (
					<div className="text-sm text-muted-foreground">
						No holidays found. Add one above.
					</div>
				)}
			</section>
		</div>
	);
}

function HolidayRow({
	holiday,
	canManage,
	updateMutation,
	deleteMutation,
	onChanged,
}: {
	holiday: Holiday;
	canManage: boolean;
	updateMutation: ReturnType<
		typeof usePayrollAdminMutations
	>["updateHoliday"];

	deleteMutation: ReturnType<
		typeof usePayrollAdminMutations
	>["deleteHoliday"];

	onChanged?: () => void;
}) {
	const [name, setName] = useState<string>(holiday.name);
	const [kind, setKind] = useState<HolidayKind>(holiday.kind);
	const busy = updateMutation.isPending || deleteMutation.isPending;

	// Disable Save when no changes
	const isUnchanged = useMemo(
		() => name === holiday.name && kind === holiday.kind,
		[name, kind, holiday.name, holiday.kind],
	);

	const save = async () => {
		if (!canManage || isUnchanged) return;

		await updateMutation.mutateAsync({
			id: holiday.id,
			data: { name, kind },
		});
		onChanged?.();
	};

	const remove = async () => {
		if (!canManage) return;
		await deleteMutation.mutateAsync(holiday.id);
		onChanged?.();
	};

	return (
		<tr className="border-b">
			<td className="py-2 pr-2">{formatDateDisplay(holiday.date)}</td>
			<td className="py-2 pr-2">
				<Input
					value={name}
					onChange={(e) => setName(e.target.value)}
					disabled={!canManage || busy}
				/>
			</td>

			<td className="py-2 pr-2">
				<Select
					value={kind}
					onValueChange={(v) => setKind(v as HolidayKind)}
					disabled={!canManage || busy}
				>
					<SelectTrigger>
						<SelectValue placeholder="Kind" />
					</SelectTrigger>
					<SelectContent>
						<SelectItem value="regular">Regular Holiday</SelectItem>
						<SelectItem value="special">
							Special Non-Working
						</SelectItem>
					</SelectContent>
				</Select>
			</td>
			<td className="py-2 pr-2">
				<div className="flex items-center gap-2">
					<Button
						onClick={save}
						variant={isUnchanged ? "outline" : "default"}
						disabled={!canManage || busy || isUnchanged}
						className="inline-flex items-center gap-2"
					>
						<Save className="size-4" />
						{updateMutation.isPending ? "Saving..." : "Save"}
					</Button>

					<div className="inline-flex items-center">
						<ConfirmAlert
							trigger={
								<Button
									variant="outline"
									disabled={!canManage || busy}
									className="inline-flex items-center gap-2"
								>
									<Trash2 className="size-4" />
									{deleteMutation.isPending
										? "Deleting..."
										: "Delete"}
								</Button>
							}
							title="Delete this holiday?"
							description="This action cannot be undone."
							confirmText="Delete"
							confirmVariant="destructive"
							isConfirming={deleteMutation.isPending}
							onConfirm={remove}
						/>
					</div>
				</div>
			</td>
		</tr>
	);
}
