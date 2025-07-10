'use client'

import { getSalesTransactionColumns } from '@/app/(routes)/sales/columns'
import EntitySheet from '@/components/custom/shared/EntitySheet'
import { DataTable } from '@/components/custom/table/DataTable'
import { SalesTransactionDetails } from '@/components/details/SalesTransactionDetails'
import SalesTransactionForm from '@/components/forms/SalesTransactionForm'
import { Button } from '@/components/ui/button'
import { SalesTransaction } from '@/lib/constants/interface'
import { useCurrentUser } from '@/lib/hooks/useCurrentUser'
import { useEntitySheet } from '@/lib/hooks/useEntitySheet'
import useSearchParameters from '@/lib/hooks/useSearchParameters'
import { useSalesTransactionMutations } from '@/lib/mutations/useSalesTransactionMutations'
import { useSalesTransactions } from '@/lib/queries/sales/useSalesTransactions'
import { Plus } from 'lucide-react'

export default function SalesTransactionsPage() {
  const { role } = useCurrentUser()
  const { page, limit, search, ordering } = useSearchParameters()
  const { data, isLoading } = useSalesTransactions({
    page,
    limit,
    search,
    ordering,
  })
  const { deleteTransaction } = useSalesTransactionMutations()

  // Sheets
  const {
    entityState: viewSheet,
    openEntity: openView,
    closeEntity: closeView,
  } = useEntitySheet<SalesTransaction>()
  const {
    entityState: createSheet,
    openEntity: openCreate,
    closeEntity: closeCreate,
  } = useEntitySheet<SalesTransaction>()
  const {
    entityState: editSheet,
    openEntity: openEdit,
    closeEntity: closeEdit,
  } = useEntitySheet<SalesTransaction>()

  const columns = getSalesTransactionColumns({
    onView: openView,
    onEdit: openEdit,
    onDelete: (tx) => {
      if (tx?.id) deleteTransaction.mutate(tx.id)
    },
    role: role ?? 'guest',
  })

  return (
    <div className="container mx-auto">
      {/* Create sheet */}
      <EntitySheet<SalesTransaction>
        open={createSheet.open}
        onOpenChange={(isOpen) => !isOpen && closeCreate()}
        title="New Sale"
        description="Record a new sales transaction."
        renderForm={({ onClose }) => <SalesTransactionForm onClose={onClose} />}
      />

      {/* Edit sheet */}
      <EntitySheet<SalesTransaction>
        open={editSheet.open}
        onOpenChange={(isOpen) => !isOpen && closeEdit()}
        entity={editSheet.entity}
        title="Edit Sale"
        description="Update the sales transaction details."
        renderForm={({ onClose, entity }) => (
          <SalesTransactionForm
            onClose={onClose}
            initialData={entity}
          />
        )}
      />

      {/* View sheet */}
      <EntitySheet<SalesTransaction>
        open={viewSheet.open}
        onOpenChange={(isOpen) => !isOpen && closeView()}
        entity={viewSheet.entity}
        title="Sale Details"
        description="Review details of this sales transaction."
        renderForm={({ onClose, entity }) =>
          entity ? (
            <SalesTransactionDetails
              entity={entity}
              onClose={onClose}
              onMarkAsPaid={() => {}}
              markAsPaidPending={false}
              onVoid={() => {}}
              voidPending={false}
            />
          ) : null
        }
      />

      {/* DataTable */}
      <DataTable
        isLoading={isLoading}
        columns={columns}
        data={data?.results ?? []}
        headerActions={
          <Button onClick={() => openCreate()}>
            <Plus className="size-4 mr-1" />
            New Sale
          </Button>
        }
      />
    </div>
  )
}
