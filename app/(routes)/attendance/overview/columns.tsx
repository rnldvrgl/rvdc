import { Badge } from "@/components/ui/badge";
import { DataTableActions } from "@/components/custom/table/components/DataTableActions";
import { GetColumnsProps } from "@/lib/constants/interface";
import { Roles, WeeklyPayroll } from "@/lib/constants/types";
import {
	formatCurrency,
	formatHours,
	formatDateDisplay,
	safeCell,
} from "@/lib/utils/helpers";
import { CellContext, ColumnDef } from "@tanstack/react-table";
import { Edit, Eye, RefreshCcw, Trash2 } from "lucide-react";

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
	onDelete,
	onRecompute,
	role,
}: GetWeeklyPayrollColumnsProps): ColumnDef<WeeklyPayroll>[] {
	const canManage = role === "admin";

	return [
		{
			accessorKey: "employee",
			header: "Employee",

			cell: ({ row, getValue }) => {
				const id = getValue<number>();

				const name = row.original.employee_name;
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
			accessorKey: "night_diff_hours",
			header: "ND Hours",
			cell: ({ getValue }) => formatHours(getValue() as number | string),
		},

		{
			accessorKey: "approved_ot_hours",
			header: "Approved OT Hours",
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
			accessorKey: "night_diff_pay",
			header: "ND Pay",
			cell: ({ getValue }) =>
				formatCurrency(getValue() as number | string),
		},
		{
			accessorKey: "approved_ot_pay",
			header: "Approved OT Pay",
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
				<span className="text-red-500c">
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
												window.location.href = `/payroll/attendance/${payroll.id}`;
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

											onClick: () => {
												window.location.href = `/payroll/attendance/${payroll.id}`;
											},
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
