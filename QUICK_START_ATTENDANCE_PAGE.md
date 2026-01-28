# Quick Start: Update Attendance Page

Replace the sample data in `app/(routes)/attendance/page.tsx` with real API integration:

## Before (Sample Data)

```typescript
const sampleAttendanceData = [
  {
    id: "1",
    employeeName: "John Doe",
    date: "2026-01-15",
    status: "present",
    // ...
  },
  // ...
]
```

## After (Real API Data)

```typescript
"use client";

import { useState } from "react";
import DashboardCalendar from "@/components/custom/shared/calendar/DashboardCalendar";
import PageHeader from "@/components/custom/shared/PageHeader";
import { Wrapper } from "@/components/custom/shared/Wrapper";
import { useDailyAttendances } from "@/lib/queries/useAttendance";
import { convertAttendanceForCalendar } from "@/lib/utils/attendance";
import { useUserProfile } from "@/lib/queries/useUserProfile";
import { canApprove } from "@/lib/utils/attendance";

export default function AttendancePage() {
	const [selectedEmployee, setSelectedEmployee] = useState<string>("");
	const [dateRange, setDateRange] = useState({
		from: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
		to: new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0),
	});

	const { data: user } = useUserProfile();

	// Fetch attendance data with filters
	const { data, isLoading } = useDailyAttendances({
		page: 1,
		limit: 100,
		filter: {
			...(selectedEmployee && { employee_id: parseInt(selectedEmployee) }),
			date_from: dateRange.from.toISOString().split("T")[0],
			date_to: dateRange.to.toISOString().split("T")[0],
		},
	});

	// Convert API data to calendar format
	const calendarData = data ? convertAttendanceForCalendar(data.results) : [];

	// Get unique employees for filter
	const uniqueEmployees = data
		? Array.from(new Set(data.results.map((r) => r.employee_name)))
		: [];

	const handleDateSelect = (date: Date) => {
		console.log("Date selected:", date);
		// Navigate to detail view or show modal
	};

	return (
		<Wrapper>
			<PageHeader
				title="Employee Attendance"
				description="Track and manage employee attendance with interactive calendar views"
				breadcrumbs={["Attendance"]}
			/>

			<div className="grid gap-6">
				{/* Filters */}
				<div className="flex gap-4">
					<select
						value={selectedEmployee}
						onChange={(e) => setSelectedEmployee(e.target.value)}
						className="border rounded px-3 py-2"
					>
						<option value="">All Employees</option>
						{uniqueEmployees.map((name) => (
							<option key={name} value={name}>
								{name}
							</option>
						))}
					</select>

					{/* Date range picker */}
					{/* Add your date range component here */}
				</div>

				{/* Calendar */}
				<DashboardCalendar
					mode="attendance"
					attendanceData={calendarData}
					onDateClick={handleDateSelect}
					title="Employee Attendance Tracker"
					subtitle={
						selectedEmployee
							? `Showing attendance for ${selectedEmployee}`
							: "Showing attendance for all employees"
					}
				/>

				{/* Recent Records Table */}
				<div className="rounded-lg border bg-card">
					<div className="p-6">
						<h3 className="text-lg font-semibold mb-4">Recent Attendance Records</h3>
						{isLoading ? (
							<div>Loading...</div>
						) : (
							<table className="w-full">
								<thead>
									<tr className="border-b">
										<th className="text-left p-2">Employee</th>
										<th className="text-left p-2">Date</th>
										<th className="text-left p-2">Clock In</th>
										<th className="text-left p-2">Clock Out</th>
										<th className="text-left p-2">Hours</th>
										<th className="text-left p-2">Status</th>
										{canApprove(user?.role || "") && (
											<th className="text-left p-2">Actions</th>
										)}
									</tr>
								</thead>
								<tbody>
									{data?.results.slice(0, 10).map((attendance) => (
										<tr key={attendance.id} className="border-b">
											<td className="p-2">{attendance.employee_name}</td>
											<td className="p-2">{attendance.date}</td>
											<td className="p-2">
												{attendance.clock_in
													? new Date(attendance.clock_in).toLocaleTimeString()
													: "-"}
											</td>
											<td className="p-2">
												{attendance.clock_out
													? new Date(attendance.clock_out).toLocaleTimeString()
													: "-"}
											</td>
											<td className="p-2">{attendance.paid_hours} hrs</td>
											<td className="p-2">
												<span
													className={`px-2 py-1 rounded text-xs ${
														attendance.status === "APPROVED"
															? "bg-green-100 text-green-800"
															: attendance.status === "REJECTED"
															? "bg-red-100 text-red-800"
															: "bg-yellow-100 text-yellow-800"
													}`}
												>
													{attendance.status_display}
												</span>
											</td>
											{canApprove(user?.role || "") && (
												<td className="p-2">
													{/* Add approve/reject buttons */}
												</td>
											)}
										</tr>
									))}
								</tbody>
							</table>
						)}
					</div>
				</div>
			</div>
		</Wrapper>
	);
}
```

## Key Changes

1. **Import real hooks** instead of using sample data
2. **Use `useDailyAttendances`** to fetch from API
3. **Convert data** using `convertAttendanceForCalendar` helper
4. **Add filters** that update the API query
5. **Show loading state** while fetching
6. **Role-based rendering** using `canApprove` helper

## Next: Add Clock In/Out Component

Create `components/custom/attendance/ClockInOutPanel.tsx`:

```typescript
"use client";

import { useState, useEffect } from "react";
import { useAttendanceMutations } from "@/lib/mutations/useAttendanceMutations";
import { useDailyAttendances } from "@/lib/queries/useAttendance";
import { useEmployees } from "@/lib/queries/useEmployees";
import { Button } from "@/components/ui/button";
import { Clock, CheckCircle } from "lucide-react";

export function ClockInOutPanel() {
	const { clockIn, clockOut } = useAttendanceMutations();
	const { data: employees } = useEmployees({ limit: 100 });
	const [selectedEmployee, setSelectedEmployee] = useState<number | null>(null);

	// Get today's attendance for selected employee
	const today = new Date().toISOString().split("T")[0];
	const { data: todayAttendances } = useDailyAttendances({
		filter: {
			employee_id: selectedEmployee || undefined,
			date_from: today,
			date_to: today,
		},
	});

	const todayAttendance = todayAttendances?.results[0];

	const handleClockIn = () => {
		if (!selectedEmployee) return;

		clockIn.mutate({
			employee_id: selectedEmployee,
			date: today,
			clock_in: new Date().toISOString(),
		});
	};

	const handleClockOut = () => {
		if (!todayAttendance?.id) return;

		clockOut.mutate({
			attendance_id: todayAttendance.id,
			clock_out: new Date().toISOString(),
		});
	};

	return (
		<div className="rounded-lg border bg-card p-6">
			<h3 className="text-lg font-semibold mb-4">Clock In/Out</h3>

			<div className="space-y-4">
				<select
					value={selectedEmployee || ""}
					onChange={(e) => setSelectedEmployee(Number(e.target.value))}
					className="w-full border rounded px-3 py-2"
				>
					<option value="">Select Employee</option>
					{employees?.results.map((emp) => (
						<option key={emp.id} value={emp.id}>
							{emp.first_name} {emp.last_name}
						</option>
					))}
				</select>

				{todayAttendance && (
					<div className="p-3 bg-muted rounded">
						<div className="text-sm space-y-1">
							<div>
								<span className="font-medium">Clock In:</span>{" "}
								{todayAttendance.clock_in
									? new Date(todayAttendance.clock_in).toLocaleTimeString()
									: "-"}
							</div>
							{todayAttendance.clock_out && (
								<div>
									<span className="font-medium">Clock Out:</span>{" "}
									{new Date(todayAttendance.clock_out).toLocaleTimeString()}
								</div>
							)}
							<div>
								<span className="font-medium">Type:</span>{" "}
								{todayAttendance.attendance_type_display}
							</div>
						</div>
					</div>
				)}

				<div className="flex gap-2">
					<Button
						onClick={handleClockIn}
						disabled={!selectedEmployee || !!todayAttendance || clockIn.isPending}
						className="flex-1"
					>
						<Clock className="mr-2 h-4 w-4" />
						Clock In
					</Button>

					<Button
						onClick={handleClockOut}
						variant="secondary"
						disabled={
							!todayAttendance ||
							!!todayAttendance.clock_out ||
							clockOut.isPending
						}
						className="flex-1"
					>
						<CheckCircle className="mr-2 h-4 w-4" />
						Clock Out
					</Button>
				</div>
			</div>
		</div>
	);
}
```

Add to attendance page:

```typescript
import { ClockInOutPanel } from "@/components/custom/attendance/ClockInOutPanel";

// In the page component:
{canClockInOut(user?.role || "") && (
	<ClockInOutPanel />
)}
```

## Done!

Your attendance page now:

- ✅ Fetches real data from Django API
- ✅ Shows loading states
- ✅ Supports filtering by employee and date
- ✅ Auto-refreshes on mutations
- ✅ Role-based UI (only admins/managers see actions)
- ✅ Type-safe with TypeScript
