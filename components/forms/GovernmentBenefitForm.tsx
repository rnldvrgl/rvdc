"use client";

import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import {
	Form,
	FormControl,
	FormDescription,
	FormField,
	FormItem,
	FormLabel,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import {
	useCreateGovernmentBenefit,
	useUpdateGovernmentBenefit,
} from "@/lib/mutations/useGovernmentBenefitMutations";
import type { GovernmentBenefit } from "@/lib/schemas/governmentBenefitSchema";
import { governmentBenefitSchema } from "@/lib/schemas/governmentBenefitSchema";
import { zodResolver } from "@hookform/resolvers/zod";
import { format } from "date-fns";
import { Info, Loader2 } from "lucide-react";
import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import DatePicker from "../custom/inputs/DatePicker";
import { formatDateToYMD } from "@/lib/utils/helpers";

type GovernmentBenefitFormData = z.infer<typeof governmentBenefitSchema>;

interface GovernmentBenefitFormProps {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	benefit?: GovernmentBenefit | null;
}

export function GovernmentBenefitForm({
	open,
	onOpenChange,
	benefit,
}: GovernmentBenefitFormProps) {
	const createMutation = useCreateGovernmentBenefit();
	const updateMutation = useUpdateGovernmentBenefit();
	const isEditing = !!benefit;

	const form = useForm<GovernmentBenefitFormData>({
		resolver: zodResolver(governmentBenefitSchema),
		defaultValues: {
			benefit_type: "sss",
			name: "",
			calculation_method: "percentage",
			period_type: "monthly",
			employee_share_amount: null,
			employer_share_amount: null,
			employee_share_rate: null,
			employer_share_rate: null,
			effective_start: new Date(format(new Date(), "yyyy-MM-dd")),
			effective_end: undefined,
			is_active: true,
			description: "",
		},
		mode: "onChange",
	});

	useEffect(() => {
		if (benefit) {
			form.reset({
				benefit_type: benefit.benefit_type,
				name: benefit.name,
				calculation_method: benefit.calculation_method,
				period_type: benefit.period_type || "monthly",
				employee_share_amount: benefit.employee_share_amount
					? Number(benefit.employee_share_amount)
					: null,
				employer_share_amount: benefit.employer_share_amount
					? Number(benefit.employer_share_amount)
					: null,
				employee_share_rate: benefit.employee_share_rate
					? Number(benefit.employee_share_rate)
					: null,
				employer_share_rate: benefit.employer_share_rate
					? Number(benefit.employer_share_rate)
					: null,
				effective_start: new Date(benefit.effective_start),
				effective_end: benefit?.effective_end
					? new Date(benefit.effective_end)
					: undefined,
				is_active: benefit.is_active,
				description: benefit.description || "",
			});
		} else {
			form.reset({
				benefit_type: "sss",
				name: "",
				calculation_method: "percentage",
				period_type: "monthly",
				employee_share_amount: null,
				employer_share_amount: null,
				employee_share_rate: null,
				employer_share_rate: null,
				effective_start: new Date(format(new Date(), "yyyy-MM-dd")),
				effective_end: undefined,
				is_active: true,
				description: "",
			});
		}
	}, [benefit, form]);

	const benefitType = form.watch("benefit_type");
	const calculationMethod = form.watch("calculation_method");

	// Auto-suggest name based on benefit type
	useEffect(() => {
		if (!isEditing && benefitType) {
			const names: Record<string, string> = {
				sss: "SSS Contribution",
				philhealth: "PhilHealth Contribution",
				pagibig: "Pag-IBIG Contribution",
				bir_tax: "BIR Withholding Tax",
			};
			form.setValue("name", names[benefitType]);
		}
	}, [benefitType, isEditing, form]);

	// Auto-set calculation method for BIR tax and clear opposing fields when method changes
	useEffect(() => {
		// Force progressive_tax for BIR
		if (
			benefitType === "bir_tax" &&
			calculationMethod !== "progressive_tax"
		) {
			form.setValue("calculation_method", "progressive_tax");
		}

		// Clear opposing fields when calculation method changes to prevent validation errors
		if (calculationMethod === "fixed") {
			// Clear percentage fields
			form.setValue("employee_share_rate", null);
			form.setValue("employer_share_rate", null);
		} else if (calculationMethod === "percentage") {
			// Clear fixed amount fields
			form.setValue("employee_share_amount", null);
			form.setValue("employer_share_amount", null);
		} else if (calculationMethod === "progressive_tax") {
			// Clear both fixed and percentage fields
			form.setValue("employee_share_amount", null);
			form.setValue("employer_share_amount", null);
			form.setValue("employee_share_rate", null);
			form.setValue("employer_share_rate", null);
		}
	}, [benefitType, calculationMethod, form]);

	const onSubmit = async (data: GovernmentBenefitFormData) => {
		try {
			const payload = {
				...data,
				effective_start: formatDateToYMD(data.effective_start),
				effective_end: data.effective_end
					? formatDateToYMD(data.effective_end)
					: null,
				// Convert rates to numbers (they're already in decimal form 0.045 not 4.5)
				employee_share_rate:
					calculationMethod === "percentage"
						? data.employee_share_rate
						: null,
				employer_share_rate:
					calculationMethod === "percentage"
						? data.employer_share_rate
						: null,
				employee_share_amount:
					calculationMethod === "fixed"
						? data.employee_share_amount
						: null,
				employer_share_amount:
					calculationMethod === "fixed"
						? data.employer_share_amount
						: null,
			};

			if (isEditing) {
				await updateMutation.mutateAsync({
					id: benefit.id,
					...payload,
				});
			} else {
				await createMutation.mutateAsync(payload);
			}

			form.reset();
			onOpenChange(false);
		} catch (error) {
			// Error handling is done by useApiMutation
			console.error("Failed to save benefit:", error);
		}
	};

	const getBenefitTypeInfo = () => {
		const info: Record<string, string> = {
			sss: "Social Security System - Employee and employer contributions for social insurance",
			philhealth:
				"Philippine Health Insurance - Healthcare coverage contributions",
			pagibig:
				"Home Development Mutual Fund - Housing and savings fund contributions",
			bir_tax:
				"Bureau of Internal Revenue - Withholding tax based on income brackets",
		};
		return info[benefitType] || "";
	};

	const getCalculationMethodHelp = () => {
		switch (calculationMethod) {
			case "fixed":
				return "Enter fixed weekly amounts for employee and employer shares";
			case "percentage":
				return "Enter rates as decimals (e.g., 0.045 for 4.5%, 0.02 for 2%)";
			case "progressive_tax":
				return "Tax calculated automatically using tax brackets based on gross pay";
			default:
				return "";
		}
	};

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
				<DialogHeader>
					<DialogTitle>
						{isEditing
							? "Edit Government Benefit"
							: "Add Government Benefit"}
					</DialogTitle>
					<DialogDescription>
						Configure government-mandated benefits and their
						calculation methods
					</DialogDescription>
				</DialogHeader>

				<Form {...form}>
					<form
						onSubmit={form.handleSubmit(onSubmit)}
						className="space-y-4"
					>
						{/* Benefit Type */}
						<FormField
							control={form.control}
							name="benefit_type"
							render={({ field }) => (
								<FormItem>
									<FormLabel required>Benefit Type</FormLabel>
									<Select
										onValueChange={field.onChange}
										value={field.value}
										disabled={isEditing}
									>
										<FormControl>
											<SelectTrigger className="w-full">
												<SelectValue placeholder="Select benefit type" />
											</SelectTrigger>
										</FormControl>
										<SelectContent>
											<SelectItem value="sss">
												SSS
											</SelectItem>
											<SelectItem value="philhealth">
												PhilHealth
											</SelectItem>
											<SelectItem value="pagibig">
												Pag-IBIG / HDMF
											</SelectItem>
											<SelectItem value="bir_tax">
												BIR Withholding Tax
											</SelectItem>
										</SelectContent>
									</Select>
									<FormDescription>
										{getBenefitTypeInfo()}
									</FormDescription>
								</FormItem>
							)}
						/>

						{/* Name */}
						<FormField
							control={form.control}
							name="name"
							render={({ field }) => (
								<FormItem>
									<FormLabel required>Display Name</FormLabel>
									<FormControl>
										<Input
											{...field}
											placeholder="e.g., SSS Contribution - 2024"
										/>
									</FormControl>
									<FormDescription>
										This name will appear in payroll
										deductions
									</FormDescription>
								</FormItem>
							)}
						/>

						{/* Calculation Method */}
						<FormField
							control={form.control}
							name="calculation_method"
							render={({ field }) => (
								<FormItem>
									<FormLabel required>
										Calculation Method
									</FormLabel>
									<Select
										onValueChange={field.onChange}
										value={field.value}
										disabled={benefitType === "bir_tax"}
									>
										<FormControl>
											<SelectTrigger className="w-full">
												<SelectValue placeholder="Select calculation method" />
											</SelectTrigger>
										</FormControl>
										<SelectContent>
											<SelectItem value="fixed">
												Fixed Amount
											</SelectItem>
											<SelectItem value="percentage">
												Percentage of Gross
											</SelectItem>
											<SelectItem value="progressive_tax">
												Progressive Tax Bracket
											</SelectItem>
										</SelectContent>
									</Select>
									<FormDescription>
										{getCalculationMethodHelp()}
									</FormDescription>
								</FormItem>
							)}
						/>

						{/* Period Type - Only show for fixed amounts */}
						{calculationMethod === "fixed" && (
							<FormField
								control={form.control}
								name="period_type"
								render={({ field }) => (
									<FormItem>
										<FormLabel required>
											Period Type
										</FormLabel>
										<Select
											onValueChange={field.onChange}
											value={field.value}
										>
											<FormControl>
												<SelectTrigger className="w-full">
													<SelectValue placeholder="Select period type" />
												</SelectTrigger>
											</FormControl>
											<SelectContent>
												<SelectItem value="monthly">
													Monthly (divide by 4 for
													weekly payroll)
												</SelectItem>
												<SelectItem value="weekly">
													Weekly (use as-is)
												</SelectItem>
											</SelectContent>
										</Select>
										<FormDescription>
											{field.value === "monthly"
												? "Amount will be divided by 4 for weekly payroll. Use this for standard SSS, PhilHealth, and Pag-IBIG contributions."
												: "Amount will be used as-is for each weekly payroll."}
										</FormDescription>
									</FormItem>
								)}
							/>
						)}

						{/* Fixed Amount Fields */}
						{calculationMethod === "fixed" && (
							<div className="grid grid-cols-2 gap-4">
								<FormField
									control={form.control}
									name="employee_share_amount"
									render={({ field }) => (
										<FormItem>
											<FormLabel required>
												Employee Share (₱)
											</FormLabel>
											<FormControl>
												<Input
													type="number"
													step="0.01"
													placeholder="0.00"
													{...field}
													value={field.value ?? ""}
													onChange={(e) =>
														field.onChange(
															e.target.value
																? Number(
																		e.target
																			.value,
																	)
																: null,
														)
													}
												/>
											</FormControl>
											<FormDescription>
												{form.watch("period_type") ===
												"monthly"
													? "Monthly amount (will be ÷ 4 for weekly)"
													: "Weekly amount"}
											</FormDescription>
										</FormItem>
									)}
								/>
								<FormField
									control={form.control}
									name="employer_share_amount"
									render={({ field }) => (
										<FormItem>
											<FormLabel required>
												Employer Share (₱)
											</FormLabel>
											<FormControl>
												<Input
													type="number"
													step="0.01"
													placeholder="0.00"
													{...field}
													value={field.value ?? ""}
													onChange={(e) =>
														field.onChange(
															e.target.value
																? Number(
																		e.target
																			.value,
																	)
																: null,
														)
													}
												/>
											</FormControl>
											<FormDescription>
												{form.watch("period_type") ===
												"monthly"
													? "Monthly employer share (for reporting)"
													: "Weekly employer share (for reporting)"}
											</FormDescription>
										</FormItem>
									)}
								/>
							</div>
						)}

						{/* Percentage Fields */}
						{calculationMethod === "percentage" && (
							<>
								<Alert>
									<Info className="h-4 w-4" />
									<AlertDescription>
										Enter rates as decimals: 0.045 for 4.5%,
										0.02 for 2%, 0.095 for 9.5%
									</AlertDescription>
								</Alert>
								<div className="grid grid-cols-2 gap-4">
									<FormField
										control={form.control}
										name="employee_share_rate"
										render={({ field }) => (
											<FormItem>
												<FormLabel required>
													Employee Share Rate
												</FormLabel>
												<FormControl>
													<Input
														type="number"
														step="0.0001"
														placeholder="0.0450"
														{...field}
														value={
															field.value ?? ""
														}
														onChange={(e) =>
															field.onChange(
																e.target.value
																	? Number(
																			e
																				.target
																				.value,
																		)
																	: null,
															)
														}
													/>
												</FormControl>
												<FormDescription>
													{field.value
														? `${(Number(field.value) * 100).toFixed(2)}%`
														: "e.g., 0.045 = 4.5%"}
												</FormDescription>
											</FormItem>
										)}
									/>
									<FormField
										control={form.control}
										name="employer_share_rate"
										render={({ field }) => (
											<FormItem>
												<FormLabel required>
													Employer Share Rate
												</FormLabel>
												<FormControl>
													<Input
														type="number"
														step="0.0001"
														placeholder="0.0950"
														{...field}
														value={
															field.value ?? ""
														}
														onChange={(e) =>
															field.onChange(
																e.target.value
																	? Number(
																			e
																				.target
																				.value,
																		)
																	: null,
															)
														}
													/>
												</FormControl>
												<FormDescription>
													{field.value
														? `${(Number(field.value) * 100).toFixed(2)}%`
														: "e.g., 0.095 = 9.5%"}
												</FormDescription>
											</FormItem>
										)}
									/>
								</div>
							</>
						)}

						{/* Progressive Tax - No additional fields needed */}
						{calculationMethod === "progressive_tax" && (
							<Alert>
								<Info className="h-4 w-4" />
								<AlertDescription>
									Tax will be calculated automatically using
									the appropriate tax bracket based on gross
									pay amount.
								</AlertDescription>
							</Alert>
						)}

						{/* Effective Dates */}
						<div className="grid grid-cols-2 gap-4">
							<FormField
								control={form.control}
								name="effective_start"
								render={({ field }) => (
									<FormItem>
										<FormControl>
											<DatePicker
												required
												field={field}
												label="Effective Start Date"
											/>
										</FormControl>
										<FormDescription>
											When this rate becomes active
										</FormDescription>
									</FormItem>
								)}
							/>
							<FormField
								control={form.control}
								name="effective_end"
								render={({ field }) => (
									<FormItem>
										<FormControl>
											<DatePicker
												field={field}
												label="Effective End Date"
											/>
										</FormControl>
										<FormDescription>
											Leave empty if still active
										</FormDescription>
									</FormItem>
								)}
							/>
						</div>

						{/* Description */}
						<FormField
							control={form.control}
							name="description"
							render={({ field }) => (
								<FormItem>
									<FormLabel>Notes (Optional)</FormLabel>
									<FormControl>
										<Textarea
											{...field}
											placeholder="Additional notes about this benefit configuration..."
											rows={3}
										/>
									</FormControl>
								</FormItem>
							)}
						/>

						<DialogFooter>
							<Button
								type="button"
								variant="outline"
								onClick={() => onOpenChange(false)}
							>
								Cancel
							</Button>
							<Button
								type="submit"
								disabled={
									createMutation.isPending ||
									updateMutation.isPending
								}
							>
								{(createMutation.isPending ||
									updateMutation.isPending) && (
									<Loader2 className="mr-2 h-4 w-4 animate-spin" />
								)}
								{isEditing ? "Update" : "Create"} Benefit
							</Button>
						</DialogFooter>
					</form>
				</Form>
			</DialogContent>
		</Dialog>
	);
}
