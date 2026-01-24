"use client";

import { useState } from "react";
import DashboardCalendar from "@/components/custom/shared/calendar/DashboardCalendar";
import PageHeader from "@/components/custom/shared/PageHeader";
import { Wrapper } from "@/components/custom/shared/Wrapper";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
	Users,
	Clock,
	CheckCircle,
	XCircle,
	AlertTriangle,
} from "lucide-react";

// Get current date for sample data
const today = new Date();
const currentMonth = today.getMonth();
const currentYear = today.getFullYear();

// Sample attendance data with current month dates
const sampleAttendanceData = [
	{
		id: "1",
		employeeName: "John Doe",
		date: new Date(currentYear, currentMonth, 15)
			.toISOString()
			.split("T")[0],
		status: "present" as const,
		checkIn: "9:00 AM",
		checkOut: "5:30 PM",
		hours: 8.5,
	},
	{
		id: "2",
		employeeName: "Jane Smith",
		date: new Date(currentYear, currentMonth, 15)
			.toISOString()
			.split("T")[0],
		status: "late" as const,
		checkIn: "9:15 AM",
		checkOut: "5:30 PM",
		hours: 8.25,
	},
	{
		id: "3",
		employeeName: "Bob Wilson",
		date: new Date(currentYear, currentMonth, 15)
			.toISOString()
			.split("T")[0],
		status: "absent" as const,
		checkIn: undefined,
		checkOut: undefined,
		hours: 0,
	},
	{
		id: "4",
		employeeName: "Alice Johnson",
		date: new Date(currentYear, currentMonth, 16)
			.toISOString()
			.split("T")[0],
		status: "sick" as const,
		checkIn: undefined,
		checkOut: undefined,
		hours: 0,
	},
	{
		id: "5",
		employeeName: "Mike Brown",
		date: new Date(currentYear, currentMonth, 16)
			.toISOString()
			.split("T")[0],
		status: "vacation" as const,
		checkIn: undefined,
		checkOut: undefined,
		hours: 0,
	},
	{
		id: "6",
		employeeName: "Sarah Davis",
		date: new Date(currentYear, currentMonth, 16)
			.toISOString()
			.split("T")[0],
		status: "present" as const,
		checkIn: "8:45 AM",
		checkOut: "5:15 PM",
		hours: 8.5,
	},
	{
		id: "7",
		employeeName: "Tom Wilson",
		date: new Date(currentYear, currentMonth, 17)
			.toISOString()
			.split("T")[0],
		status: "present" as const,
		checkIn: "9:05 AM",
		checkOut: "5:35 PM",
		hours: 8.5,
	},
	{
		id: "8",
		employeeName: "Lisa Anderson",
		date: new Date(currentYear, currentMonth, 17)
			.toISOString()
			.split("T")[0],
		status: "late" as const,
		checkIn: "9:20 AM",
		checkOut: "5:30 PM",
		hours: 8.17,
	},
	{
		id: "9",
		employeeName: "John Doe",
		date: new Date().toISOString().split("T")[0], // Today
		status: "present" as const,
		checkIn: "8:55 AM",
		checkOut: "5:25 PM",
		hours: 8.5,
	},
	{
		id: "10",
		employeeName: "Jane Smith",
		date: new Date().toISOString().split("T")[0], // Today
		status: "present" as const,
		checkIn: "9:00 AM",
		checkOut: "5:30 PM",
		hours: 8.5,
	},
];

const AttendancePage = () => {
	const [selectedEmployee, setSelectedEmployee] = useState<string | null>(
		null,
	);

	// Filter data by selected employee
	const filteredData = selectedEmployee
		? sampleAttendanceData.filter(
				(record) => record.employeeName === selectedEmployee,
			)
		: sampleAttendanceData;

	// Get unique employees
	const employees = Array.from(
		new Set(sampleAttendanceData.map((record) => record.employeeName)),
	).sort();

	// Calculate summary stats
	const totalRecords = filteredData.length;
	const presentCount = filteredData.filter(
		(record) => record.status === "present",
	).length;
	const lateCount = filteredData.filter(
		(record) => record.status === "late",
	).length;
	const absentCount = filteredData.filter(
		(record) => record.status === "absent",
	).length;
	const totalHours = filteredData.reduce(
		(sum, record) => sum + record.hours,
		0,
	);

	const handleEventClick = (event: {
		id: string;
		title: string;
		extendedProps?: Record<string, unknown>;
	}) => {
		console.log("Attendance event clicked:", event);
		// You can add custom handling here, like opening a detail modal
	};

	const handleDateClick = (date: Date) => {
		console.log("Date clicked:", date);
		// You can add custom handling here, like adding new attendance record
	};

	return (
		<Wrapper>
			<PageHeader
				icon={Users}
				title="Employee Attendance"
				description="Track and manage employee attendance with interactive calendar views"
				breadcrumbs={["Attendance"]}
			/>

			<div className="space-y-6">
				{/* Summary Cards */}
				<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
					<Card>
						<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
							<CardTitle className="text-sm font-medium">
								Total Records
							</CardTitle>
							<Users className="h-4 w-4 text-muted-foreground" />
						</CardHeader>
						<CardContent>
							<div className="text-2xl font-bold">
								{totalRecords}
							</div>
						</CardContent>
					</Card>

					<Card>
						<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
							<CardTitle className="text-sm font-medium">
								Present
							</CardTitle>
							<CheckCircle className="h-4 w-4 text-green-600" />
						</CardHeader>
						<CardContent>
							<div className="text-2xl font-bold text-green-600">
								{presentCount}
							</div>
						</CardContent>
					</Card>

					<Card>
						<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
							<CardTitle className="text-sm font-medium">
								Late
							</CardTitle>
							<AlertTriangle className="h-4 w-4 text-amber-600" />
						</CardHeader>
						<CardContent>
							<div className="text-2xl font-bold text-amber-600">
								{lateCount}
							</div>
						</CardContent>
					</Card>

					<Card>
						<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
							<CardTitle className="text-sm font-medium">
								Absent
							</CardTitle>
							<XCircle className="h-4 w-4 text-red-600" />
						</CardHeader>
						<CardContent>
							<div className="text-2xl font-bold text-red-600">
								{absentCount}
							</div>
						</CardContent>
					</Card>

					<Card>
						<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
							<CardTitle className="text-sm font-medium">
								Total Hours
							</CardTitle>
							<Clock className="h-4 w-4 text-muted-foreground" />
						</CardHeader>
						<CardContent>
							<div className="text-2xl font-bold">
								{totalHours.toFixed(1)}
							</div>
						</CardContent>
					</Card>
				</div>

				{/* Employee Filter */}
				<Card>
					<CardHeader>
						<CardTitle className="text-lg">
							Filter by Employee
						</CardTitle>
					</CardHeader>
					<CardContent>
						<div className="flex flex-wrap gap-2">
							<Button
								variant={
									selectedEmployee === null
										? "default"
										: "outline"
								}
								size="sm"
								onClick={() => setSelectedEmployee(null)}
							>
								All Employees
							</Button>
							{employees.map((employee) => (
								<Button
									key={employee}
									variant={
										selectedEmployee === employee
											? "default"
											: "outline"
									}
									size="sm"
									onClick={() =>
										setSelectedEmployee(employee)
									}
								>
									{employee}
								</Button>
							))}
						</div>
					</CardContent>
				</Card>

				{/* Status Legend */}
				<Card>
					<CardHeader>
						<CardTitle className="text-lg">Status Legend</CardTitle>
					</CardHeader>
					<CardContent>
						<div className="flex flex-wrap gap-4">
							<div className="flex items-center gap-2">
								<span className="text-lg">✅</span>
								<Badge
									variant="outline"
									className="bg-green-50"
								>
									Present
								</Badge>
							</div>
							<div className="flex items-center gap-2">
								<span className="text-lg">⚠️</span>
								<Badge
									variant="outline"
									className="bg-amber-50"
								>
									Late
								</Badge>
							</div>
							<div className="flex items-center gap-2">
								<span className="text-lg">❌</span>
								<Badge variant="outline" className="bg-red-50">
									Absent
								</Badge>
							</div>
							<div className="flex items-center gap-2">
								<span className="text-lg">🤒</span>
								<Badge
									variant="outline"
									className="bg-purple-50"
								>
									Sick Leave
								</Badge>
							</div>
							<div className="flex items-center gap-2">
								<span className="text-lg">🏖️</span>
								<Badge variant="outline" className="bg-cyan-50">
									Vacation
								</Badge>
							</div>
						</div>
					</CardContent>
				</Card>

				{/* Attendance Calendar */}
				<div className="space-y-4">
					<div className="space-y-1">
						<h2 className="text-lg font-semibold flex items-center gap-2">
							📅 Attendance Calendar
						</h2>
						<p className="text-sm text-muted-foreground">
							View employee attendance records in an interactive
							calendar. Click on events to see details or dates to
							add new records.
						</p>
					</div>

					<DashboardCalendar
						mode="attendance"
						attendanceData={filteredData}
						useCustomData={true}
						title="Employee Attendance Tracker"
						description={
							selectedEmployee
								? `Showing attendance for ${selectedEmployee}`
								: "Showing attendance for all employees"
						}
						weekStartsOn={1} // Start week on Monday
						height="600px"
						onEventClick={handleEventClick}
						onDateClick={handleDateClick}
						className="w-full"
					/>
				</div>

				{/* Recent Records */}
				<Card>
					<CardHeader>
						<CardTitle className="text-lg">
							Recent Attendance Records
						</CardTitle>
					</CardHeader>
					<CardContent>
						<div className="space-y-2">
							{filteredData.slice(0, 10).map((record) => (
								<div
									key={record.id}
									className="flex items-center justify-between p-3 border rounded-lg"
								>
									<div className="flex items-center gap-3">
										<div className="text-lg">
											{record.status === "present" &&
												"✅"}
											{record.status === "late" && "⚠️"}
											{record.status === "absent" && "❌"}
											{record.status === "sick" && "🤒"}
											{record.status === "vacation" &&
												"🏖️"}
										</div>
										<div>
											<div className="font-medium">
												{record.employeeName}
											</div>
											<div className="text-sm text-muted-foreground">
												{record.date}
											</div>
										</div>
									</div>
									<div className="text-right">
										<div className="text-sm font-medium">
											{record.status
												.charAt(0)
												.toUpperCase() +
												record.status.slice(1)}
										</div>
										{record.checkIn && (
											<div className="text-xs text-muted-foreground">
												{record.checkIn} -{" "}
												{record.checkOut}
											</div>
										)}
										{record.hours > 0 && (
											<div className="text-xs text-muted-foreground">
												{record.hours}h worked
											</div>
										)}
									</div>
								</div>
							))}
						</div>
					</CardContent>
				</Card>
			</div>
		</Wrapper>
	);
};

export default AttendancePage;
