"use client";

import { getPayrollColumns } from "@/app/(routes)/payroll/weekly/columns";
import { ConfirmDialog } from "@/components/custom/shared/ConfirmDialog";
import EntitySheet from "@/components/custom/shared/EntitySheet";
import PageHeader from "@/components/custom/shared/PageHeader";
import { Wrapper } from "@/components/custom/shared/Wrapper";
import { DataTable } from "@/components/custom/table/DataTable";
import PayrollForm from "@/components/forms/PayrollForm";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { WeeklyPayroll } from "@/lib/constants/types";
import { useCurrentUser } from "@/lib/hooks/useCurrentUser";
import { useEntitySheet } from "@/lib/hooks/useEntitySheet";
import useSearchParameters from "@/lib/hooks/useSearchParameters";
import { usePayrollMutations } from "@/lib/mutations/usePayrollMutations";
import {
	useWeeklyPayrollFilters,
	useWeeklyPayrolls,
} from "@/lib/queries/usePayroll";
import { FileText, PhilippinePesoIcon, Plus } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

export default function PayrollPage() {
	const { isAdmin } = useCurrentUser();
	const router = useRouter();
	const { page, limit, search, filter, ordering } = useSearchParameters();
	const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
	const [payrollToDelete, setPayrollToDelete] = useState<number | null>(null);

	const { data, isLoading, refetch } = useWeeklyPayrolls({
		page,
		limit,
		search,
		ordering,
		filter,
	});
	const { deletePayroll } = usePayrollMutations();
	const { filters, orderingOptions } = useWeeklyPayrollFilters();

	const {
		entityState: { open: addOpen },
		openEntity: openAdd,
		closeEntity: closeAdd,
	} = useEntitySheet<WeeklyPayroll>();

	const handleView = (payroll: WeeklyPayroll) => {
		router.push(`/payroll/slip/${payroll.id}`);
	};

	const handleDelete = (id: number) => {
		setPayrollToDelete(id);
		setDeleteDialogOpen(true);
	};

	const confirmDelete = async () => {
		if (payrollToDelete) {
			await deletePayroll.mutateAsync(payrollToDelete);
			setDeleteDialogOpen(false);
			setPayrollToDelete(null);
		}
	};

	const columns = getPayrollColumns({
		onView: handleView,
		onDelete: handleDelete,
		isAdmin,
	});

	// Calculate summary statistics
	const totalGrossPay =
		data?.results?.reduce((sum, p) => sum + Number(p.gross_pay || 0), 0) ||
		0;

	const totalNetPay =
		data?.results?.reduce((sum, p) => sum + Number(p.net_pay || 0), 0) || 0;

	const totalDeductions =
		data?.results?.reduce(
			(sum, p) => sum + Number(p.total_deductions || 0),
			0,
		) || 0;

	return (
		<Wrapper>
			<div className="space-y-4 md:space-y-6">
				<PageHeader
					title="Payroll Management"
					description="Generate and manage weekly payroll for employees. Based on approved daily attendance records."
					icon={PhilippinePesoIcon}
					onRefresh={refetch}
					actionButton={
						<Button onClick={() => openAdd()}>
							<Plus className="size-4 mr-2" />
							Generate Payroll
						</Button>
					}
					isAdminOnly
				/>

				{/* Summary Statistics */}
				{data?.results && data.results.length > 0 && (
					<div className="grid gap-4 md:grid-cols-3">
						<Card className="border-blue-200 dark:border-blue-800 bg-linear-br from-blue-50 to-blue-100 dark:from-blue-950/20 dark:to-blue-900/20">
							<CardHeader className="flex flex-row items-center justify-between pb-2">
								<CardTitle className="text-sm font-semibold text-blue-900 dark:text-blue-200">
									Total Gross Pay
								</CardTitle>
								<div className="h-10 w-10 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
									<PhilippinePesoIcon className="h-5 w-5 text-blue-600 dark:text-blue-400" />
								</div>
							</CardHeader>
							<CardContent>
								<div className="text-3xl font-bold text-blue-900 dark:text-blue-100">
									₱{totalGrossPay.toLocaleString()}
								</div>
								<p className="text-xs text-blue-700 dark:text-blue-300 mt-1">
									Before deductions
								</p>
							</CardContent>
						</Card>

						<Card className="border-red-200 dark:border-red-800 bg-linear-to-br from-red-50 to-red-100 dark:from-red-950/20 dark:to-red-900/20">
							<CardHeader className="flex flex-row items-center justify-between pb-2">
								<CardTitle className="text-sm font-semibold text-red-900 dark:text-red-200">
									Total Deductions
								</CardTitle>
								<div className="h-10 w-10 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
									<FileText className="h-5 w-5 text-red-600 dark:text-red-400" />
								</div>
							</CardHeader>
							<CardContent>
								<div className="text-3xl font-bold text-red-900 dark:text-red-100">
									₱{totalDeductions.toLocaleString()}
								</div>
								<p className="text-xs text-red-700 dark:text-red-300 mt-1">
									All deductions combined
								</p>
							</CardContent>
						</Card>

						<Card className="border-green-200 dark:border-green-800 bg-linear-to-br from-green-50 to-green-100 dark:from-green-950/20 dark:to-green-900/20">
							<CardHeader className="flex flex-row items-center justify-between pb-2">
								<CardTitle className="text-sm font-semibold text-green-900 dark:text-green-200">
									Total Net Pay
								</CardTitle>
								<div className="h-10 w-10 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
									<PhilippinePesoIcon className="h-5 w-5 text-green-600 dark:text-green-400" />
								</div>
							</CardHeader>
							<CardContent>
								<div className="text-3xl font-bold text-green-900 dark:text-green-100">
									₱{totalNetPay.toLocaleString()}
								</div>
								<p className="text-xs text-green-700 dark:text-green-300 mt-1">
									Final payout to employees
								</p>
							</CardContent>
						</Card>
					</div>
				)}

				{/* Data Table */}
				<DataTable
					data={
						data ?? {
							count: 0,
							next: null,
							previous: null,
							results: [],
						}
					}
					columns={columns}
					isLoading={isLoading}
					filters={filters}
					orderingOptions={orderingOptions}
				/>
			</div>

			{/* Generate Payroll Sheet */}
			<EntitySheet
				open={addOpen}
				onClose={closeAdd}
				title="Generate Payroll"
				description="Create a new weekly payroll record for an employee"
				renderForm={() => <PayrollForm onClose={closeAdd} />}
			/>

			{/* Delete Confirmation */}
			<ConfirmDialog
				open={deleteDialogOpen}
				onCancel={() => setDeleteDialogOpen(false)}
				title="Delete Payroll"
				description="Are you sure you want to delete this payroll record? This action cannot be undone."
				onConfirm={confirmDelete}
				confirmText="Delete"
				cancelText="Cancel"
			/>
		</Wrapper>
	);
}
