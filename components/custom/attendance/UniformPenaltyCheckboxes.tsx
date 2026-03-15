"use client";

import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { DailyAttendance } from "@/lib/constants/types";
import { useAttendanceMutations } from "@/lib/mutations/useAttendanceMutations";
import { Loader2, ShirtIcon } from "lucide-react";
import { useEffect, useState } from "react";

type UniformPenaltyCheckboxesProps = {
	attendance: DailyAttendance;
	onUpdate?: () => void;
};

export function UniformPenaltyCheckboxes({
	attendance,
	onUpdate,
}: UniformPenaltyCheckboxesProps) {
	const { updateUniformPenalties } = useAttendanceMutations();

	const [missingShirt, setMissingShirt] = useState(
		attendance.missing_uniform_shirt,
	);
	const [missingPants, setMissingPants] = useState(
		attendance.missing_uniform_pants,
	);
	const [missingShoes, setMissingShoes] = useState(
		attendance.missing_uniform_shoes,
	);

	// Sync state with prop changes
	useEffect(() => {
		setMissingShirt(attendance.missing_uniform_shirt);
		setMissingPants(attendance.missing_uniform_pants);
		setMissingShoes(attendance.missing_uniform_shoes);
	}, [
		attendance.missing_uniform_shirt,
		attendance.missing_uniform_pants,
		attendance.missing_uniform_shoes,
	]);

	const handleUpdate = async (
		field: "shirt" | "pants" | "shoes",
		checked: boolean,
	) => {
		const updates = {
			missing_uniform_shirt: field === "shirt" ? checked : missingShirt,
			missing_uniform_pants: field === "pants" ? checked : missingPants,
			missing_uniform_shoes: field === "shoes" ? checked : missingShoes,
		};

		// Update local state immediately for better UX
		if (field === "shirt") setMissingShirt(checked);
		if (field === "pants") setMissingPants(checked);
		if (field === "shoes") setMissingShoes(checked);

		// Update backend
		try {
			await updateUniformPenalties.mutateAsync({
				id: attendance.id,
				data: updates,
			});
			onUpdate?.();
		} catch {
			// Revert on error
			if (field === "shirt") setMissingShirt(!checked);
			if (field === "pants") setMissingPants(!checked);
			if (field === "shoes") setMissingShoes(!checked);
		}
	};

	const isUpdating = updateUniformPenalties.isPending;
	const totalPenalty =
		(missingShirt ? 50 : 0) +
		(missingPants ? 50 : 0) +
		(missingShoes ? 50 : 0);

	return (
		<div className="space-y-3 p-3 rounded-lg border bg-muted/30">
			<div className="flex items-center gap-2 text-sm font-medium">
				<ShirtIcon className="h-4 w-4" />
				Uniform Penalties
				{isUpdating && (
					<Loader2 className="h-3 w-3 animate-spin ml-auto" />
				)}
			</div>

			<div className="space-y-2">
				<div className="flex items-center space-x-2">
					<Checkbox
						id={`shirt-${attendance.id}`}
						checked={missingShirt}
						onCheckedChange={(checked) =>
							handleUpdate("shirt", checked as boolean)
						}
						disabled={isUpdating}
					/>
					<Label
						htmlFor={`shirt-${attendance.id}`}
						className="text-sm cursor-pointer"
					>
						Missing Shirt (₱50)
					</Label>
				</div>

				<div className="flex items-center space-x-2">
					<Checkbox
						id={`pants-${attendance.id}`}
						checked={missingPants}
						onCheckedChange={(checked) =>
							handleUpdate("pants", checked as boolean)
						}
						disabled={isUpdating}
					/>
					<Label
						htmlFor={`pants-${attendance.id}`}
						className="text-sm cursor-pointer"
					>
						Missing Pants (₱50)
					</Label>
				</div>

				<div className="flex items-center space-x-2">
					<Checkbox
						id={`shoes-${attendance.id}`}
						checked={missingShoes}
						onCheckedChange={(checked) =>
							handleUpdate("shoes", checked as boolean)
						}
						disabled={isUpdating}
					/>
					<Label
						htmlFor={`shoes-${attendance.id}`}
						className="text-sm cursor-pointer"
					>
						Missing Shoes (₱50)
					</Label>
				</div>
			</div>

			{totalPenalty > 0 && (
				<div className="pt-2 border-t text-sm font-semibold text-destructive">
					Total Penalty: ₱{totalPenalty}
				</div>
			)}
		</div>
	);
}
