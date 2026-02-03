import { Detail } from "@/components/details/Detail";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Expense } from "@/lib/constants/interface";
import { formatCurrency } from "@/lib/utils/helpers";
import { formatDate } from "@/lib/utils/helpers/date";
import {
	Calendar,
	ClipboardList,
	Clock,
	DollarSign,
	Tag,
	Wallet,
	FileText,
	Building,
} from "lucide-react";

export function ExpenseDetails({
	entity,
	onClose,
}: {
	entity: Expense;
	onClose: () => void;
}) {
	return (
		<div className="space-y-8">
			{/* Status badges */}
			<div className="flex items-center gap-4">
				<Badge
					variant={
						entity?.payment_status === "paid"
							? "default"
							: entity?.payment_status === "partial"
								? "secondary"
								: "destructive"
					}
				>
					{entity?.payment_status === "paid"
						? "Paid"
						: entity?.payment_status === "partial"
							? "Partially Paid"
							: "Unpaid"}
				</Badge>
				{entity?.source && (
					<Badge variant="secondary" className="capitalize">
						{entity.source}
					</Badge>
				)}
			</div>

			{/* General info */}
			<>
				<h3 className="text-lg font-semibold mb-4">
					Expense Information
				</h3>
				<Detail
					label="Description"
					value={entity?.description}
					icon={<ClipboardList className="w-4 h-4" />}
				/>
				<div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
					<Detail
						label="Expense Date"
						value={
							entity?.expense_date
								? formatDate(
										new Date(entity.expense_date),
										"EEE, MMM dd yyyy",
									)
								: "N/A"
						}
						icon={<Calendar className="w-4 h-4" />}
					/>
					<Detail
						label="Category"
						value={entity?.category_data?.name || "Uncategorized"}
						icon={<Tag className="w-4 h-4" />}
					/>
					<Detail
						label="Vendor"
						value={entity?.vendor || "N/A"}
						icon={<Building className="w-4 h-4" />}
					/>
					<Detail
						label="Reference Number"
						value={entity?.reference_number || "N/A"}
						icon={<FileText className="w-4 h-4" />}
					/>
					<Detail
						label="Total Price"
						value={formatCurrency(entity?.total_price ?? 0)}
						icon={<DollarSign className="w-4 h-4" />}
					/>
					<Detail
						label="Paid Amount"
						value={formatCurrency(entity?.paid_amount ?? 0)}
						icon={<Wallet className="w-4 h-4" />}
					/>
					<Detail
						label="Balance Due"
						value={formatCurrency(
							(entity?.total_price ?? 0) -
								(entity?.paid_amount ?? 0),
						)}
						icon={<DollarSign className="w-4 h-4" />}
					/>
					<Detail
						label="Payment Method"
						value={entity?.payment_method || "N/A"}
						icon={<Wallet className="w-4 h-4" />}
					/>
					<Detail
						label="Created At"
						value={
							entity?.created_at
								? formatDate(
										new Date(entity.created_at),
										"EEE, MMM dd yyyy • hh:mm a",
									)
								: "N/A"
						}
						icon={<Clock className="w-4 h-4" />}
					/>
					<Detail
						label="Paid At"
						value={
							entity?.paid_at
								? formatDate(
										new Date(entity.paid_at),
										"EEE, MMM dd yyyy • hh:mm a",
									)
								: "Not yet paid"
						}
						icon={<Clock className="w-4 h-4" />}
					/>
				</div>
			</>

			{/* Action buttons */}
			<div className="flex justify-between pt-4 border-t mt-6">
				<Button className="w-full" variant="outline" onClick={onClose}>
					Close
				</Button>
			</div>
		</div>
	);
}
