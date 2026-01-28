# Frontend Integration Guide - Attendance System

## Overview

This guide covers the React/Next.js frontend integration for the attendance, leave, and payroll system.

---

## File Structure

```
rvdc/
├── lib/
│   ├── constants/
│   │   └── types.ts                    # Added attendance types
│   ├── queries/
│   │   └── useAttendance.ts            # NEW: React Query hooks
│   ├── mutations/
│   │   └── useAttendanceMutations.ts   # NEW: Mutation hooks
│   └── utils/
│       └── attendance.ts               # NEW: Helper functions
├── app/
│   └── (routes)/
│       └── attendance/
│           └── page.tsx                # Existing page (needs update)
└── components/
    └── custom/
        └── attendance/                 # NEW: Attendance components
```

---

## 1. Types (Added to `lib/constants/types.ts`)

### Core Types

```typescript
// Attendance types
export type AttendanceType =
  | "FULL_DAY"
  | "HALF_DAY"
  | "PARTIAL"
  | "ABSENT"
  | "LEAVE"
export type AttendanceStatus = "PENDING" | "APPROVED" | "REJECTED"
export type LeaveType = "SICK" | "EMERGENCY"
export type LeaveStatus = "PENDING" | "APPROVED" | "REJECTED" | "CANCELLED"

// Main entities
export type DailyAttendance = BaseEntity & {
  employee: number
  employee_name: string
  date: string
  clock_in: string | null
  clock_out: string | null
  attendance_type: AttendanceType
  attendance_type_display: string
  total_hours: string
  break_hours: string
  paid_hours: string
  is_late: boolean
  late_minutes: number
  late_penalty_amount: string
  status: AttendanceStatus
  status_display: string
  approved_by: number | null
  approved_by_name: string | null
  approved_at: string | null
  notes: string
}

export type LeaveBalance = BaseEntity & {
  employee: number
  employee_name: string
  year: number
  sick_leave_total: number
  sick_leave_used: string
  sick_leave_remaining: string
  emergency_leave_total: number
  emergency_leave_used: string
  emergency_leave_remaining: string
}

export type LeaveRequest = BaseEntity & {
  employee: number
  employee_name: string
  leave_type: LeaveType
  leave_type_display: string
  date: string
  is_half_day: boolean
  days_count: string
  reason: string
  status: LeaveStatus
  status_display: string
  approved_by: number | null
  approved_by_name: string | null
  approved_at: string | null
  rejection_reason: string
}
```

---

## 2. React Query Hooks

### Import

```typescript
import {
  useDailyAttendances,
  usePendingAttendanceApprovals,
  useLeaveBalances,
  useMyLeaveBalance,
  useLeaveRequests,
  usePendingLeaveApprovals,
} from "@/lib/queries/useAttendance"
```

### Usage Examples

#### Fetch Attendance Records

```typescript
const { data, isLoading, error } = useDailyAttendances({
  page: 1,
  limit: 10,
  filter: {
    employee_id: 5,
    status: "PENDING",
    date_from: "2026-01-01",
    date_to: "2026-01-31",
  },
})

// Response: PaginatedResult<DailyAttendance>
// {
//   count: 25,
//   next: "...",
//   previous: null,
//   results: [...]
// }
```

#### Get Pending Approvals

```typescript
const { data: pendingAttendances } = usePendingAttendanceApprovals()
// Returns: DailyAttendance[]
```

#### Get My Leave Balance

```typescript
const { data: myBalance } = useMyLeaveBalance()
// Returns: LeaveBalance
// {
//   sick_leave_remaining: "3.00",
//   emergency_leave_remaining: "4.00",
//   ...
// }
```

#### Filter Leave Requests

```typescript
const { data } = useLeaveRequests({
  filter: {
    employee_id: 5,
    status: "APPROVED",
    leave_type: "SICK",
  },
})
```

---

## 3. Mutation Hooks

### Import

```typescript
import {
  useAttendanceMutations,
  useLeaveRequestMutations,
} from "@/lib/mutations/useAttendanceMutations"
```

### Usage Examples

#### Clock In

```typescript
const { clockIn } = useAttendanceMutations()

const handleClockIn = (employeeId: number) => {
  clockIn.mutate({
    employee_id: employeeId,
    date: new Date().toISOString().split("T")[0],
    clock_in: new Date().toISOString(),
    notes: "Regular shift",
  })
}

// Success: Automatically invalidates queries and shows success toast
```

#### Clock Out

```typescript
const { clockOut } = useAttendanceMutations()

const handleClockOut = (attendanceId: number) => {
  clockOut.mutate({
    attendance_id: attendanceId,
    clock_out: new Date().toISOString(),
  })
}
```

#### Approve Attendance (Bulk)

```typescript
const { approveAttendance } = useAttendanceMutations()

const handleBulkApprove = (ids: number[]) => {
  approveAttendance.mutate({
    attendance_ids: ids,
  })
}
```

#### Create Leave Request

```typescript
const { createLeaveRequest } = useLeaveRequestMutations()

const handleSubmitLeave = (formData) => {
  createLeaveRequest.mutate({
    leave_type: "SICK",
    date: "2026-01-30",
    is_half_day: false,
    reason: "Medical appointment",
  })
}
```

#### Approve Leave

```typescript
const { approveLeave } = useLeaveRequestMutations()

const handleApproveLeave = (leaveRequestIds: number[]) => {
  approveLeave.mutate({
    leave_request_ids: leaveRequestIds,
  })
}
```

---

## 4. Utility Functions

### Import

```typescript
import {
  formatTime,
  formatDate,
  formatHours,
  formatCurrency,
  getAttendanceStatusVariant,
  getAttendanceTypeColor,
  calculateLateStatus,
  canApprove,
  validateLeaveBalance,
} from "@/lib/utils/attendance"
```

### Examples

#### Format Display Values

```typescript
formatTime("2026-01-27T08:20:00+08:00") // "08:20 AM"
formatDate("2026-01-27") // "Jan 27, 2026"
formatHours("8.50") // "8.50 hrs"
formatCurrency("150.00") // "₱150.00"
```

#### Status Variants

```typescript
getAttendanceStatusVariant("APPROVED") // "success"
getAttendanceTypeColor("FULL_DAY") // "text-green-600 bg-green-50"
```

#### Late Status

```typescript
calculateLateStatus(true, 20)
// { severity: "minor", message: "20 min late" }

calculateLateStatus(true, 35)
// { severity: "major", message: "35 min late (Half-day)" }
```

#### Permission Checks

```typescript
canApprove(user.role) // true if admin/manager
canClockInOut(user.role) // true if admin/manager
```

#### Validation

```typescript
validateLeaveBalance("SICK", false, myBalance)
// { valid: true } or
// { valid: false, message: "Insufficient sick leave balance..." }
```

---

## 5. Component Examples

### Clock In/Out Component

```typescript
"use client";

import { useState } from "react";
import { useAttendanceMutations } from "@/lib/mutations/useAttendanceMutations";
import { useEmployees } from "@/lib/queries/useEmployees";
import { Button } from "@/components/ui/button";
import { Clock } from "lucide-react";

export function ClockInOutButtons({ employee }) {
	const { clockIn, clockOut } = useAttendanceMutations();
	const [todayAttendance, setTodayAttendance] = useState(null);

	const handleClockIn = () => {
		clockIn.mutate({
			employee_id: employee.id,
			date: new Date().toISOString().split("T")[0],
			clock_in: new Date().toISOString(),
		}, {
			onSuccess: (data) => {
				setTodayAttendance(data);
			},
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
		<div className="flex gap-2">
			<Button
				onClick={handleClockIn}
				disabled={clockIn.isPending || !!todayAttendance}
			>
				<Clock className="mr-2 h-4 w-4" />
				Clock In
			</Button>

			<Button
				onClick={handleClockOut}
				variant="secondary"
				disabled={clockOut.isPending || !todayAttendance}
			>
				<Clock className="mr-2 h-4 w-4" />
				Clock Out
			</Button>
		</div>
	);
}
```

### Attendance Table with Filtering

```typescript
"use client";

import { useState } from "react";
import { useDailyAttendances } from "@/lib/queries/useAttendance";
import { useAttendanceMutations } from "@/lib/mutations/useAttendanceMutations";
import { formatTime, formatHours, getAttendanceStatusVariant } from "@/lib/utils/attendance";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export function AttendanceTable() {
	const [filters, setFilters] = useState({
		page: 1,
		limit: 20,
		filter: { status: "PENDING" },
	});

	const { data, isLoading } = useDailyAttendances(filters);
	const { approveAttendance } = useAttendanceMutations();

	const handleApprove = (id: number) => {
		approveAttendance.mutate({ attendance_ids: [id] });
	};

	if (isLoading) return <div>Loading...</div>;

	return (
		<table>
			<thead>
				<tr>
					<th>Employee</th>
					<th>Date</th>
					<th>Clock In</th>
					<th>Clock Out</th>
					<th>Paid Hours</th>
					<th>Status</th>
					<th>Actions</th>
				</tr>
			</thead>
			<tbody>
				{data?.results.map((attendance) => (
					<tr key={attendance.id}>
						<td>{attendance.employee_name}</td>
						<td>{attendance.date}</td>
						<td>{formatTime(attendance.clock_in)}</td>
						<td>{formatTime(attendance.clock_out)}</td>
						<td>{formatHours(attendance.paid_hours)}</td>
						<td>
							<Badge variant={getAttendanceStatusVariant(attendance.status)}>
								{attendance.status_display}
							</Badge>
						</td>
						<td>
							{attendance.status === "PENDING" && (
								<Button
									size="sm"
									onClick={() => handleApprove(attendance.id)}
								>
									Approve
								</Button>
							)}
						</td>
					</tr>
				))}
			</tbody>
		</table>
	);
}
```

### Leave Request Form

```typescript
"use client";

import { useForm } from "react-hook-form";
import { useLeaveRequestMutations } from "@/lib/mutations/useAttendanceMutations";
import { useMyLeaveBalance } from "@/lib/queries/useAttendance";
import { validateLeaveBalance } from "@/lib/utils/attendance";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

export function LeaveRequestForm() {
	const { register, handleSubmit, watch, formState: { errors } } = useForm();
	const { createLeaveRequest } = useLeaveRequestMutations();
	const { data: balance } = useMyLeaveBalance();

	const leaveType = watch("leave_type");
	const isHalfDay = watch("is_half_day");

	const onSubmit = (data) => {
		// Validate balance
		if (balance) {
			const validation = validateLeaveBalance(data.leave_type, data.is_half_day, balance);
			if (!validation.valid) {
				alert(validation.message);
				return;
			}
		}

		createLeaveRequest.mutate(data);
	};

	return (
		<form onSubmit={handleSubmit(onSubmit)}>
			<select {...register("leave_type", { required: true })}>
				<option value="SICK">Sick Leave</option>
				<option value="EMERGENCY">Emergency Leave</option>
			</select>

			<Input
				type="date"
				{...register("date", { required: true })}
			/>

			<label>
				<input type="checkbox" {...register("is_half_day")} />
				Half Day
			</label>

			<Textarea
				{...register("reason", { required: true })}
				placeholder="Reason for leave"
			/>

			{balance && (
				<div className="text-sm text-muted-foreground">
					{leaveType === "SICK" && (
						<span>Sick leave remaining: {balance.sick_leave_remaining} days</span>
					)}
					{leaveType === "EMERGENCY" && (
						<span>Emergency leave remaining: {balance.emergency_leave_remaining} days</span>
					)}
				</div>
			)}

			<Button type="submit" disabled={createLeaveRequest.isPending}>
				Submit Request
			</Button>
		</form>
	);
}
```

### Leave Balance Card

```typescript
"use client";

import { useMyLeaveBalance } from "@/lib/queries/useAttendance";
import { getLeaveBalanceStatus } from "@/lib/utils/attendance";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";

export function LeaveBalanceCard() {
	const { data: balance, isLoading } = useMyLeaveBalance();

	if (isLoading) return <div>Loading...</div>;
	if (!balance) return null;

	const sickStatus = getLeaveBalanceStatus(balance.sick_leave_remaining);
	const emergencyStatus = getLeaveBalanceStatus(balance.emergency_leave_remaining);

	return (
		<Card>
			<CardHeader>
				<CardTitle>My Leave Balance ({balance.year})</CardTitle>
			</CardHeader>
			<CardContent className="space-y-4">
				<div>
					<div className="flex justify-between items-center">
						<span>Sick Leave</span>
						<span className={sickStatus.color}>
							{balance.sick_leave_remaining} / {balance.sick_leave_total} days
						</span>
					</div>
				</div>
				<div>
					<div className="flex justify-between items-center">
						<span>Emergency Leave</span>
						<span className={emergencyStatus.color}>
							{balance.emergency_leave_remaining} / {balance.emergency_leave_total} days
						</span>
					</div>
				</div>
			</CardContent>
		</Card>
	);
}
```

---

## 6. Role-Based Rendering

### Permission-Based Components

```typescript
"use client";

import { useUserProfile } from "@/lib/queries/useUserProfile";
import { canApprove, canClockInOut } from "@/lib/utils/attendance";

export function AttendanceActions() {
	const { data: user } = useUserProfile();

	if (!user) return null;

	return (
		<div>
			{canClockInOut(user.role) && (
				<div>
					{/* Clock in/out buttons */}
				</div>
			)}

			{canApprove(user.role) && (
				<div>
					{/* Approval buttons */}
				</div>
			)}
		</div>
	);
}
```

---

## 7. Integration with Existing Calendar

### Update Calendar Component

```typescript
// In app/(routes)/attendance/page.tsx

import { useDailyAttendances } from "@/lib/queries/useAttendance";
import { convertAttendanceForCalendar } from "@/lib/utils/attendance";

export default function AttendancePage() {
	const { data } = useDailyAttendances({
		filter: {
			date_from: startOfMonth.toISOString().split("T")[0],
			date_to: endOfMonth.toISOString().split("T")[0],
		},
	});

	const calendarData = data ? convertAttendanceForCalendar(data.results) : [];

	return (
		<DashboardCalendar
			mode="attendance"
			attendanceData={calendarData}
			// ... other props
		/>
	);
}
```

---

## 8. Error Handling

All mutations automatically handle errors and show toast notifications. Additional error handling:

```typescript
const { clockIn } = useAttendanceMutations()

clockIn.mutate(payload, {
  onError: (error) => {
    console.error("Clock in failed:", error)
    // Custom error handling
  },
  onSuccess: (data) => {
    console.log("Clocked in successfully:", data)
    // Custom success handling
  },
})
```

---

## 9. Testing

### Mock Data

```typescript
const mockAttendance: DailyAttendance = {
  id: 1,
  employee: 5,
  employee_name: "Juan Dela Cruz",
  date: "2026-01-27",
  clock_in: "2026-01-27T08:00:00+08:00",
  clock_out: "2026-01-27T18:00:00+08:00",
  attendance_type: "FULL_DAY",
  attendance_type_display: "Full Day",
  total_hours: "10.00",
  break_hours: "2.00",
  paid_hours: "8.00",
  is_late: false,
  late_minutes: 0,
  late_penalty_amount: "0.00",
  status: "APPROVED",
  status_display: "Approved",
  approved_by: 1,
  approved_by_name: "Admin User",
  approved_at: "2026-01-27T19:00:00+08:00",
  notes: "",
  created_at: "2026-01-27T08:00:00+08:00",
  updated_at: "2026-01-27T19:00:00+08:00",
}
```

---

## 10. Best Practices

### ✅ DO

- Use React Query hooks for all API calls
- Leverage automatic cache invalidation
- Validate leave balance before submission
- Check user permissions before showing actions
- Use utility functions for formatting
- Handle loading and error states

### ❌ DON'T

- Call API directly with `fetch` or `axios`
- Manually manage cache invalidation
- Show approval buttons to non-admin/manager users
- Allow clock in/out for regular employees
- Assume backend data format (use types)

---

## Summary

**Files Created:**

- `lib/constants/types.ts` - Attendance type definitions
- `lib/queries/useAttendance.ts` - React Query hooks
- `lib/mutations/useAttendanceMutations.ts` - Mutation hooks
- `lib/utils/attendance.ts` - Utility functions

**Integration Points:**

1. Update attendance page to use real data
2. Add clock in/out components
3. Add leave request forms
4. Add approval workflows (admin/manager)
5. Integrate with existing calendar

All hooks follow the existing pattern in your codebase and include automatic:

- Loading states
- Error handling
- Toast notifications
- Cache invalidation
- Type safety
