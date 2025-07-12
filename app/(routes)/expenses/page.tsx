'use client'

import { getExpenseColumns } from '@/app/(routes)/expenses/columns'
import EntitySheet from '@/components/custom/shared/EntitySheet'
import { DataTable } from '@/components/custom/table/DataTable'
import { ExpenseDetails } from '@/components/details/ExpenseDetails'
import ExpenseForm from '@/components/forms/ExpenseForm'
import { Button } from '@/components/ui/button'
import { Expense } from '@/lib/constants/interface'
import { useEntitySheet } from '@/lib/hooks/useEntitySheet'
import useSearchParameters from '@/lib/hooks/useSearchParameters'
import { useExpenseMutations } from '@/lib/mutations/useExpenseMutations'
import { useExpenses } from '@/lib/queries/useExpenses'
import { Plus } from 'lucide-react'

export default function ExpensesPage() {
  const { page, limit, search, ordering } = useSearchParameters()
  const { deleteExpense } = useExpenseMutations()
  const { data, isLoading } = useExpenses({
    page,
    limit,
    search,
    ordering,
  })

  const {
    entityState: viewSheet,
    openEntity: openView,
    closeEntity: closeView,
  } = useEntitySheet<Expense>()

  const {
    entityState: editSheet,
    openEntity: openEdit,
    closeEntity: closeEdit,
  } = useEntitySheet<Expense>()

  const {
    entityState: { open: addOpen },
    openEntity: openAddSheet,
    closeEntity: closeAddSheet,
  } = useEntitySheet<Expense>()

  const handleDelete = (expense: Expense) => {
    if (expense.id !== undefined) {
      deleteExpense.mutate(expense.id)
    }
  }

  const columns = getExpenseColumns({
    onView: openView,
    onEdit: openEdit,
    onDelete: handleDelete,
  })

  return (
    <div className="container mx-auto">
      {/* View transfer sheet */}
      <EntitySheet<Expense>
        open={viewSheet.open}
        onClose={closeView}
        entity={viewSheet.entity}
        title="Transfer Details"
        description="Review the details of this stock transfer."
        renderForm={({ onClose, entity }) =>
          entity ? (
            <ExpenseDetails
              entity={entity}
              onClose={onClose}
            />
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
          <ExpenseForm
            onClose={forceClose}
            expense={entity}
          />
        )}
      />
      <EntitySheet<Expense>
        open={addOpen}
        onClose={closeAddSheet}
        title="Add Expense"
        description="Fill out the form below to add a new expense."
        withCloseConfirmation
        renderForm={({ forceClose }) => <ExpenseForm onClose={forceClose} />}
      />
      <DataTable
        isLoading={isLoading}
        columns={columns}
        data={data?.results ?? []}
        headerActions={
          <Button onClick={() => openAddSheet()}>
            <Plus className="size-4 mr-1" />
            Add Expense
          </Button>
        }
      />
    </div>
  )
}
