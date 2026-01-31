"use client";

import React, { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { PayrollSettings, usePayrollSettings } from "@/lib/queries/usePayroll";
import { usePayrollAdminMutations } from "@/lib/mutations/usePayrollAdminMutations";
import { useCurrentUser } from "@/lib/hooks/useCurrentUser";
import PageHeader from "@/components/custom/shared/PageHeader";
import { Wrapper } from "@/components/custom/shared/Wrapper";
import {
	Clock,
	Calculator,
	Calendar,
	Settings,
	Save,
	RotateCcw,
	RefreshCw,
} from "lucide-react";

type FormState = Partial<PayrollSettings>;

function toHHMM(value?: string): string {
	if (!value) return "";
	// Expecting "HH:MM" or "HH:MM:SS"; normalize to HH:MM for <input type="time" />
	return value.length >= 5 ? value.slice(0, 5) : value;
}

function toHHMMSS(value?: string): string | undefined {
	if (!value) return undefined;
	// Convert "HH:MM" to "HH:MM:00" for API
	return value.length === 5 ? `${value}:00` : value;
}

interface FieldGroupProps {
	icon: React.ReactNode;
	title: string;
	description: string;
	children: React.ReactNode;
}

function FieldGroup({ icon, title, description, children }: FieldGroupProps) {
	return (
		<Card>
			<CardHeader>
				<CardTitle className="flex items-center gap-3 text-lg">
					<div className="p-2 rounded-lg bg-primary/10 text-primary">
						{icon}
					</div>
					{title}
				</CardTitle>
				<CardDescription className="text-sm leading-relaxed">
					{description}
				</CardDescription>
			</CardHeader>
			<CardContent className="space-y-6">{children}</CardContent>
		</Card>
	);
}

interface FormFieldProps {
	label: string;
	description?: string;
	children: React.ReactNode;
	className?: string;
}

function FormField({
	label,
	description,
	children,
	className = "",
}: FormFieldProps) {
	return (
		<div className={`space-y-2 ${className}`}>
			<Label className="text-sm font-medium">{label}</Label>
			{children}
			{description && (
				<p className="text-xs text-muted-foreground leading-relaxed">
					{description}
				</p>
			)}
		</div>
	);
}

export default function PayrollSettingsPage() {
	const { isAdmin } = useCurrentUser();

	const { data: settings, isLoading, refetch } = usePayrollSettings();

	const { saveSettings } = usePayrollAdminMutations();

	const [form, setForm] = useState<FormState>({});

	const busy = saveSettings.isPending;
	const hasChanges = Object.keys(form).length > 0;
	const canEdit = isAdmin;

	const setField = <K extends keyof PayrollSettings>(
		key: K,
		val: PayrollSettings[K] | undefined,
	) => {
		setForm((f) => ({ ...f, [key]: val }));
	};

	const handleSave = async () => {
		if (!canEdit) return;
		// For time fields, normalize to HH:MM:SS
		const payload: FormState = { ...form };
		if (payload.shift_start)
			payload.shift_start = toHHMMSS(payload.shift_start);
		if (payload.shift_end) payload.shift_end = toHHMMSS(payload.shift_end);

		await saveSettings.mutateAsync(payload);
		await refetch();
		setForm({});
	};

	const resetLocal = () => setForm({});

	const effective: PayrollSettings | undefined = useMemo(() => {
		if (!settings) return undefined;
		return {
			...settings,
			...form,
			// For preview in inputs, keep HH:MM in the UI while maintaining HH:MM:SS in state
			shift_start:
				(form.shift_start as string | undefined) ??
				(settings.shift_start as string),
			shift_end:
				(form.shift_end as string | undefined) ??
				(settings.shift_end as string),
		};
	}, [settings, form]);

	return (
		<Wrapper>
			<PageHeader
				isAdminOnly
				title="Payroll Settings"
				description="Configure global payroll behavior including shift schedules, overtime calculations, and holiday policies."
				breadcrumbs={["Payroll", "Settings"]}
			/>

			{isLoading ? (
				<Card>
					<CardContent className="flex items-center justify-center py-12">
						<div className="flex items-center gap-3 text-muted-foreground">
							<RefreshCw className="size-4 animate-spin" />
							Loading settings...
						</div>
					</CardContent>
				</Card>
			) : !effective ? (
				<Card>
					<CardContent className="flex items-center justify-center py-12">
						<div className="text-center space-y-2">
							<Settings className="size-8 mx-auto text-muted-foreground" />
							<div className="text-sm text-muted-foreground">
								No settings found.
							</div>
						</div>
					</CardContent>
				</Card>
			) : (
				<div className="space-y-6">
					<div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
						{/* Shift & Attendance Configuration */}
						<FieldGroup
							icon={<Clock className="size-5" />}
							title="Shift & Attendance"
							description="Define workday boundaries, grace periods for attendance classification, and automatic session management rules."
						>
							<div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
								<FormField
									label="Shift Start Time"
									description="The official start time of the work shift"
								>
									<Input
										type="time"
										value={toHHMM(
											effective.shift_start as string,
										)}
										onChange={(e) =>
											setField(
												"shift_start",
												e.target.value,
											)
										}
										disabled={!canEdit}
									/>
								</FormField>

								<FormField
									label="Shift End Time"
									description="The official end time of the work shift"
								>
									<Input
										type="time"
										value={toHHMM(
											effective.shift_end as string,
										)}
										onChange={(e) =>
											setField(
												"shift_end",
												e.target.value,
											)
										}
										disabled={!canEdit}
									/>
								</FormField>
							</div>

							<Separator />

							<div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
								<FormField
									label="Grace Minutes"
									description="Minutes of tolerance for late arrivals before marking as tardy"
								>
									<Input
										type="number"
										min={0}
										max={60}
										value={Number(
											form.grace_minutes ??
												effective.grace_minutes ??
												0,
										)}
										onChange={(e) =>
											setField(
												"grace_minutes",
												Number(e.target.value || 0),
											)
										}
										disabled={!canEdit}
									/>
								</FormField>

								<FormField
									label="Auto-Close Sessions"
									description="Automatically close active sessions at shift end time"
								>
									<div className="flex items-center gap-3 pt-2">
										<Switch
											checked={
												Boolean(
													form.auto_close_enabled ??
													effective.auto_close_enabled,
												) || false
											}
											onCheckedChange={(checked) =>
												setField(
													"auto_close_enabled",
													checked,
												)
											}
											disabled={!canEdit}
										/>
										<span className="text-sm">
											{Boolean(
												form.auto_close_enabled ??
												effective.auto_close_enabled,
											)
												? "Enabled"
												: "Disabled"}
										</span>
									</div>
								</FormField>
							</div>
						</FieldGroup>

						{/* Pay Calculation Multipliers */}
						<FieldGroup
							icon={<Calculator className="size-5" />}
							title="Pay Multipliers"
							description="Configure overtime and night differential rates that apply to payroll calculations."
						>
							<div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
								<FormField
									label="Overtime Multiplier"
									description="Additional pay rate for overtime hours (e.g., 1.25 = +25%)"
								>
									<Input
										type="number"
										step="0.01"
										min={1}
										max={5}
										value={Number(
											form.overtime_multiplier ??
												effective.overtime_multiplier ??
												1.25,
										)}
										onChange={(e) =>
											setField(
												"overtime_multiplier",
												Number(e.target.value),
											)
										}
										disabled={!canEdit}
									/>
								</FormField>

								<FormField
									label="Night Differential"
									description="Additional pay rate for night shift hours (e.g., 0.10 = +10%)"
								>
									<Input
										type="number"
										step="0.01"
										min={0}
										max={1}
										value={Number(
											form.night_diff_multiplier ??
												effective.night_diff_multiplier ??
												0.1,
										)}
										onChange={(e) =>
											setField(
												"night_diff_multiplier",
												Number(e.target.value),
											)
										}
										disabled={!canEdit}
									/>
								</FormField>
							</div>
						</FieldGroup>
					</div>

					{/* Holiday Pay Configuration */}
					<FieldGroup
						icon={<Calendar className="size-5" />}
						title="Holiday Pay Configuration"
						description="Configure how holidays affect pay calculations, including rates and policies for different holiday types."
					>
						<div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
							<FormField
								label="Standard Day Hours"
								description="Standard work hours per day used for holiday pay calculations"
							>
								<Input
									type="number"
									step="0.25"
									min={1}
									max={12}
									value={Number(
										form.holiday_day_hours ??
											effective.holiday_day_hours ??
											8,
									)}
									onChange={(e) =>
										setField(
											"holiday_day_hours",
											Number(e.target.value || 0),
										)
									}
									disabled={!canEdit}
								/>
							</FormField>

							<FormField
								label="Regular Holiday Rate"
								description="Pay multiplier for regular holidays (e.g., 1.00 = +100%)"
							>
								<Input
									type="number"
									step="0.01"
									min={0}
									max={5}
									value={Number(
										form.holiday_regular_pct ??
											effective.holiday_regular_pct ??
											1.0,
									)}
									onChange={(e) =>
										setField(
											"holiday_regular_pct",
											Number(e.target.value),
										)
									}
									disabled={!canEdit}
								/>
							</FormField>

							<FormField
								label="Special Holiday Rate"
								description="Pay multiplier for special non-working days (e.g., 0.30 = +30%)"
							>
								<Input
									type="number"
									step="0.01"
									min={0}
									max={2}
									value={Number(
										form.holiday_special_pct ??
											effective.holiday_special_pct ??
											0.3,
									)}
									onChange={(e) =>
										setField(
											"holiday_special_pct",
											Number(e.target.value),
										)
									}
									disabled={!canEdit}
								/>
							</FormField>
						</div>

						<Separator />

						<div className="space-y-4">
							<h4 className="text-sm font-medium text-foreground">
								Holiday Pay Policies
							</h4>
							<div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
								<FormField
									label="Regular Holiday No-Work Pay"
									description="Pay employees on regular holidays even when they don't work"
								>
									<div className="flex items-center gap-3">
										<Switch
											checked={
												Boolean(
													form.regular_holiday_no_work_pays ??
													effective.regular_holiday_no_work_pays,
												) || false
											}
											onCheckedChange={(checked) =>
												setField(
													"regular_holiday_no_work_pays",
													checked,
												)
											}
											disabled={!canEdit}
										/>
										<span className="text-sm">
											{Boolean(
												form.regular_holiday_no_work_pays ??
												effective.regular_holiday_no_work_pays,
											)
												? "Enabled"
												: "Disabled"}
										</span>
									</div>
								</FormField>

								<FormField
									label="Special Holiday No-Work Pay"
									description="Pay employees on special holidays even when they don't work"
								>
									<div className="flex items-center gap-3">
										<Switch
											checked={
												Boolean(
													form.special_holiday_no_work_pays ??
													effective.special_holiday_no_work_pays,
												) || false
											}
											onCheckedChange={(checked) =>
												setField(
													"special_holiday_no_work_pays",
													checked,
												)
											}
											disabled={!canEdit}
										/>
										<span className="text-sm">
											{Boolean(
												form.special_holiday_no_work_pays ??
												effective.special_holiday_no_work_pays,
											)
												? "Enabled"
												: "Disabled"}
										</span>
									</div>
								</FormField>
							</div>
						</div>
					</FieldGroup>
				</div>
			)}

			{/* Action Bar */}
			<Card className="bg-muted/30">
				<CardContent>
					<div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
						<div className="flex flex-col gap-1">
							<div className="text-sm font-medium">
								{hasChanges
									? "Unsaved Changes"
									: "All Changes Saved"}
							</div>
							<div className="text-xs text-muted-foreground">
								{hasChanges
									? `${
											Object.keys(form).length
										} field${Object.keys(form).length !== 1 ? "s" : ""} modified`
									: "Settings are up to date"}
							</div>
						</div>

						<div className="flex items-center gap-2">
							{hasChanges && (
								<Button
									variant="destructive"
									size="sm"
									onClick={resetLocal}
									disabled={busy}
									className="gap-2"
								>
									<RotateCcw className="size-4" />
									Reset
								</Button>
							)}

							<Button
								onClick={handleSave}
								disabled={!canEdit || busy || !hasChanges}
								size="sm"
								className="gap-2"
							>
								<Save className="size-4" />
								{busy ? "Saving..." : "Save Changes"}
							</Button>
						</div>
					</div>
				</CardContent>
			</Card>
		</Wrapper>
	);
}
