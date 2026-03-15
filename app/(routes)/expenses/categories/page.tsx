"use client"

import { ArchiveToggle } from "@/components/custom/shared/ArchiveToggle"
import EntitySheet from "@/components/custom/shared/EntitySheet"
import PageHeader from "@/components/custom/shared/PageHeader"
import { Wrapper } from "@/components/custom/shared/Wrapper"
import { DataTable } from "@/components/custom/table/DataTable"
import { ExpenseCategoryDetails } from "@/components/details/ExpenseCategoryDetails"
import ExpenseCategoryForm from "@/components/forms/ExpenseCategoryForm"
import { Button } from "@/components/ui/button"
import { ExpenseCategory } from "@/lib/constants/interface"
import { useArchive } from "@/lib/hooks/useArchive"
import { useCurrentUser } from "@/lib/hooks/useCurrentUser"
import { useEntitySheet } from "@/lib/hooks/useEntitySheet"
import useSearchParameters from "@/lib/hooks/useSearchParameters"
import { useExpenseCategoryMutations } from "@/lib/mutations/useExpenseCategoryMutations"
import {
  useExpenseCategories,
  useExpenseCategoryFilters,
} from "@/lib/queries/useExpenseCategories"
import { Layers, Plus } from "lucide-react"
import { useState } from "react"
import { getExpenseCategoryColumns } from "./columns"

// Helper function to sort categories with subcategories grouped under their parents
const sortCategoriesWithSubcategories = (
  categories: ExpenseCategory[],
): ExpenseCategory[] => {
  const parentCategories = categories.filter((cat) => !cat.parent)
  const subcategories = categories.filter((cat) => cat.parent)

  const sorted: ExpenseCategory[] = []

  parentCategories.forEach((parent) => {
    sorted.push(parent)
    // Add all subcategories of this parent
    const childCategories = subcategories.filter(
      (sub) => sub.parent === parent.id,
    )
    sorted.push(...childCategories)
  })

  // Add any orphaned subcategories (if parent is not in the list)
  const addedSubIds = new Set(sorted.filter((c) => c.parent).map((c) => c.id))
  const orphanedSubs = subcategories.filter((sub) => !addedSubIds.has(sub.id))
  sorted.push(...orphanedSubs)

  return sorted
}

export default function ExpenseCategoriesPage() {
  const { isAdmin } = useCurrentUser()
  const searchParams = useSearchParameters()
  const { page, limit, search, filter, ordering } = searchParams
  const [isArchived, setIsArchived] = useState(false)
  const {
    deleteExpenseCategory,
    activateExpenseCategory,
    deactivateExpenseCategory,
  } = useExpenseCategoryMutations()
  const { data, isLoading, refetch } = useExpenseCategories({
    page,
    limit,
    search,
    ordering,
    filter,
  })
  const { filters, orderingOptions } = useExpenseCategoryFilters()

  const { archivedQuery, restoreItem } = useArchive<ExpenseCategory>(
    "/expenses/categories/",
    "expense-categories",
    searchParams,
    isArchived,
  )

  const {
    entityState: viewSheet,
    openEntity: openView,
    closeEntity: closeView,
  } = useEntitySheet<ExpenseCategory>()

  const {
    entityState: editSheet,
    openEntity: openEdit,
    closeEntity: closeEdit,
  } = useEntitySheet<ExpenseCategory>()

  const {
    entityState: { open: addOpen },
    openEntity: openAddSheet,
    closeEntity: closeAddSheet,
  } = useEntitySheet<ExpenseCategory>()

  const handleDelete = (category: ExpenseCategory) => {
    if (category.id !== undefined) {
      deleteExpenseCategory.mutate(category.id)
    }
  }

  const handleToggleActive = (category: ExpenseCategory) => {
    if (category.id !== undefined) {
      if (category.is_active) {
        deactivateExpenseCategory.mutate(category.id)
      } else {
        activateExpenseCategory.mutate(category.id)
      }
    }
  }

  const columns = isArchived
    ? getExpenseCategoryColumns({
        onEdit: () => {},
        onDelete: () => {},
        onRestore: (cat: ExpenseCategory) => {
          if (cat.id !== undefined) restoreItem.mutate(cat.id)
        },
      })
    : getExpenseCategoryColumns({
        onView: openView,
        onEdit: openEdit,
        onDelete: handleDelete,
        onToggleActive: handleToggleActive,
      })

  const emptyData = {
    count: 0,
    next: null,
    previous: null,
    results: [] as ExpenseCategory[],
  }
  const tableData = isArchived
    ? archivedQuery.data || emptyData
    : data
      ? { ...data, results: sortCategoriesWithSubcategories(data.results) }
      : emptyData

  return (
    <Wrapper>
      <PageHeader
        icon={Layers}
        title="Expense Categories"
        description="Organize expenses into categories for better tracking and budget management."
        breadcrumbs={["Dashboard", "Finance", "Expenses", "Categories"]}
        onRefresh={isArchived ? archivedQuery.refetch : refetch}
        actionButton={
          isAdmin &&
          !isArchived && (
            <Button onClick={() => openAddSheet()}>
              <Plus className="size-4 mr-2" />
              Add Category
            </Button>
          )
        }
      />

      {/* View category sheet */}
      {!isArchived && (
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
      )}

      {/* Edit category sheet */}
      {!isArchived && (
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
      )}

      {/* Add category sheet */}
      {!isArchived && (
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
      )}

      <ArchiveToggle
        isArchived={isArchived}
        onToggle={setIsArchived}
        archivedCount={archivedQuery.data?.count}
      />

      {/* Main Content */}
      <DataTable
        title={isArchived ? "Archived Categories" : "Expense Categories"}
        description={
          isArchived
            ? "Restore or permanently delete archived categories"
            : "Manage expense categories and their budgets"
        }
        isLoading={isArchived ? archivedQuery.isLoading : isLoading}
        columns={columns}
        data={tableData}
        filters={filters}
        orderingOptions={orderingOptions}
        onRefresh={isArchived ? archivedQuery.refetch : refetch}
        emptyIcon={Layers}
        emptyTitle={
          isArchived ? "No archived categories" : "No expense categories"
        }
        emptyDescription={
          isArchived
            ? "Deleted categories will appear here"
            : "Create categories to organize and budget your expenses"
        }
      />
    </Wrapper>
  )
}
