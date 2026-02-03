"use client";

import { getExpenseColumns } from "@/app/(routes)/expenses/manage/columns";
import EntitySheet from "@/components/custom/shared/EntitySheet";
import PageHeader from "@/components/custom/shared/PageHeader";
import { Wrapper } from "@/components/custom/shared/Wrapper";
import { DataTable } from "@/components/custom/table/DataTable";
import { ExpenseDetails } from "@/components/details/ExpenseDetails";
import ExpenseForm from "@/components/forms/ExpenseForm";
import { Button } from "@/components/ui/button";

import { Expense } from "@/lib/constants/interface";
import { useCurrentUser } from "@/lib/hooks/useCurrentUser";
import { useEntitySheet } from "@/lib/hooks/useEntitySheet";
import useSearchParameters from "@/lib/hooks/useSearchParameters";
import { useExpenseMutations } from "@/lib/mutations/useExpenseMutations";
import { useExpenseFilters, useExpenses } from "@/lib/queries/useExpenses";
import { Plus, Coins } from "lucide-react";

export default function ExpensesPage() {
	const { role, isAdmin, assigned_stall } = useCurrentUser();
	const { page, limit, search, filter, ordering } = useSearchParameters();
	const { deleteExpense } = useExpenseMutations();

	// Backend already handles role-based filtering via get_role_filtered_queryset
	// No need to add stall filter here - it would conflict with backend filtering
	const { data, isLoading, refetch } = useExpenses({
		page,
		limit,
		search,
		ordering,
		filter,
	});
	const { filters, orderingOptions } = useExpenseFilters();

	const {
		entityState: viewSheet,
		openEntity: openView,
		closeEntity: closeView,
	} = useEntitySheet<Expense>();

	const {
		entityState: editSheet,
		openEntity: openEdit,
		closeEntity: closeEdit,
	} = useEntitySheet<Expense>();

	const {
		entityState: { open: addOpen },
		openEntity: openAddSheet,
		closeEntity: closeAddSheet,
	} = useEntitySheet<Expense>();

	const handleDelete = (expense: Expense) => {
		if (expense.id !== undefined) {
			deleteExpense.mutate(expense.id);
		}
	};

	const columns = getExpenseColumns({
		onView: openView,
		onEdit: openEdit,
		onDelete: handleDelete,
		role,
	});

	return (
		<Wrapper>
			<PageHeader
				icon={Coins}
				title="Expense Management"
				description={
					isAdmin
						? "Track and manage all business expenses, monitor spending patterns, and maintain financial records."
						: `Track and manage expenses for ${assigned_stall?.name || "your stall"}.`
				}
				breadcrumbs={["Dashboard", "Finance", "Expenses"]}
				onRefresh={refetch}
				actionButton={
					<Button onClick={() => openAddSheet()}>
						<Plus className="size-4 mr-2" />
						Add Expense
					</Button>
				}
			/>
			{/* View expense sheet */}
			<EntitySheet<Expense>
				open={viewSheet.open}
				onClose={closeView}
				entity={viewSheet.entity}
				title="Expense Details"
				description="Review the details of this expense record."
				renderForm={({ onClose, entity }) =>
					entity ? (
						<ExpenseDetails entity={entity} onClose={onClose} />
					) : null
				}
			/>

			<EntitySheet<Expense>
				open={editSheet.open}
				onClose={closeEdit}
				entity={editSheet.entity}
				title="Edit Expense"
				description="Update the expense details below."
				withCloseConfirmation
				renderForm={({ forceClose, entity }) => (
					<ExpenseForm onClose={forceClose} expense={entity} />
				)}
			/>
			<EntitySheet<Expense>
				open={addOpen}
				onClose={closeAddSheet}
				title="Add Expense"
				description="Fill out the form below to add a new expense."
				withCloseConfirmation
				renderForm={({ forceClose }) => (
					<ExpenseForm onClose={forceClose} />
				)}
			/>
			{/* Main Content */}
			<DataTable
				title="Expenses"
				description="Track and manage all business expenses"
				isLoading={isLoading}
				columns={columns}
				data={
					data || {
						count: 0,
						next: null,
						previous: null,
						results: [],
					}
				}
				defaultRangePreset="Today"
				filters={filters}
				orderingOptions={orderingOptions}
				onRefresh={refetch}
			/>
		</Wrapper>
	);
}
