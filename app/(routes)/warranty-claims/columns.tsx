import { DataTableActions } from "@/components/custom/table/components/DataTableActions";
import { Badge } from "@/components/ui/badge";
import { GetColumnsProps, WarrantyClaim } from "@/lib/constants/interface";
import { formatCurrency, getBadgeVariant, safeCell } from "@/lib/utils/helpers";
import { formatDate } from "@/lib/utils/helpers/date";
import { ColumnDef, Row } from "@tanstack/react-table";
import { CheckCircle, Edit, Eye, Trash2, XCircle } from "lucide-react";

const claimTypeLabels: Record<string, string> = {
	repair: "Repair",
	replacement: "Replacement",
	parts: "Parts",
	inspection: "Inspection",
};

const claimStatusLabels: Record<string, string> = {
	pending: "Pending",
	approved: "Approved",
	rejected: "Rejected",
	in_progress: "In Progress",
	completed: "Completed",
	cancelled: "Cancelled",
};

interface GetWarrantyClaimColumnsProps extends GetColumnsProps<WarrantyClaim> {
	onApprove?: (claim: WarrantyClaim) => void;
	onReject?: (claim: WarrantyClaim) => void;
}

export function getWarrantyClaimColumns({
	role,
	onView,
	onEdit,
	onDelete,
	onApprove,
	onReject,
}: GetWarrantyClaimColumnsProps): ColumnDef<WarrantyClaim>[] {
	const columns: ColumnDef<WarrantyClaim>[] = [
		{
			accessorKey: "id",
			header: "Claim #",
			cell: ({ getValue }) => (
				<span className="font-mono text-sm">
					#{String(getValue()).padStart(4, "0")}
				</span>
			),
		},
		{
			accessorKey: "unit.serial_number",
			header: "Unit Serial",
			cell: ({ row }) => (
				<div className="flex flex-col">
					<span className="font-medium">
						{safeCell(row.original.unit?.serial_number)}
					</span>
					<span className="text-xs text-muted-foreground">
						{row.original.unit?.model?.brand?.name}{" "}
						{row.original.unit?.model?.name}
					</span>
				</div>
			),
		},
		{
			accessorKey: "claim_type",
			header: "Type",
			cell: ({ getValue }) => {
				const value = getValue() as string;
				return (
					<Badge variant="outline">
						{claimTypeLabels[value] || safeCell(value)}
					</Badge>
				);
			},
		},
		{
			accessorKey: "status",
			header: "Status",
			cell: ({ getValue }) => {
				const value = getValue() as string;
				return (
					<Badge variant={getBadgeVariant(value)}>
						{claimStatusLabels[value] || safeCell(value)}
					</Badge>
				);
			},
		},
		{
			accessorKey: "is_valid_claim",
			header: "Valid",
			cell: ({ getValue }) => (
				<Badge variant={getValue() ? "default" : "destructive"}>
					{getValue() ? "Yes" : "No"}
				</Badge>
			),
		},
		{
			accessorKey: "warranty_days_remaining_at_claim",
			header: "Warranty Days Left",
			cell: ({ getValue }) => {
				const days = getValue() as number | undefined;
				return days !== undefined ? (
					<span
						className={
							days < 30 ? "text-orange-600 font-medium" : ""
						}
					>
						{days} days
					</span>
				) : (
					<span className="text-muted-foreground">—</span>
				);
			},
		},
		{
			accessorKey: "estimated_cost",
			header: "Est. Cost",
			cell: ({ getValue }) => {
				const value = getValue();
				return value ? (
					formatCurrency(Number(value))
				) : (
					<span className="text-muted-foreground">—</span>
				);
			},
		},
		{
			accessorKey: "actual_cost",
			header: "Actual Cost",
			cell: ({ getValue }) => {
				const value = getValue();
				return value && Number(value) > 0 ? (
					formatCurrency(Number(value))
				) : (
					<span className="text-muted-foreground">—</span>
				);
			},
		},
		{
			accessorKey: "claim_date",
			header: "Claim Date",
			cell: ({ getValue }) =>
				safeCell(
					getValue()
						? formatDate(
								new Date(getValue() as string),
								"MMM dd, yyyy",
							)
						: null,
				),
		},
		{
			id: "actions",
			header: "Actions",
			cell: ({ row }) => {
				const claim = row.original;
				const isPending = claim.status === "pending";
				const canEdit = !["completed", "cancelled"].includes(
					claim.status || "",
				);

				return (
					<DataTableActions
						items={[
							{
								label: "View Details",
								icon: <Eye className="mr-2 h-4 w-4" />,
								onClick: () => onView?.(claim),
							},
							{
								label: "Edit",
								icon: <Edit className="mr-2 h-4 w-4" />,
								onClick: () => onEdit?.(claim),
								disabled: !canEdit,
							},
							...(isPending && onApprove && role === "admin"
								? [
										{
											label: "Approve",
											icon: (
												<CheckCircle className="mr-2 h-4 w-4" />
											),
											onClick: () => onApprove(claim),
										},
									]
								: []),
							...(isPending && onReject && role === "admin"
								? [
										{
											label: "Reject",
											icon: (
												<XCircle className="mr-2 h-4 w-4" />
											),
											onClick: () => onReject(claim),
											destructive: true,
										},
									]
								: []),
							{
								label: "Delete",
								icon: <Trash2 className="mr-2 h-4 w-4" />,
								onClick: () => onDelete?.(claim),
								destructive: true,
								disabled: claim.status === "completed",
							},
						]}
					/>
				);
			},
		},
	];

	return columns;
}
