"use client";

import React, { useMemo, useState } from "react";

import {
	useHolidays,
	Holiday,
	useHolidayFilters,
} from "@/lib/queries/usePayroll";
import useSearchParameters from "@/lib/hooks/useSearchParameters";

import { usePayrollAdminMutations } from "@/lib/mutations/usePayrollAdminMutations";

import { useCurrentUser } from "@/lib/hooks/useCurrentUser";

import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useForm } from "react-hook-form";

import { Button } from "@/components/ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
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
import {
	Plus,
	RefreshCcw,
	Save,
	Trash2,
	CalendarDays,
	Upload,
	Search,
} from "lucide-react";
import { useNavigation } from "@/lib/hooks/useNavigation";
import ConfirmAlert from "@/components/custom/shared/ConfirmAlert";
import { useDebounce } from "@/lib/hooks/useDebounce";
import { DataTableDateRangeFilter } from "@/components/custom/table/components/DataTableDateRangeFilter";
import { DataTableFilterDropdown } from "@/components/custom/table/components/DataTableFilterDropdown";
import { Separator } from "@/components/ui/separator";

type HolidayKind = "regular" | "special_non_working";

const addHolidaySchema = z.object({
	date: z.string().min(1, "Date is required"),
	name: z.string().min(1, "Name is required"),
	kind: z.enum(["regular", "special_non_working"]),
});

export default function HolidaysAdminPage() {
	const { search, limit, ordering, page, filter } = useSearchParameters();
	const { isAdmin } = useCurrentUser();
	const { push } = useNavigation();
	const [localSearch, setLocalSearch] = React.useState(search || "");
	const debouncedSearch = useDebounce(localSearch, 1000);
	const { filters } = useHolidayFilters();

	// CSV upload state
	const [csvFile, setCsvFile] = React.useState<File | null>(null);

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
		ordering,
		search: debouncedSearch,
		filter,
	});

	const { addHoliday, updateHoliday, deleteHoliday, uploadHolidaysCsv } =
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

	const handleUploadCsv = async () => {
		if (!isAdmin || !csvFile) return;
		await uploadHolidaysCsv.mutateAsync(csvFile);
		setCsvFile(null);
		await refetch();
	};

	return (
		<div className="container max-w-7xl mx-auto p-6 space-y-8">
			{/* Header */}
			<div className="flex items-start justify-between">
				<div className="space-y-1">
					<div className="flex items-center gap-3">
						<div className="p-2 bg-primary/10 rounded-lg">
							<CalendarDays className="size-6 text-primary" />
						</div>
						<div>
							<h1 className="text-3xl font-bold tracking-tight">
								Holidays
							</h1>
							<p className="text-muted-foreground mt-1">
								Manage regular and special non-working holidays
								for payroll
							</p>
						</div>
					</div>
				</div>
				<Badge variant="secondary" className="text-xs font-medium">
					Admin Access
				</Badge>
			</div>

			{/* Add New Holiday Card */}
			<Card className="border-dashed border-2">
				<CardHeader>
					<CardTitle className="text-lg flex items-center gap-2">
						<Plus className="size-5" />
						Add New Holiday
					</CardTitle>
					<CardDescription>
						Create a new holiday entry for payroll calculations
					</CardDescription>
				</CardHeader>
				<CardContent>
					<div className="grid grid-cols-1 md:grid-cols-4 gap-4">
						<div className="space-y-2">
							<label className="text-sm font-medium">Date</label>
							<Input
								type="date"
								placeholder="YYYY-MM-DD"
								disabled={!isAdmin || addHoliday.isPending}
								value={addForm.getValues("date") || ""}
								onChange={(e) =>
									addForm.setValue("date", e.target.value, {
										shouldValidate: true,
									})
								}
							/>
						</div>
						<div className="space-y-2">
							<label className="text-sm font-medium">Name</label>
							<Input
								placeholder="Holiday name"
								disabled={!isAdmin || addHoliday.isPending}
								value={addForm.getValues("name") || ""}
								onChange={(e) =>
									addForm.setValue("name", e.target.value, {
										shouldValidate: true,
									})
								}
							/>
						</div>
						<div className="space-y-2">
							<label className="text-sm font-medium">Type</label>
							<Select
								disabled={!isAdmin || addHoliday.isPending}
								value={addForm.getValues("kind") || "regular"}
								onValueChange={(v) =>
									addForm.setValue(
										"kind",
										v as "regular" | "special_non_working",
										{ shouldValidate: true },
									)
								}
							>
								<SelectTrigger>
									<SelectValue placeholder="Select type" />
								</SelectTrigger>
								<SelectContent>
									<SelectItem value="regular">
										Regular Holiday
									</SelectItem>
									<SelectItem value="special_non_working">
										Special Non-Working
									</SelectItem>
								</SelectContent>
							</Select>
						</div>
						<div className="space-y-2">
							<label className="text-sm font-medium opacity-0">
								Action
							</label>
							<Button
								onClick={addForm.handleSubmit(onAddSubmit)}
								disabled={
									!isAdmin ||
									addHoliday.isPending ||
									!addForm.getValues("date") ||
									!addForm.getValues("name")
								}
								className="w-full"
							>
								<Plus className="size-4 mr-2" />
								Add Holiday
							</Button>
						</div>
					</div>
				</CardContent>
			</Card>

			{/* Filters & Actions Card */}
			<Card>
				<CardContent className="pt-6">
					<div className="flex flex-col lg:flex-row gap-4">
						{/* Left side - Search and Filters */}
						<div className="flex-1 flex flex-wrap gap-3">
							<div className="relative flex-1 min-w-[200px]">
								<Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
								<Input
									value={localSearch}
									onChange={(e) =>
										setLocalSearch(e.target.value)
									}
									placeholder="Search holidays..."
									className="pl-9"
								/>
							</div>
							<DataTableFilterDropdown
								filters={filters}
								className="w-[160px]"
							/>
							<DataTableDateRangeFilter className="w-[280px]" />
						</div>

						{/* Right side - Actions */}
						<div className="flex gap-2">
							<Button
								type="button"
								variant="outline"
								onClick={handleRefresh}
								disabled={isLoading}
								size="default"
							>
								<RefreshCcw
									className={cn(
										"size-4 mr-2",
										isLoading && "animate-spin",
									)}
								/>
								Refresh
							</Button>

							<div className="flex items-center gap-2">
								<Input
									type="file"
									accept=".csv,text/csv"
									disabled={
										!isAdmin || uploadHolidaysCsv.isPending
									}
									onChange={(e) =>
										setCsvFile(e.target.files?.[0] || null)
									}
									className="w-[180px]"
								/>
								<Button
									type="button"
									onClick={handleUploadCsv}
									disabled={
										!isAdmin ||
										uploadHolidaysCsv.isPending ||
										!csvFile
									}
								>
									<Upload className="size-4 mr-2" />
									{uploadHolidaysCsv.isPending
										? "Uploading..."
										: "Upload CSV"}
								</Button>
							</div>
						</div>
					</div>
				</CardContent>
			</Card>

			{/* Holidays List Card */}
			<Card>
				<CardHeader>
					<div className="flex items-center justify-between">
						<div>
							<CardTitle>Holiday List</CardTitle>
							<CardDescription>
								{data?.results?.length || 0} holidays in total
							</CardDescription>
						</div>
					</div>
				</CardHeader>
				<CardContent>
					{isLoading ? (
						<div className="flex items-center justify-center py-12">
							<div className="text-center space-y-3">
								<RefreshCcw className="size-8 animate-spin text-muted-foreground mx-auto" />
								<p className="text-sm text-muted-foreground">
									Loading holidays...
								</p>
							</div>
						</div>
					) : data?.results?.length ? (
						<div className="space-y-3">
							{data.results.map((h, index) => (
								<React.Fragment key={h.id}>
									{index > 0 && <Separator />}
									<HolidayRow
										holiday={h}
										canManage={isAdmin}
										updateMutation={updateHoliday}
										deleteMutation={deleteHoliday}
										onChanged={refetch}
									/>
								</React.Fragment>
							))}
						</div>
					) : (
						<div className="flex flex-col items-center justify-center py-12 text-center">
							<CalendarDays className="size-12 text-muted-foreground/50 mb-4" />
							<h3 className="font-semibold text-lg mb-1">
								No holidays found
							</h3>
							<p className="text-sm text-muted-foreground">
								Add your first holiday using the form above
							</p>
						</div>
					)}
				</CardContent>
			</Card>
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
		<div className="flex flex-col md:flex-row md:items-center gap-4 p-4 rounded-lg hover:bg-accent/50 transition-colors">
			<div className="flex items-center gap-4 flex-1 min-w-0">
				<div className="flex flex-col items-center justify-center bg-primary/10 rounded-lg p-3 min-w-[80px]">
					<span className="text-2xl font-bold text-primary">
						{new Date(holiday.date).getDate()}
					</span>
					<span className="text-xs text-muted-foreground uppercase">
						{new Date(holiday.date).toLocaleString("default", {
							month: "short",
						})}
					</span>
				</div>

				<div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-3 min-w-0">
					<div className="space-y-1.5">
						<label className="text-xs font-medium text-muted-foreground">
							Holiday Name
						</label>
						<Input
							value={name}
							onChange={(e) => setName(e.target.value)}
							disabled={!canManage || busy}
							className="h-9"
						/>
					</div>

					<div className="space-y-1.5">
						<label className="text-xs font-medium text-muted-foreground">
							Type
						</label>
						<Select
							value={kind}
							onValueChange={(v) => setKind(v as HolidayKind)}
							disabled={!canManage || busy}
						>
							<SelectTrigger className="h-9">
								<SelectValue />
							</SelectTrigger>
							<SelectContent>
								<SelectItem value="regular">
									<div className="flex items-center gap-2">
										<div className="size-2 rounded-full bg-blue-500" />
										Regular Holiday
									</div>
								</SelectItem>
								<SelectItem value="special_non_working">
									<div className="flex items-center gap-2">
										<div className="size-2 rounded-full bg-amber-500" />
										Special Non-Working
									</div>
								</SelectItem>
							</SelectContent>
						</Select>
					</div>
				</div>
			</div>

			<div className="flex items-center gap-2 md:ml-auto">
				<Button
					onClick={save}
					variant={isUnchanged ? "outline" : "default"}
					disabled={!canManage || busy || isUnchanged}
					size="sm"
				>
					<Save className="size-4 mr-2" />
					{updateMutation.isPending ? "Saving..." : "Save"}
				</Button>

				<ConfirmAlert
					trigger={
						<Button
							variant="destructive"
							disabled={!canManage || busy}
							size="sm"
						>
							<Trash2 className="size-4 mr-2" />
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
	);
}
