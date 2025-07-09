'use client'

import { getExpenseColumns } from '@/app/(routes)/expenses/columns'
import { DataTable } from '@/components/custom/table/DataTable'
import { ExpenseDetails } from '@/components/details/ExpenseDetails'
import ExpenseForm from '@/components/forms/ExpenseForm'
import EntitySheet from '@/components/sheets/EntitySheet'
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
    sheetState: viewSheet,
    openSheet: openView,
    closeSheet: closeView,
  } = useEntitySheet<Expense>()
  const {
    sheetState: createSheet,
    openSheet: openCreate,
    closeSheet: closeCreate,
  } = useEntitySheet<Expense>()
  const {
    sheetState: editSheet,
    openSheet: openEdit,
    closeSheet: closeEdit,
  } = useEntitySheet<Expense>()

  const {
    sheetState: { open: addOpen },
    openSheet: openAddSheet,
    closeSheet: closeAddSheet,
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
        onOpenChange={(isOpen) => !isOpen && closeView()}
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
        onOpenChange={(isOpen) => !isOpen && closeEdit()}
        entity={editSheet.entity}
        title="Edit Expense"
        description="Update the expense details below."
        renderForm={({ onClose, entity }) => (
          <ExpenseForm
            onClose={onClose}
            expense={entity}
          />
        )}
      />
      <EntitySheet<Expense>
        open={addOpen}
        onOpenChange={(isOpen) => !isOpen && closeAddSheet()}
        title="Add Expense"
        description="Fill out the form below to add a new expense."
        renderForm={({ onClose }) => <ExpenseForm onClose={onClose} />}
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
