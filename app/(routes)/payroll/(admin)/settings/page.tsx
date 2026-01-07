"use client";

import React, { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { PayrollSettings, usePayrollSettings } from "@/lib/queries/usePayroll";
import { usePayrollAdminMutations } from "@/lib/mutations/usePayrollAdminMutations";
import { useCurrentUser } from "@/lib/hooks/useCurrentUser";

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

export default function PayrollSettingsPage() {
	const { role } = useCurrentUser();

	const isAdmin = role === "admin";

	const { data: settings, isLoading, refetch } = usePayrollSettings();

	const { saveSettings } = usePayrollAdminMutations();

	const [form, setForm] = useState<FormState>({});

	const busy = saveSettings.isPending;

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
		<div className="p-6 space-y-6">
			<header className="space-y-1">
				<div className="flex items-center justify-between">
					<h1 className="text-xl font-semibold">Payroll Settings</h1>
					<div className="text-xs text-muted-foreground">
						Admin only
					</div>
				</div>
				<p className="text-sm text-muted-foreground">
					Configure global payroll behavior: shift window, auto-close
					of sessions, multipliers, and holiday rules.
				</p>
			</header>

			{isLoading ? (
				<div className="text-sm">Loading settings...</div>
			) : !effective ? (
				<div className="text-sm">No settings found.</div>
			) : (
				<div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
					{/* Shift & Attendance */}
					<section className="p-4 border rounded-lg bg-card shadow-sm">
						<div className="font-medium mb-2">
							Shift & Attendance
						</div>
						<div className="text-xs text-muted-foreground mb-3">
							Define typical workday boundaries, grace minutes for
							classification, and automatic session closure rules.
						</div>

						<div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
							<div>
								<label className="block mb-1">
									Shift Start
								</label>
								<input
									type="time"
									className="w-full border rounded px-2 py-1"
									value={toHHMM(
										effective.shift_start as string,
									)}
									onChange={(e) =>
										setField("shift_start", e.target.value)
									}
									disabled={!canEdit}
								/>
							</div>
							<div>
								<label className="block mb-1">Shift End</label>
								<input
									type="time"
									className="w-full border rounded px-2 py-1"
									value={toHHMM(
										effective.shift_end as string,
									)}
									onChange={(e) =>
										setField("shift_end", e.target.value)
									}
									disabled={!canEdit}
								/>
							</div>

							<div>
								<label className="block mb-1">
									Grace Minutes
								</label>
								<input
									type="number"
									min={0}
									className="w-full border rounded px-2 py-1"
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
							</div>

							<div className="flex items-center gap-2 mt-6 md:mt-0">
								<input
									id="auto-close"
									type="checkbox"
									className="h-4 w-4"
									checked={
										Boolean(
											form.auto_close_enabled ??
											effective.auto_close_enabled,
										) || false
									}
									onChange={(e) =>
										setField(
											"auto_close_enabled",
											e.target.checked,
										)
									}
									disabled={!canEdit}
								/>
								<label htmlFor="auto-close" className="text-sm">
									Auto-close sessions at shift end
								</label>
							</div>
						</div>
					</section>

					{/* Multipliers & Holidays */}
					<section className="p-4 border rounded-lg bg-card shadow-sm">
						<div className="font-medium mb-2">
							Multipliers & Holidays
						</div>
						<div className="text-xs text-muted-foreground mb-3">
							Configure payroll multipliers and how holidays
							affect pay computations.
						</div>

						<div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
							<div>
								<label className="block mb-1">
									Overtime Multiplier
								</label>
								<input
									type="number"
									step="0.01"
									className="w-full border rounded px-2 py-1"
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
							</div>

							<div>
								<label className="block mb-1">
									Night Diff Multiplier
								</label>
								<input
									type="number"
									step="0.01"
									className="w-full border rounded px-2 py-1"
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
							</div>

							<div>
								<label className="block mb-1">
									Holiday Day Hours
								</label>
								<input
									type="number"
									step="0.25"
									min={0}
									className="w-full border rounded px-2 py-1"
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
								<p className="text-xs text-muted-foreground mt-1">
									Used to compute daily rate baseline
									(hourly_rate × day_hours).
								</p>
							</div>

							<div>
								<label className="block mb-1">
									Regular Holiday % (+100% = 1.00)
								</label>
								<input
									type="number"
									step="0.01"
									min={0}
									className="w-full border rounded px-2 py-1"
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
							</div>

							<div>
								<label className="block mb-1">
									Special Non-Working % (+30% = 0.30)
								</label>
								<input
									type="number"
									step="0.01"
									min={0}
									className="w-full border rounded px-2 py-1"
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
							</div>

							<div className="flex items-center gap-2">
								<input
									id="reg-no-work"
									type="checkbox"
									className="h-4 w-4"
									checked={
										Boolean(
											form.regular_holiday_no_work_pays ??
											effective.regular_holiday_no_work_pays,
										) || false
									}
									onChange={(e) =>
										setField(
											"regular_holiday_no_work_pays",
											e.target.checked,
										)
									}
									disabled={!canEdit}
								/>
								<label
									htmlFor="reg-no-work"
									className="text-sm"
								>
									Regular Holiday pays even if no work
								</label>
							</div>

							<div className="flex items-center gap-2">
								<input
									id="spec-no-work"
									type="checkbox"
									className="h-4 w-4"
									checked={
										Boolean(
											form.special_holiday_no_work_pays ??
											effective.special_holiday_no_work_pays,
										) || false
									}
									onChange={(e) =>
										setField(
											"special_holiday_no_work_pays",
											e.target.checked,
										)
									}
									disabled={!canEdit}
								/>
								<label
									htmlFor="spec-no-work"
									className="text-sm"
								>
									Special Holiday pays even if no work
								</label>
							</div>
						</div>
					</section>
				</div>
			)}

			<footer className="flex items-center gap-2">
				<Button
					variant="outline"
					onClick={() => refetch()}
					disabled={busy}
				>
					Refresh
				</Button>
				<Button onClick={handleSave} disabled={!canEdit || busy}>
					{busy ? "Saving..." : "Save Changes"}
				</Button>
				{Object.keys(form).length > 0 && (
					<Button
						variant="ghost"
						onClick={resetLocal}
						disabled={busy}
					>
						Reset Changes
					</Button>
				)}
			</footer>
		</div>
	);
}
