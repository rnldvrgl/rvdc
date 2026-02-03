"use client";

import {
	AttendanceTypeBadge,
	AwolBadge,
} from "@/components/custom/attendance/AttendanceBadges";
import { UniformPenaltyCheckboxes } from "@/components/custom/attendance/UniformPenaltyCheckboxes";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import { DailyAttendance } from "@/lib/constants/types";
import { useCurrentUser } from "@/lib/hooks/useCurrentUser";
import useSearchParameters from "@/lib/hooks/useSearchParameters";
import { useAttendanceMutations } from "@/lib/mutations/useAttendanceMutations";
import { usePendingAttendanceApprovals } from "@/lib/queries/useAttendance";
import { canApprove, formatDate, formatTime } from "@/lib/utils/attendance";
import { formatMinutesToHours } from "@/lib/utils/helpers";
import {
	AlertTriangle,
	CheckCircle,
	ChevronDown,
	ChevronRight,
	Clock,
	Loader2,
	XCircle,
} from "lucide-react";
import { Fragment, useState } from "react";

export function AttendanceApproval() {
	const { role } = useCurrentUser();
	const { filter } = useSearchParameters();
	const [selectedAttendanceId, setSelectedAttendanceId] = useState<
		number | null
	>(null);
	const [expandedRows, setExpandedRows] = useState<Set<number>>(new Set());
	const [notes, setNotes] = useState("");
	const [selectedItems, setSelectedItems] = useState<Set<number>>(new Set());

	const toggleSelectItem = (id: number) => {
		const newSelected = new Set(selectedItems);
		if (newSelected.has(id)) {
			newSelected.delete(id);
		} else {
			newSelected.add(id);
		}
		setSelectedItems(newSelected);
	};

	const toggleSelectAll = () => {
		if (selectedItems.size === pendingApprovals?.length) {
			setSelectedItems(new Set());
		} else {
			setSelectedItems(new Set(pendingApprovals?.map((a) => a.id) || []));
		}
	};

	const handleBulkApprove = async () => {
		try {
			await approveAttendance.mutateAsync({
				attendance_ids: Array.from(selectedItems),
			});
			setSelectedItems(new Set());
			setNotes("");
		} catch {
			// Error is handled by useApiMutation
		}
	};

	const handleBulkReject = async () => {
		try {
			await rejectAttendance.mutateAsync({
				attendance_ids: Array.from(selectedItems),
				reason: notes || undefined,
			});
			setSelectedItems(new Set());
			setNotes("");
		} catch {
			// Error is handled by useApiMutation
		}
	};

	// Check if user can approve
	const hasApprovalRights = canApprove(role || "");

	// Fetch pending approvals
	const { data: pendingApprovals, isLoading: approvalsLoading } =
		usePendingAttendanceApprovals({ filter });

	// Mutations
	const { approveAttendance, rejectAttendance } = useAttendanceMutations();

	const handleApprove = async (attendanceId: number) => {
		setSelectedAttendanceId(attendanceId);
		try {
			await approveAttendance.mutateAsync({
				attendance_ids: [attendanceId],
			});
			setNotes("");
			setSelectedAttendanceId(null);
		} catch {
			// Error is handled by useApiMutation
			setSelectedAttendanceId(null);
		}
	};

	const toggleRow = (attendanceId: number) => {
		const newExpanded = new Set(expandedRows);
		if (newExpanded.has(attendanceId)) {
			newExpanded.delete(attendanceId);
		} else {
			newExpanded.add(attendanceId);
		}
		setExpandedRows(newExpanded);
	};

	const handleReject = async (attendanceId: number) => {
		setSelectedAttendanceId(attendanceId);
		try {
			await rejectAttendance.mutateAsync({
				attendance_ids: [attendanceId],
				reason: notes || undefined,
			});
			setNotes("");
			setSelectedAttendanceId(null);
		} catch {
			// Error is handled by useApiMutation
			setSelectedAttendanceId(null);
		}
	};

	const isLoading = approveAttendance.isPending || rejectAttendance.isPending;

	if (!hasApprovalRights) {
		return null;
	}

	if (approvalsLoading) {
		return (
			<Card>
				<CardHeader className="border-b">
					<CardTitle className="flex items-center gap-2">
						<Clock className="h-5 w-5" />
						Pending Attendance Approvals
					</CardTitle>
				</CardHeader>
				<CardContent>
					<div className="flex justify-center py-6">
						<Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
					</div>
				</CardContent>
			</Card>
		);
	}

	if (!pendingApprovals || pendingApprovals.length === 0) {
		return (
			<Card>
				<CardHeader className="border-b">
					<div className="flex flex-col sm:flex-row items-center justify-center sm:justify-between">
						<div className="flex flex-col sm:flex-row gap-2">
							<div className="p-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 w-fit mx-auto">
								<Clock className="size-4 text-slate-600 dark:text-slate-400" />
							</div>
							<CardTitle className="text-base md:text-lg font-semibold">
								Pending Attendance Approvals
							</CardTitle>
						</div>
					</div>
				</CardHeader>
				<CardContent>
					<div className="text-center py-6 text-muted-foreground">
						No pending attendance records to review.
					</div>
				</CardContent>
			</Card>
		);
	}

	return (
		<Card>
			<CardHeader>
				<div className="flex flex-col gap-4">
					<div className="flex items-center justify-between">
						<div className="flex flex-col sm:flex-row items-center justify-center sm:justify-between">
							<div className="flex flex-col sm:flex-row gap-2">
								<div className="p-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 w-fit mx-auto">
									<Clock className="size-4 text-slate-600 dark:text-slate-400" />
								</div>
								<CardTitle className="text-base md:text-lg font-semibold">
									Pending Attendance Approvals
								</CardTitle>
							</div>
						</div>
						<Badge variant="secondary">
							{pendingApprovals.length} pending
						</Badge>
					</div>
					{selectedItems.size > 0 && (
						<div className="flex items-center gap-2 flex-wrap">
							<span className="text-sm text-muted-foreground">
								{selectedItems.size} selected
							</span>
							<Button
								size="sm"
								variant="outline"
								className="text-green-600 hover:text-green-700 hover:bg-green-50"
								onClick={handleBulkApprove}
								disabled={isLoading}
							>
								<CheckCircle className="h-4 w-4 mr-1" />
								Approve Selected
							</Button>
							<Button
								size="sm"
								variant="outline"
								className="text-red-600 hover:text-red-700 hover:bg-red-50"
								onClick={handleBulkReject}
								disabled={isLoading}
							>
								<XCircle className="h-4 w-4 mr-1" />
								Reject Selected
							</Button>
							<Button
								size="sm"
								variant="ghost"
								onClick={() => setSelectedItems(new Set())}
							>
								Clear
							</Button>
						</div>
					)}
				</div>
			</CardHeader>
			<CardContent>
				<div className="rounded-md border">
					<Table>
						<TableHeader>
							<TableRow>
								<TableHead className="w-10">
									<Checkbox
										checked={
											selectedItems.size ===
												pendingApprovals?.length &&
											pendingApprovals?.length > 0
										}
										onCheckedChange={toggleSelectAll}
									/>
								</TableHead>
								<TableHead className="w-10"></TableHead>
								<TableHead>Employee</TableHead>
								<TableHead>Date</TableHead>
								<TableHead>Clock In</TableHead>
								<TableHead>Clock Out</TableHead>
								<TableHead>Hours</TableHead>
								<TableHead>Status</TableHead>
								<TableHead>Notes</TableHead>
								<TableHead className="text-right">
									Actions
								</TableHead>
							</TableRow>
						</TableHeader>
						<TableBody>
							{pendingApprovals?.map(
								(attendance: DailyAttendance) => {
									const clockInTime = attendance.clock_in
										? formatTime(attendance.clock_in)
										: "—";
									const clockOutTime = attendance.clock_out
										? formatTime(attendance.clock_out)
										: "—";
									const hoursWorked =
										attendance.paid_hours || "—";
									const isExpanded = expandedRows.has(
										attendance.id,
									);

									return (
										<Fragment key={attendance.id}>
											<TableRow>
												<TableCell>
													<Checkbox
														checked={selectedItems.has(
															attendance.id,
														)}
														onCheckedChange={() =>
															toggleSelectItem(
																attendance.id,
															)
														}
													/>
												</TableCell>
												<TableCell>
													<Button
														variant="ghost"
														size="sm"
														className="h-8 w-8 p-0"
														onClick={() =>
															toggleRow(
																attendance.id,
															)
														}
													>
														{isExpanded ? (
															<ChevronDown className="h-4 w-4" />
														) : (
															<ChevronRight className="h-4 w-4" />
														)}
													</Button>
												</TableCell>
												<TableCell className="font-medium">
													<div className="space-y-1">
														<div>
															{attendance.employee_name ||
																"Unknown"}
														</div>
														{attendance.is_awol && (
															<AwolBadge
																isAwol={
																	attendance.is_awol
																}
																consecutiveAbsences={
																	attendance.consecutive_absences
																}
															/>
														)}
													</div>
												</TableCell>
												<TableCell>
													{formatDate(
														attendance.date,
													)}
												</TableCell>
												<TableCell>
													{clockInTime}
													{attendance.is_late && (
														<div className="text-xs text-amber-600 flex items-center gap-1 mt-1">
															<AlertTriangle className="h-3 w-3" />
															Late{" "}
															{formatMinutesToHours(
																attendance.late_minutes,
															)}
														</div>
													)}
												</TableCell>
												<TableCell>
													{clockOutTime}
												</TableCell>
												<TableCell>
													{hoursWorked}
													{attendance.late_penalty_amount &&
														parseFloat(
															attendance.late_penalty_amount,
														) > 0 && (
															<div className="text-xs text-red-600 mt-1">
																-₱
																{
																	attendance.late_penalty_amount
																}
															</div>
														)}
													{attendance.uniform_penalty_amount &&
														parseFloat(
															attendance.uniform_penalty_amount,
														) > 0 && (
															<div className="text-xs text-red-600 mt-1">
																Uniform: -₱
																{
																	attendance.uniform_penalty_amount
																}
															</div>
														)}
												</TableCell>
												<TableCell>
													<AttendanceTypeBadge
														type={
															attendance.attendance_type
														}
													/>
												</TableCell>
												<TableCell className="max-w-xs truncate">
													{attendance.notes || "—"}
												</TableCell>
												<TableCell>
													<div className="flex justify-end gap-2">
														<Button
															size="sm"
															variant="outline"
															className="text-green-600 hover:text-green-700 hover:bg-green-50"
															disabled={
																isLoading ||
																selectedAttendanceId ===
																	attendance.id
															}
															onClick={() =>
																handleApprove(
																	attendance.id,
																)
															}
														>
															{selectedAttendanceId ===
																attendance.id &&
															approveAttendance.isPending ? (
																<Loader2 className="h-4 w-4 animate-spin" />
															) : (
																<>
																	<CheckCircle className="h-4 w-4 mr-1" />
																	Approve
																</>
															)}
														</Button>
														<Button
															size="sm"
															variant="outline"
															className="text-red-600 hover:text-red-700 hover:bg-red-50"
															disabled={
																isLoading ||
																selectedAttendanceId ===
																	attendance.id
															}
															onClick={() =>
																handleReject(
																	attendance.id,
																)
															}
														>
															{selectedAttendanceId ===
																attendance.id &&
															rejectAttendance.isPending ? (
																<Loader2 className="h-4 w-4 animate-spin" />
															) : (
																<>
																	<XCircle className="h-4 w-4 mr-1" />
																	Reject
																</>
															)}
														</Button>
													</div>
												</TableCell>
											</TableRow>

											{/* Expanded Row for Uniform Penalties */}
											{isExpanded && (
												<TableRow>
													<TableCell
														colSpan={10}
														className="bg-muted/20"
													>
														<div className="py-4 px-6">
															<UniformPenaltyCheckboxes
																attendance={
																	attendance
																}
															/>
														</div>
													</TableCell>
												</TableRow>
											)}
										</Fragment>
									);
								},
							)}
						</TableBody>
					</Table>
				</div>

				{/* Optional notes for approval/rejection */}
				{selectedAttendanceId && (
					<div className="mt-4 space-y-2">
						<label className="text-sm font-medium">
							Notes (optional)
						</label>
						<Textarea
							placeholder="Add notes for approval/rejection..."
							value={notes}
							onChange={(e) => setNotes(e.target.value)}
							disabled={isLoading}
							rows={2}
						/>
					</div>
				)}
			</CardContent>
		</Card>
	);
}
