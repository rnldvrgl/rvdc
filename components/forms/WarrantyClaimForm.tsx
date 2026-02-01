"use client";

import { ComboBox } from "@/components/custom/inputs/ComboBox";
import DatePicker from "@/components/custom/inputs/DatePicker";
import { Button } from "@/components/ui/button";
import {
	Form,
	FormControl,
	FormDescription,
	FormField,
	FormItem,
	FormLabel,
	FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
	WarrantyClaim,
	WarrantyClaimPayload,
	ClaimType,
	ClaimStatus,
} from "@/lib/constants/interface";
import { useWarrantyClaimMutations } from "@/lib/mutations/installations/useWarrantyClaimMutations";
import { useAirconUnits } from "@/lib/queries/useAircons";
import { zodResolver } from "@hookform/resolvers/zod";
import { Save } from "lucide-react";
import { useEffect } from "react";
import { useForm } from "react-hook-form";
import * as z from "zod";

const claimTypeOptions = [
	{ label: "Repair", value: "repair" },
	{ label: "Replacement", value: "replacement" },
	{ label: "Parts Replacement", value: "parts" },
	{ label: "Inspection", value: "inspection" },
];

const claimStatusOptions = [
	{ label: "Pending", value: "pending" },
	{ label: "Approved", value: "approved" },
	{ label: "Rejected", value: "rejected" },
	{ label: "In Progress", value: "in_progress" },
	{ label: "Completed", value: "completed" },
	{ label: "Cancelled", value: "cancelled" },
];

const warrantyClaimSchema = z.object({
	unit: z.number({ required_error: "Aircon unit is required" }),
	claim_type: z.enum(["repair", "replacement", "parts", "inspection"], {
		required_error: "Claim type is required",
	}),
	status: z
		.enum([
			"pending",
			"approved",
			"rejected",
			"in_progress",
			"completed",
			"cancelled",
		])
		.optional(),
	issue_description: z
		.string()
		.min(10, "Please provide a detailed description (at least 10 characters)"),
	customer_notes: z.string().optional(),
	technician_assessment: z.string().optional(),
	is_valid_claim: z.boolean().default(true),
	rejection_reason: z.string().optional(),
	estimated_cost: z.number().min(0).optional(),
	actual_cost: z.number().min(0).optional(),
	claim_date: z.string().optional(),
	completed_at: z.string().optional(),
});

type FormValues = z.infer<typeof warrantyClaimSchema>;

interface WarrantyClaimFormProps {
	initialData?: WarrantyClaim;
	onClose: () => void;
}

export default function WarrantyClaimForm({
	initialData,
	onClose,
}: WarrantyClaimFormProps) {
	const { addWarrantyClaim, updateWarrantyClaim } = useWarrantyClaimMutations();

	const form = useForm<FormValues>({
		resolver: zodResolver(warrantyClaimSchema),
		defaultValues: {
			unit: initialData?.unit?.id ?? undefined,
			claim_type: (initialData?.claim_type as ClaimType) ?? "repair",
			status: (initialData?.status as ClaimStatus) ?? "pending",
			issue_description: initialData?.issue_description ?? "",
			customer_notes: initialData?.customer_notes ?? "",
			technician_assessment: initialData?.technician_assessment ?? "",
			is_valid_claim: initialData?.is_valid_claim ?? true,
			rejection_reason: initialData?.rejection_reason ?? "",
			estimated_cost: initialData?.estimated_cost
				? Number(initialData.estimated_cost)
				: 0,
			actual_cost: initialData?.actual_cost
				? Number(initialData.actual_cost)
				: 0,
			claim_date: initialData?.claim_date ?? undefined,
			completed_at: initialData?.completed_at ?? undefined,
		},
		mode: "onChange",
	});

	// Fetch aircon units for selection
	const { data: unitsData } = useAirconUnits({
		filters: { is_sold: "true" }, // Only show sold units
	});

	const onSubmit = (data: FormValues) => {
		const payload: WarrantyClaimPayload = {
			unit: data.unit,
			claim_type: data.claim_type,
			status: data.status,
			issue_description: data.issue_description,
			customer_notes: data.customer_notes,
			technician_assessment: data.technician_assessment,
			is_valid_claim: data.is_valid_claim,
			rejection_reason: data.rejection_reason,
			estimated_cost: data.estimated_cost,
			actual_cost: data.actual_cost,
			claim_date: data.claim_date,
			completed_at: data.completed_at,
		};

		if (initialData) {
			updateWarrantyClaim.mutate(
				{ id: initialData.id, data: payload },
				{
					onSuccess: () => {
						onClose();
					},
				},
			);
		} else {
			addWarrantyClaim.mutate(payload, {
				onSuccess: () => {
					onClose();
				},
			});
		}
	};

	const isSubmitting =
		addWarrantyClaim.status === "pending" ||
		updateWarrantyClaim.status === "pending";

	const watchedUnit = form.watch("unit");
	const selectedUnit = unitsData?.results?.find((u) => u.id === watchedUnit);

	return (
		<Form {...form}>
			<form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
				{/* Aircon Unit Selection */}
				<FormField
					name="unit"
					control={form.control}
					render={({ field }) => (
						<FormItem>
							<FormLabel required>Aircon Unit</FormLabel>
							<ComboBox
								options={
									unitsData?.results?.map((unit) => ({
										value: unit.id,
										label: `${unit.serial_number} - ${unit.model?.brand?.name} ${unit.model?.name}`,
									})) ?? []
								}
								value={field.value ?? null}
								onChange={field.onChange}
								placeholder="Select aircon unit"
								disabled={isSubmitting || !!initialData}
							/>
							<FormDescription>
								Only sold units under warranty can be selected
							</FormDescription>
							<FormMessage />
						</FormItem>
					)}
				/>

				{/* Show warranty info if unit selected */}
				{selectedUnit && (
					<div className="rounded-lg border bg-muted/50 p-3 space-y-1">
						<p className="text-sm font-medium">Warranty Information</p>
						<p className="text-xs text-muted-foreground">
							Status: {selectedUnit.warranty_status}
						</p>
						{selectedUnit.warranty_days_left !== undefined && (
							<p className="text-xs text-muted-foreground">
								Days Remaining: {selectedUnit.warranty_days_left} days
							</p>
						)}
					</div>
				)}

				{/* Claim Type & Status */}
				<div className="grid grid-cols-2 gap-4">
					<FormField
						name="claim_type"
						control={form.control}
						render={({ field }) => (
							<FormItem>
								<FormLabel required>Claim Type</FormLabel>
								<ComboBox
									options={claimTypeOptions}
									value={field.value ?? null}
									onChange={field.onChange}
									placeholder="Select type"
									disabled={isSubmitting}
								/>
								<FormMessage />
							</FormItem>
						)}
					/>

					{initialData && (
						<FormField
							name="status"
							control={form.control}
							render={({ field }) => (
								<FormItem>
									<FormLabel>Status</FormLabel>
									<ComboBox
										options={claimStatusOptions}
										value={field.value ?? null}
										onChange={field.onChange}
										placeholder="Select status"
										disabled={isSubmitting}
									/>
									<FormMessage />
								</FormItem>
							)}
						/>
					)}
				</div>

				{/* Issue Description */}
				<FormField
					name="issue_description"
					control={form.control}
					render={({ field }) => (
						<FormItem>
							<FormLabel required>Issue Description</FormLabel>
							<FormControl>
								<Textarea
									{...field}
									placeholder="Describe the issue or defect in detail"
									disabled={isSubmitting}
									rows={4}
								/>
							</FormControl>
							<FormDescription>
								Provide a detailed description of the problem
							</FormDescription>
							<FormMessage />
						</FormItem>
					)}
				/>

				{/* Customer Notes */}
				<FormField
					name="customer_notes"
					control={form.control}
					render={({ field }) => (
						<FormItem>
							<FormLabel>Customer Notes</FormLabel>
							<FormControl>
								<Textarea
									{...field}
									placeholder="Additional notes from customer"
									disabled={isSubmitting}
									rows={2}
								/>
							</FormControl>
							<FormMessage />
						</FormItem>
					)}
				/>

				{/* Technician Assessment */}
				<FormField
					name="technician_assessment"
					control={form.control}
					render={({ field }) => (
						<FormItem>
							<FormLabel>Technician Assessment</FormLabel>
							<FormControl>
								<Textarea
									{...field}
									placeholder="Technician's assessment of the issue"
									disabled={isSubmitting}
									rows={3}
								/>
							</FormControl>
							<FormMessage />
						</FormItem>
					)}
				/>

				{/* Valid Claim Toggle */}
				<FormField
					name="is_valid_claim"
					control={form.control}
					render={({ field }) => (
						<FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">
							<div className="space-y-0.5">
								<FormLabel>Valid Claim</FormLabel>
								<FormDescription>
									Is this a valid warranty claim?
								</FormDescription>
							</div>
							<FormControl>
								<Switch
									checked={field.value}
									onCheckedChange={field.onChange}
									disabled={isSubmitting}
								/>
							</FormControl>
						</FormItem>
					)}
				/>

				{/* Rejection Reason (if applicable) */}
				{form.watch("status") === "rejected" && (
					<FormField
						name="rejection_reason"
						control={form.control}
						render={({ field }) => (
							<FormItem>
								<FormLabel required>Rejection Reason</FormLabel>
								<FormControl>
									<Textarea
										{...field}
										placeholder="Explain why the claim is being rejected"
										disabled={isSubmitting}
										rows={2}
									/>
								</FormControl>
								<FormMessage />
							</FormItem>
						)}
					/>
				)}

				{/* Cost Tracking */}
				<div className="grid grid-cols-2 gap-4">
					<FormField
						name="estimated_cost"
						control={form.control}
						render={({ field }) => (
							<FormItem>
								<FormLabel>Estimated Cost</FormLabel>
								<FormControl>
									<Input
										{...field}
										type="number"
										step="0.01"
										placeholder="0.00"
										onChange={(e) =>
											field.onChange(Number(e.target.value))
										}
										disabled={isSubmitting}
									/>
								</FormControl>
								<FormMessage />
							</FormItem>
						)}
					/>

					<FormField
						name="actual_cost"
						control={form.control}
						render={({ field }) => (
							<FormItem>
								<FormLabel>Actual Cost</FormLabel>
								<FormControl>
									<Input
										{...field}
										type="number"
										step="0.01"
										placeholder="0.00"
										onChange={(e) =>
											field.onChange(Number(e.target.value))
										}
										disabled={isSubmitting}
									/>
								</FormControl>
								<FormMessage />
							</FormItem>
						)}
					/>
				</div>

				{/* Date Fields */}
				{initialData && (
					<div className="grid grid-cols-2 gap-4">
						<FormField
							name="claim_date"
							control={form.control}
							render={({ field }) => (
								<FormItem>
									<FormLabel>Claim Date</FormLabel>
									<DatePicker field={field} disabled={isSubmitting} />
									<FormMessage />
								</FormItem>
							)}
						/>

						{form.watch("status") === "completed" && (
							<FormField
								name="completed_at"
								control={form.control}
								render={({ field }) => (
									<FormItem>
										<FormLabel>Completed At</FormLabel>
										<DatePicker
											field={field}
											disabled={isSubmitting}
										/>
										<FormMessage />
									</FormItem>
								)}
							/>
						)}
					</div>
				)}

				<Button
					type="submit"
					disabled={!form.formState.isDirty || isSubmitting}
					className="w-full"
				>
					<Save className="mr-2 h-4 w-4" />
					{initialData ? "Update Claim" : "Submit Claim"}
				</Button>
			</form>
		</Form>
	);
}
