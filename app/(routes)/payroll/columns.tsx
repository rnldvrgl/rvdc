import { Badge } from "@/components/ui/badge";
import { DataTableActions } from "@/components/custom/table/components/DataTableActions";
import { GetColumnsProps } from "@/lib/constants/interface";
import { Roles } from "@/lib/constants/types";
import {
	formatCurrency,
	formatHours,
	formatDateDisplay,
	safeCell,
} from "@/lib/utils/helpers";
import { CellContext, ColumnDef } from "@tanstack/react-table";
import { Edit, Eye, RefreshCcw, Trash2 } from "lucide-react";
import Link from "next/link";
import { WeeklyPayroll } from "@/lib/queries/usePayroll";

interface GetWeeklyPayrollColumnsProps extends GetColumnsProps<WeeklyPayroll> {
	role: Roles;
	onRecompute: (item: WeeklyPayroll) => void;
}

function StatusBadge({ status }: { status: WeeklyPayroll["status"] }) {
	const map: Record<
		WeeklyPayroll["status"],
		"secondary" | "success" | "outline"
	> = {
		draft: "outline",
		approved: "secondary",
		paid: "success",
	};
	const variant = map[status] ?? "outline";
	return <Badge variant={variant}>{status}</Badge>;
}

export function getWeeklyPayrollColumns({
	onEdit,
	onDelete,
	onView,
	onRecompute,
	role,
}: GetWeeklyPayrollColumnsProps): ColumnDef<WeeklyPayroll>[] {
	const canManage = role === "admin" || role === "manager";

	return [
		{
			accessorKey: "employee",
			header: "Employee",
			cell: ({ row, getValue }) => {
				const id = getValue<number>();
				const name = (row.original as any)?.employee_name;
				if (name) return name;
				return id ? `#${id}` : safeCell(id);
			},
		},
		{
			accessorKey: "week_start",
			header: "Week Start",
			cell: ({ getValue }) => formatDateDisplay(getValue() as string),
		},
		{
			accessorKey: "regular_hours",
			header: "Regular Hours",
			cell: ({ getValue }) => formatHours(getValue() as number | string),
		},
		{
			accessorKey: "overtime_hours",
			header: "OT Hours",
			cell: ({ getValue }) => formatHours(getValue() as number | string),
		},
		{
			accessorKey: "allowances",
			header: "Allowances",
			cell: ({ getValue }) =>
				formatCurrency(getValue() as number | string),
		},
		{
			accessorKey: "additional_earnings_total",
			header: "Additional",
			cell: ({ getValue }) =>
				formatCurrency(getValue() as number | string),
		},
		{
			accessorKey: "gross_pay",
			header: "Gross",
			cell: ({ getValue }) =>
				formatCurrency(getValue() as number | string),
		},
		{
			accessorKey: "total_deductions",
			header: "Deductions",
			cell: ({ getValue }) => (
				<span className="text-red-500">
					{formatCurrency(getValue() as number | string)}
				</span>
			),
		},
		{
			accessorKey: "net_pay",
			header: "Net",
			cell: ({ getValue }) => (
				<span className="font-semibold">
					{formatCurrency(getValue() as number | string)}
				</span>
			),
		},
		{
			accessorKey: "status",
			header: "Status",
			cell: ({ getValue }) => (
				<StatusBadge status={getValue() as WeeklyPayroll["status"]} />
			),
		},
		...(canManage
			? ([
					{
						accessorKey: "actions",
						header: "Actions",
						cell: ({
							row,
						}: CellContext<WeeklyPayroll, unknown>) => {
							const payroll = row.original;
							return (
								<DataTableActions
									items={[
										{
											label: "Open Detail Page",
											icon: <Eye className="size-4" />,

											onClick: () => {
												window.location.href = `/payroll/${payroll.id}`;
											},
										},

										{
											label: "Recompute",
											icon: (
												<RefreshCcw className="size-4" />
											),
											onClick: () => onRecompute(payroll),
										},
										{
											label: "Edit",
											icon: <Edit className="size-4" />,
											onClick: () => onEdit(payroll),
										},
										{
											label: "Delete",
											icon: (
												<Trash2 className="size-4 text-destructive" />
											),
											onClick: () => onDelete(payroll),
											destructive: true,
											confirmText: `Delete weekly payroll for employee #${payroll.employee} (${formatDateDisplay(
												payroll.week_start,
											)})?`,
										},
									]}
								/>
							);
						},
					},
				] as ColumnDef<WeeklyPayroll>[])
			: []),
	];
}
