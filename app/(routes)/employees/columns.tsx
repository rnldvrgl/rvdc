"use client";

import { DataTableActions } from "@/components/custom/table/components/DataTableActions";
import { GetColumnsProps } from "@/lib/constants/interface";
import { Employee } from "@/lib/constants/types";
import { safeCell } from "@/lib/utils/helpers";
import { ColumnDef } from "@tanstack/react-table";
import { Edit, Eye, Trash2 } from "lucide-react";

export function getEmployeeColumns({
	onEdit,
	onDelete,
	onView,
}: GetColumnsProps<Employee>): ColumnDef<Employee>[] {
	return [
		{
			accessorKey: "first_name",
			header: "First Name",
		},
		{
			accessorKey: "last_name",
			header: "Last Name",
		},
		{
			accessorKey: "role",
			header: "Role",
			cell: ({ getValue }) => {
				const value = getValue<string>();
				return safeCell(value.charAt(0).toUpperCase() + value.slice(1));
			},
		},
		{
			accessorKey: "contact_number",
			header: "Contact Number",
			cell: ({ getValue }) => {
				return safeCell(getValue<string>());
			},
		},
		{
			accessorKey: "address",
			header: "Address",
			cell: ({ getValue }) => {
				return safeCell(getValue<string>());
			},
		},
		{
			accessorKey: "barangay",
			header: "Barangay",
			cell: ({ getValue }) => {
				return safeCell(getValue<string>());
			},
		},
		{
			accessorKey: "city",
			header: "City",
			cell: ({ getValue }) => {
				return safeCell(getValue<string>());
			},
		},
		{
			accessorKey: "province",
			header: "Province",
			cell: ({ getValue }) => {
				return safeCell(getValue<string>());
			},
		},
		{
			accessorKey: "basic_salary",
			header: "Basic Salary",
			cell: ({ getValue }) => {
				return safeCell(getValue<number>());
			},
		},
		{
			accessorKey: "action",
			header: "Action",
			cell: ({ row }) => {
				const employee = row.original;
				return (
					<DataTableActions
						items={[
							...(onView
								? [
										{
											label: "View",
											icon: <Eye className="size-4" />,
											onClick: () => onView(employee),
										},
									]
								: []),
							{
								label: "Edit",
								icon: <Edit className="size-4" />,
								onClick: () => onEdit(employee),
							},
							{
								label: "Delete",
								icon: (
									<Trash2 className="size-4 text-destructive" />
								),
								onClick: () => onDelete(employee),
								destructive: true,
								confirmText: `Delete ${employee.first_name} ${employee.last_name}?`,
							},
						]}
					/>
				);
			},
		},
	];
}
