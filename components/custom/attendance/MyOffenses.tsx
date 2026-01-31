"use client";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useMyOffenses } from "@/lib/queries/useAttendance";
import { formatDate } from "@/lib/utils/attendance";
import {
	AlertCircle,
	AlertTriangle,
	Ban,
	Calendar,
	Clock,
	Info,
	LucideIcon,
	UserX,
} from "lucide-react";

const getOffenseTypeBadge = (offenseType: string) => {
	const config: Record<
		string,
		{ color: string; icon: LucideIcon; label: string }
	> = {
		AWOL: {
			color: "bg-red-50 text-red-700 border-red-200 dark:bg-red-950/50 dark:text-red-400 dark:border-red-900",
			icon: UserX,
			label: "AWOL",
		},
		LATE: {
			color: "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/50 dark:text-amber-400 dark:border-amber-900",
			icon: Clock,
			label: "Late",
		},
		CURFEW: {
			color: "bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-950/50 dark:text-purple-400 dark:border-purple-900",
			icon: AlertCircle,
			label: "Curfew",
		},
		OTHER: {
			color: "bg-slate-50 text-slate-700 border-slate-200 dark:bg-slate-950/50 dark:text-slate-400 dark:border-slate-900",
			icon: AlertTriangle,
			label: "Other",
		},
	};

	const { color, icon: Icon, label } = config[offenseType] || config.OTHER;

	return (
		<Badge variant="outline" className={`${color} font-medium`}>
			<Icon className="mr-1.5 h-3.5 w-3.5" />
			{label}
		</Badge>
	);
};

const getSeverityBadge = (severity: string) => {
	const config: Record<
		string,
		{ color: string; icon: LucideIcon; label: string }
	> = {
		WARNING: {
			color: "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/50 dark:text-amber-400 dark:border-amber-900",
			icon: AlertTriangle,
			label: "Warning",
		},
		SUSPENSION: {
			color: "bg-orange-50 text-orange-700 border-orange-200 dark:bg-orange-950/50 dark:text-orange-400 dark:border-orange-900",
			icon: Ban,
			label: "Suspension",
		},
		TERMINATION: {
			color: "bg-red-50 text-red-700 border-red-200 dark:bg-red-950/50 dark:text-red-400 dark:border-red-900",
			icon: UserX,
			label: "Termination",
		},
	};

	const { color, icon: Icon, label } = config[severity] || config.WARNING;

	return (
		<Badge variant="outline" className={`${color} font-medium`}>
			<Icon className="mr-1.5 h-3.5 w-3.5" />
			{label}
		</Badge>
	);
};

export default function MyOffenses() {
	const { data: offensesData, isLoading } = useMyOffenses();

	const offenses = offensesData || [];
	const totalOffenses = offenses?.length || 0;
	const warningCount =
		offenses?.filter((o) => o.severity_level === "WARNING").length || 0;
	const suspensionCount =
		offenses?.filter((o) => o.severity_level === "SUSPENSION").length || 0;
	const terminationCount =
		offenses?.filter((o) => o.severity_level === "TERMINATION").length || 0;

	// Count offenses per type
	const awolCount =
		offenses?.filter((o) => o.offense_type === "AWOL").length || 0;
	const lateCount =
		offenses?.filter((o) => o.offense_type === "LATE").length || 0;
	const curfewCount =
		offenses?.filter((o) => o.offense_type === "CURFEW").length || 0;
	const otherCount =
		offenses?.filter((o) => o.offense_type === "OTHER").length || 0;

	// Check if any offense type has reached limit (3 or more)
	const hasReachedLimit =
		awolCount >= 3 || lateCount >= 3 || curfewCount >= 3 || otherCount >= 3;

	if (isLoading) {
		return (
			<div className="min-h-[400px] flex items-center justify-center">
				<div className="flex flex-col items-center gap-3">
					<div className="h-8 w-8 border-2 border-slate-300 border-t-slate-600 rounded-full animate-spin" />
					<p className="text-sm text-muted-foreground">
						Loading offenses...
					</p>
				</div>
			</div>
		);
	}

	return (
		<div className="space-y-6 pb-6">
			{/* Header */}
			<div>
				<h1 className="text-2xl font-semibold tracking-tight">
					My Offenses
				</h1>
				<p className="text-sm text-muted-foreground mt-1">
					Track your attendance violations and understand their
					consequences
				</p>
			</div>

			{/* Stats Grid */}
			<div className="grid md:grid-cols-2 lg:grid-cols-4 gap-3">
				<Card
					className={
						hasReachedLimit
							? "border-red-200 dark:border-red-900"
							: ""
					}
				>
					<CardContent>
						<div className="flex items-center justify-between">
							<div>
								<p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
									Total
								</p>
								<p
									className={`text-3xl font-bold mt-1 ${hasReachedLimit ? "text-red-600 dark:text-red-500" : ""}`}
								>
									{totalOffenses}
								</p>
							</div>
							<div
								className={`h-12 w-12 rounded-full flex items-center justify-center ${
									hasReachedLimit
										? "bg-red-50 dark:bg-red-950/50"
										: "bg-slate-50 dark:bg-slate-900"
								}`}
							>
								<AlertTriangle
									className={`h-5 w-5 ${
										hasReachedLimit
											? "text-red-600 dark:text-red-500"
											: "text-slate-500"
									}`}
								/>
							</div>
						</div>
						{hasReachedLimit && (
							<p className="text-xs text-red-600 dark:text-red-500 mt-2 font-medium">
								Type limit reached
							</p>
						)}
					</CardContent>
				</Card>

				<Card>
					<CardContent>
						<div className="flex items-center justify-between">
							<div>
								<p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
									Warnings
								</p>
								<p className="text-3xl font-bold mt-1">
									{warningCount}
								</p>
							</div>
							<div className="h-12 w-12 rounded-full bg-amber-50 dark:bg-amber-950/50 flex items-center justify-center">
								<AlertTriangle className="h-5 w-5 text-amber-600 dark:text-amber-500" />
							</div>
						</div>
					</CardContent>
				</Card>

				<Card>
					<CardContent>
						<div className="flex items-center justify-between">
							<div>
								<p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
									Suspensions
								</p>
								<p className="text-3xl font-bold mt-1">
									{suspensionCount}
								</p>
							</div>
							<div className="h-12 w-12 rounded-full bg-orange-50 dark:bg-orange-950/50 flex items-center justify-center">
								<Ban className="h-5 w-5 text-orange-600 dark:text-orange-500" />
							</div>
						</div>
					</CardContent>
				</Card>

				<Card>
					<CardContent>
						<div className="flex items-center justify-between">
							<div>
								<p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
									Terminations
								</p>
								<p className="text-3xl font-bold mt-1">
									{terminationCount}
								</p>
							</div>
							<div className="h-12 w-12 rounded-full bg-red-50 dark:bg-red-950/50 flex items-center justify-center">
								<UserX className="h-5 w-5 text-red-600 dark:text-red-500" />
							</div>
						</div>
					</CardContent>
				</Card>
			</div>

			{/* Critical Alert */}
			{hasReachedLimit && (
				<div className="border border-red-200 dark:border-red-900 bg-red-50 dark:bg-red-950/30 rounded-lg p-4">
					<div className="flex gap-3">
						<div className="shrink-0 mt-0.5">
							<div className="h-8 w-8 rounded-full bg-red-100 dark:bg-red-900/50 flex items-center justify-center">
								<AlertTriangle className="h-4 w-4 text-red-600 dark:text-red-500" />
							</div>
						</div>
						<div className="flex-1">
							<h3 className="font-semibold text-red-900 dark:text-red-100">
								Action Required
							</h3>
							<p className="text-sm text-red-700 dark:text-red-300 mt-1">
								You`&apos;`ve reached the limit for one or more
								offense types (3 per type). Please contact admin
								immediately.
							</p>
						</div>
					</div>
				</div>
			)}

			{/* Offense List */}
			<Card>
				<CardHeader className="border-b">
					<CardTitle className="text-base font-semibold flex items-center gap-1.5">
						<AlertTriangle className="h-4 w-4 text-amber-500 shrink-0" />
						<span className="truncate">Offense History</span>
						{offenses?.length > 0 && (
							<span className="text-xs bg-amber-100 text-amber-800 dark:bg-amber-900/50 dark:text-amber-200 px-1.5 py-0.5 rounded-full font-medium ml-auto shrink-0">
								{offenses.length}
							</span>
						)}
					</CardTitle>
				</CardHeader>
				<CardContent className="p-3 sm:p-6">
					{offenses?.length === 0 ? (
						<div className="flex flex-col items-center justify-center py-8">
							<div className="h-12 w-12 rounded-full bg-emerald-50 dark:bg-emerald-950/50 flex items-center justify-center mb-3">
								<AlertTriangle className="h-6 w-6 text-emerald-600 dark:text-emerald-500 opacity-50" />
							</div>
							<h3 className="font-semibold">No Offenses</h3>
							<p className="text-sm text-muted-foreground text-center mt-1 max-w-xs">
								Great job! Keep maintaining excellent behavior.
							</p>
						</div>
					) : (
						<div className="space-y-3">
							{offenses?.map((offense) => (
								<div
									key={offense.id}
									className="border rounded-lg p-3 sm:p-4 hover:bg-accent/50 transition-colors"
								>
									{/* Mobile: Stacked layout, Desktop: Side by side */}
									<div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2 mb-2">
										<div className="flex flex-wrap items-center gap-1.5">
											{getOffenseTypeBadge(
												offense.offense_type,
											)}
											{getSeverityBadge(
												offense.severity_level,
											)}
										</div>
										<div className="flex items-center gap-1 text-xs text-muted-foreground sm:shrink-0">
											<Calendar className="h-3 w-3" />
											<span className="whitespace-nowrap">
												{formatDate(offense.date)}
											</span>
										</div>
									</div>

									<p className="text-sm leading-relaxed">
										{offense.description}
									</p>

									{offense.severity_level === "SUSPENSION" &&
										offense.penalty_days > 0 && (
											<div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2 mt-2 text-xs text-muted-foreground">
												<span className="font-medium">
													{offense.penalty_days} day
													{offense.penalty_days > 1
														? "s"
														: ""}{" "}
													suspension
												</span>
												{offense.suspension_start_date && (
													<>
														<span className="hidden sm:inline">
															•
														</span>
														<span>
															From{" "}
															{formatDate(
																offense.suspension_start_date,
															)}
														</span>
													</>
												)}
											</div>
										)}

									{offense.notes && (
										<p className="text-xs text-muted-foreground mt-3 pt-2 border-t leading-relaxed">
											{offense.notes}
										</p>
									)}
								</div>
							))}
						</div>
					)}
				</CardContent>
			</Card>

			{/* Policy Guide */}
			<Card>
				<CardHeader className="border-b">
					<div className="flex items-center gap-2">
						<Info className="h-5 w-5 text-muted-foreground" />
						<CardTitle className="text-lg">
							Offense Policy
						</CardTitle>
					</div>
				</CardHeader>
				<CardContent>
					<div className="space-y-4">
						<div className="flex gap-4">
							<div className="shrink-0">
								<div className="h-10 w-10 rounded-lg bg-amber-50 dark:bg-amber-950/50 flex items-center justify-center">
									<AlertTriangle className="h-5 w-5 text-amber-600 dark:text-amber-500" />
								</div>
							</div>
							<div className="flex-1">
								<h4 className="font-semibold text-sm mb-1">
									1st Offense — Warning
								</h4>
								<p className="text-sm text-muted-foreground">
									Verbal or written warning issued. Employee
									counseling may be required.
								</p>
							</div>
						</div>

						<div className="flex gap-4">
							<div className="shrink-0">
								<div className="h-10 w-10 rounded-lg bg-orange-50 dark:bg-orange-950/50 flex items-center justify-center">
									<Ban className="h-5 w-5 text-orange-600 dark:text-orange-500" />
								</div>
							</div>
							<div className="flex-1">
								<h4 className="font-semibold text-sm mb-1">
									2nd Offense — Suspension
								</h4>
								<p className="text-sm text-muted-foreground">
									Temporary suspension without pay. Duration
									determined by management.
								</p>
							</div>
						</div>

						<div className="flex gap-4">
							<div className="shrink-0">
								<div className="h-10 w-10 rounded-lg bg-red-50 dark:bg-red-950/50 flex items-center justify-center">
									<UserX className="h-5 w-5 text-red-600 dark:text-red-500" />
								</div>
							</div>
							<div className="flex-1">
								<h4 className="font-semibold text-sm mb-1">
									3rd Offense — Termination
								</h4>
								<p className="text-sm text-muted-foreground">
									Employment may be terminated. Final decision
									made by management.
								</p>
							</div>
						</div>
					</div>
				</CardContent>
			</Card>
		</div>
	);
}
