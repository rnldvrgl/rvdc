"use client";

import DatePicker from "@/components/custom/inputs/DatePicker";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
} from "@/components/ui/dialog";
import {
	Form,
	FormControl,
	FormField,
	FormItem,
	FormLabel,
} from "@/components/ui/form";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useCurrentUser } from "@/lib/hooks/useCurrentUser";
import { useLeaveRequestMutations } from "@/lib/mutations/useAttendanceMutations";
import { useLeaveRequests } from "@/lib/queries/useAttendance";
import { zodResolver } from "@hookform/resolvers/zod";
import { format } from "date-fns";
import { Loader2, Plus } from "lucide-react";
import { useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import * as z from "zod";

const LEAVE_TYPES = [
	{ value: "SICK", label: "Sick Leave" },
	{ value: "EMERGENCY", label: "Emergency Leave" },
];

const leaveRequestSchema = z.object({
	leave_type: z.enum(["SICK", "EMERGENCY"], {
		required_error: "Please select a leave type",
	}),
	date: z.date({
		required_error: "Please select a date",
	}),
	is_half_day: z.boolean(),
	shift_period: z.enum(["AM", "PM", "FULL"]),
	reason: z.string().min(10, {
		message: "Reason must be at least 10 characters",
	}),
});

type LeaveRequestFormValues = z.infer<typeof leaveRequestSchema>;

export function LeaveRequestForm() {
	const { user_id } = useCurrentUser();
	const [open, setOpen] = useState(false);
	const { createLeaveRequest } = useLeaveRequestMutations();

	const form = useForm<LeaveRequestFormValues>({
		resolver: zodResolver(leaveRequestSchema),
		defaultValues: {
			leave_type: "SICK",
			is_half_day: false,
			shift_period: "FULL",
			reason: "",
		},
	});

	const isHalfDay = form.watch("is_half_day");

	// Get user's existing leave requests to disable those dates
	const { data: myLeaves } = useLeaveRequests({
		filter: { employee_id: user_id, status__in: "PENDING,APPROVED" },
	});

	// Get dates that should be disabled (already have leave)
	const disabledDates = useMemo(() => {
		if (!myLeaves?.results) return [];
		return myLeaves.results
			.filter(
				(leave) =>
					leave.status === "PENDING" || leave.status === "APPROVED",
			)
			.map((leave) => new Date(leave.date));
	}, [myLeaves]);

	const onSubmit = async (data: LeaveRequestFormValues) => {
		// Auto-set shift_period based on is_half_day
		const shift_period = data.is_half_day ? data.shift_period : "FULL";

		try {
			await createLeaveRequest.mutateAsync({
				employee: user_id,
				leave_type: data.leave_type,
				date: format(data.date, "yyyy-MM-dd"),
				is_half_day: data.is_half_day,
				shift_period: shift_period,
				reason: data.reason,
			});
			setOpen(false);
			form.reset();
		} catch {
			// Error is handled by useApiMutation
		}
	};

	return (
		<Dialog open={open} onOpenChange={setOpen}>
			<DialogTrigger asChild>
				<Button>
					<Plus className="mr-2 h-4 w-4" />
					Request Leave
				</Button>
			</DialogTrigger>
			<DialogContent className="sm:max-w-md">
				<DialogHeader>
					<DialogTitle>Request Leave</DialogTitle>
					<DialogDescription>
						Submit a leave request for approval
					</DialogDescription>
				</DialogHeader>
				<Form {...form}>
					<form
						onSubmit={form.handleSubmit(onSubmit)}
						className="space-y-6"
					>
						{/* Leave Type */}
						<FormField
							control={form.control}
							name="leave_type"
							render={({ field }) => (
								<FormItem>
									<FormLabel>Leave Type</FormLabel>
									<Select
										onValueChange={field.onChange}
										value={field.value}
									>
										<FormControl>
											<SelectTrigger className="w-full">
												<SelectValue placeholder="Select leave type" />
											</SelectTrigger>
										</FormControl>
										<SelectContent>
											{LEAVE_TYPES.map((type) => (
												<SelectItem
													key={type.value}
													value={type.value}
												>
													{type.label}
												</SelectItem>
											))}
										</SelectContent>
									</Select>
								</FormItem>
							)}
						/>

						{/* Date Picker */}
						<FormField
							control={form.control}
							name="date"
							render={({ field }) => (
								<DatePicker
									field={field}
									disablePastDates={true}
									disabledDates={disabledDates}
								/>
							)}
						/>

						{/* Half Day */}
						<FormField
							control={form.control}
							name="is_half_day"
							render={({ field }) => (
								<FormItem className="flex flex-row items-center space-x-2 space-y-0">
									<FormControl>
										<Checkbox
											checked={field.value}
											onCheckedChange={(checked) => {
												field.onChange(checked);
												// Reset shift_period to FULL if unchecking half day
												if (!checked) {
													form.setValue(
														"shift_period",
														"FULL",
													);
												}
											}}
										/>
									</FormControl>
									<div className="space-y-1 leading-none">
										<FormLabel>Half day leave</FormLabel>
									</div>
								</FormItem>
							)}
						/>

						{/* Shift Period - Only show when half day is selected */}
						{isHalfDay && (
							<FormField
								control={form.control}
								name="shift_period"
								render={({ field }) => (
									<FormItem className="space-y-3">
										<FormLabel>
											Which shift are you leaving?
										</FormLabel>
										<FormControl>
											<RadioGroup
												onValueChange={field.onChange}
												value={field.value}
												className="flex flex-col space-y-2"
											>
												<div className="flex items-center space-x-2">
													<RadioGroupItem
														value="AM"
														id="am"
													/>
													<Label
														htmlFor="am"
														className="font-normal cursor-pointer"
													>
														Morning Shift
													</Label>
												</div>
												<div className="flex items-center space-x-2">
													<RadioGroupItem
														value="PM"
														id="pm"
													/>
													<Label
														htmlFor="pm"
														className="font-normal cursor-pointer"
													>
														Afternoon Shift
													</Label>
												</div>
											</RadioGroup>
										</FormControl>
									</FormItem>
								)}
							/>
						)}

						{/* Reason */}
						<FormField
							control={form.control}
							name="reason"
							render={({ field }) => (
								<FormItem>
									<FormLabel>Reason</FormLabel>
									<FormControl>
										<Textarea
											placeholder="Please provide a reason for your leave request..."
											className="resize-none"
											rows={4}
											{...field}
										/>
									</FormControl>
								</FormItem>
							)}
						/>

						<DialogFooter>
							<Button
								type="button"
								variant="outline"
								onClick={() => setOpen(false)}
								disabled={createLeaveRequest.isPending}
							>
								Cancel
							</Button>
							<Button
								type="submit"
								disabled={createLeaveRequest.isPending}
							>
								{createLeaveRequest.isPending ? (
									<>
										<Loader2 className="mr-2 h-4 w-4 animate-spin" />
										Submitting...
									</>
								) : (
									"Submit Request"
								)}
							</Button>
						</DialogFooter>
					</form>
				</Form>
			</DialogContent>
		</Dialog>
	);
}
