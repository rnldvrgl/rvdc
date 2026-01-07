"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { useHolidays, Holiday } from "@/lib/queries/usePayroll";
import { formatDateDisplay } from "@/lib/utils/helpers";
import { usePayrollAdminMutations } from "@/lib/mutations/usePayrollAdminMutations";
import { useCurrentUser } from "@/lib/hooks/useCurrentUser";

type HolidayKind = "regular" | "special";

export default function HolidaysAdminPage() {
	const { role } = useCurrentUser();
	const isAdmin = role === "admin";

	const { data, isLoading, refetch } = useHolidays({ page: 1, limit: 100 });

	const { addHoliday, updateHoliday, deleteHoliday } =
		usePayrollAdminMutations();

	const [newHoliday, setNewHoliday] = useState<{
		date: string;
		name: string;
		kind: HolidayKind;
	}>({ date: "", name: "", kind: "regular" });

	const handleCreate = async () => {
		if (!isAdmin) return;

		if (!newHoliday.date || !newHoliday.name) return;

		await addHoliday.mutateAsync(newHoliday);

		setNewHoliday({ date: "", name: "", kind: "regular" });

		await refetch();
	};

	return (
		<div className="p-6 space-y-6">
			<header className="space-y-1">
				<div className="flex items-center justify-between">
					<h1 className="text-xl font-semibold">Holidays</h1>
					<div className="text-xs text-muted-foreground">
						Admin only
					</div>
				</div>
				<p className="text-sm text-muted-foreground">
					Manage regular and special non-working holidays. These feed
					into weekly payroll computations according to your
					configured rules.
				</p>
			</header>

			{/* Create new holiday */}
			<section className="p-4 border rounded-lg bg-card shadow-sm">
				<div className="font-medium mb-2">Add Holiday</div>
				<div className="grid grid-cols-1 md:grid-cols-4 gap-3 text-sm">
					<div>
						<label className="block mb-1">Date</label>
						<input
							type="date"
							className="w-full border rounded px-2 py-1"
							value={newHoliday.date}
							onChange={(e) =>
								setNewHoliday((h) => ({
									...h,
									date: e.target.value,
								}))
							}
							disabled={!isAdmin || addHoliday.isPending}
						/>
					</div>
					<div className="md:col-span-2">
						<label className="block mb-1">Name</label>
						<input
							type="text"
							className="w-full border rounded px-2 py-1"
							value={newHoliday.name}
							onChange={(e) =>
								setNewHoliday((h) => ({
									...h,
									name: e.target.value,
								}))
							}
							disabled={!isAdmin || addHoliday.isPending}
						/>
					</div>
					<div>
						<label className="block mb-1">Kind</label>
						<select
							className="w-full border rounded px-2 py-1"
							value={newHoliday.kind}
							onChange={(e) =>
								setNewHoliday((h) => ({
									...h,
									kind: e.target.value as HolidayKind,
								}))
							}
							disabled={!isAdmin || addHoliday.isPending}
						>
							<option value="regular">Regular Holiday</option>
							<option value="special">Special Non-Working</option>
						</select>
					</div>
				</div>
				<div className="mt-3">
					<Button
						onClick={handleCreate}
						disabled={
							!isAdmin ||
							!newHoliday.date ||
							!newHoliday.name ||
							addHoliday.isPending
						}
					>
						{addHoliday.isPending ? "Adding..." : "Add Holiday"}
					</Button>
				</div>
			</section>

			{/* Holidays list */}
			<section className="p-4 border rounded-lg bg-card shadow-sm">
				<div className="flex items-center justify-between mb-2">
					<div className="font-medium">Holiday List</div>
					<div className="flex items-center gap-2">
						<Button variant="outline" onClick={() => refetch()}>
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

	const save = async () => {
		if (!canManage) return;
		await updateMutation.mutateAsync({
			id: holiday.id,
			data: { name, kind },
		});
		onChanged?.();
	};

	const remove = async () => {
		if (!canManage) return;
		if (!confirm("Delete this holiday?")) return;
		await deleteMutation.mutateAsync(holiday.id);
		onChanged?.();
	};

	return (
		<tr className="border-b">
			<td className="py-2 pr-2">{formatDateDisplay(holiday.date)}</td>
			<td className="py-2 pr-2">
				<input
					className="w-full border rounded px-2 py-1"
					value={name}
					onChange={(e) => setName(e.target.value)}
					disabled={!canManage || busy}
				/>
			</td>
			<td className="py-2 pr-2">
				<select
					className="w-full border rounded px-2 py-1"
					value={kind}
					onChange={(e) => setKind(e.target.value as HolidayKind)}
					disabled={!canManage || busy}
				>
					<option value="regular">Regular Holiday</option>
					<option value="special">Special Non-Working</option>
				</select>
			</td>
			<td className="py-2 pr-2">
				<div className="flex items-center gap-2">
					<Button onClick={save} disabled={!canManage || busy}>
						{updateMutation.isPending ? "Saving..." : "Save"}
					</Button>

					<Button
						variant="outline"
						onClick={remove}
						disabled={!canManage || busy}
					>
						{deleteMutation.isPending ? "Deleting..." : "Delete"}
					</Button>
				</div>
			</td>
		</tr>
	);
}
