"use client";

import EntitySheet from "@/components/custom/shared/EntitySheet";
import PageHeader from "@/components/custom/shared/PageHeader";
import { Wrapper } from "@/components/custom/shared/Wrapper";
import { DataTable } from "@/components/custom/table/DataTable";
import { Button } from "@/components/ui/button";
import { ExpenseCategory } from "@/lib/constants/interface";
import { useCurrentUser } from "@/lib/hooks/useCurrentUser";
import { useEntitySheet } from "@/lib/hooks/useEntitySheet";
import useSearchParameters from "@/lib/hooks/useSearchParameters";
import { useExpenseCategoryMutations } from "@/lib/mutations/useExpenseCategoryMutations";
import {
	useExpenseCategories,
	useExpenseCategoryFilters,
} from "@/lib/queries/useExpenseCategories";
import { Layers, Plus } from "lucide-react";
import ExpenseCategoryForm from "@/components/forms/ExpenseCategoryForm";
import { ExpenseCategoryDetails } from "@/components/details/ExpenseCategoryDetails";
import { getExpenseCategoryColumns } from "./columns";

export default function ExpenseCategoriesPage() {
	const { isAdmin } = useCurrentUser();
	const { page, limit, search, filter, ordering } = useSearchParameters();
	const {
		deleteExpenseCategory,
		activateExpenseCategory,
		deactivateExpenseCategory,
	} = useExpenseCategoryMutations();
	const { data, isLoading, refetch } = useExpenseCategories({
		page,
		limit,
		search,
		ordering,
		filter,
	});
	const { filters, orderingOptions } = useExpenseCategoryFilters();

	const {
		entityState: viewSheet,
		openEntity: openView,
		closeEntity: closeView,
	} = useEntitySheet<ExpenseCategory>();

	const {
		entityState: editSheet,
		openEntity: openEdit,
		closeEntity: closeEdit,
	} = useEntitySheet<ExpenseCategory>();

	const {
		entityState: { open: addOpen },
		openEntity: openAddSheet,
		closeEntity: closeAddSheet,
	} = useEntitySheet<ExpenseCategory>();

	const handleDelete = (category: ExpenseCategory) => {
		if (category.id !== undefined) {
			deleteExpenseCategory.mutate(category.id);
		}
	};

	const handleToggleActive = (category: ExpenseCategory) => {
		if (category.id !== undefined) {
			if (category.is_active) {
				deactivateExpenseCategory.mutate(category.id);
			} else {
				activateExpenseCategory.mutate(category.id);
			}
		}
	};

	const columns = getExpenseCategoryColumns({
		onView: openView,
		onEdit: openEdit,
		onDelete: handleDelete,
		onToggleActive: handleToggleActive,
	});

	return (
		<Wrapper>
			<PageHeader
				icon={Layers}
				title="Expense Categories"
				description="Organize expenses into categories for better tracking and budget management."
				breadcrumbs={["Dashboard", "Finance", "Expenses", "Categories"]}
				onRefresh={refetch}
				actionButton={
					isAdmin && (
						<Button onClick={() => openAddSheet()}>
							<Plus className="size-4 mr-2" />
							Add Category
						</Button>
					)
				}
			/>

			{/* View category sheet */}
			<EntitySheet<ExpenseCategory>
				open={viewSheet.open}
				onClose={closeView}
				entity={viewSheet.entity}
				title="Category Details"
				description="Review the details of this expense category."
				renderForm={({ onClose, entity }) =>
					entity ? (
						<ExpenseCategoryDetails
							entity={entity}
							onClose={onClose}
						/>
					) : null
				}
			/>

			{/* Edit category sheet */}
			<EntitySheet<ExpenseCategory>
				open={editSheet.open}
				onClose={closeEdit}
				entity={editSheet.entity}
				title="Edit Category"
				description="Update the category details below."
				withCloseConfirmation
				renderForm={({ forceClose, entity }) => (
					<ExpenseCategoryForm
						onClose={forceClose}
						category={entity}
					/>
				)}
			/>

			{/* Add category sheet */}
			<EntitySheet<ExpenseCategory>
				open={addOpen}
				onClose={closeAddSheet}
				title="Add Category"
				description="Fill out the form below to create a new expense category."
				withCloseConfirmation
				renderForm={({ forceClose }) => (
					<ExpenseCategoryForm onClose={forceClose} />
				)}
			/>

			{/* Main Content */}
			<DataTable
				title="Expense Categories"
				description="Manage expense categories and their budgets"
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
				filters={filters}
				orderingOptions={orderingOptions}
				onRefresh={refetch}
			/>
		</Wrapper>
	);
}
