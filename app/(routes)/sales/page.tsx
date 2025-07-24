'use client'

import { getSalesTransactionColumns } from '@/app/(routes)/sales/columns'
import EntitySheet from '@/components/custom/shared/EntitySheet'
import { SalesTransactionPrintContent } from '@/components/custom/shared/SalesTransactionPrintContent '
import { DataTable } from '@/components/custom/table/DataTable'
import { SalesTransactionDetails } from '@/components/details/SalesTransactionDetails'
import SalesTransactionForm from '@/components/forms/SalesTransactionForm'
import { Button } from '@/components/ui/button'
import { salesFilters } from '@/lib/constants/filters'
import { SalesTransaction } from '@/lib/constants/interface'
import { useCurrentUser } from '@/lib/hooks/useCurrentUser'
import { useEntitySheet } from '@/lib/hooks/useEntitySheet'
import { usePrint } from '@/lib/hooks/usePrint'
import useSearchParameters from '@/lib/hooks/useSearchParameters'
import { useSalesTransactionMutations } from '@/lib/mutations/useSalesTransactionMutations'
import { useSalesTransactions } from '@/lib/queries/sales/useSalesTransactions'
import { Plus } from 'lucide-react'

export default function SalesTransactionsPage() {
  const { role } = useCurrentUser()
  const { page, limit, search, ordering, filter } = useSearchParameters()
  const { data, isLoading } = useSalesTransactions({
    page,
    limit,
    search,
    ordering,
    filter,
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

  const { printRef, handlePrint, printData } = usePrint<SalesTransaction>({
    documentTitle: 'Receipt',
  })

  const columns = getSalesTransactionColumns({
    onView: openView,
    onEdit: openEdit,
    onPrint: handlePrint,
    onDelete: (tx) => {
      if (tx?.id) deleteTransaction.mutate(tx.id)
    },
    role: role ?? 'guest',
  })

  return (
    <div className="mx-auto container">
      {printData && (
        <div className="hidden">
          <SalesTransactionPrintContent
            ref={printRef}
            entity={printData as SalesTransaction}
            stall={printData.stall}
          />
        </div>
      )}

      {/* Create sheet */}
      <EntitySheet<SalesTransaction>
        open={createSheet.open}
        onClose={closeCreate}
        title="New Sale"
        description="Record a new sales transaction."
        withCloseConfirmation
        renderForm={({ forceClose }) => (
          <SalesTransactionForm onClose={forceClose} />
        )}
      />

      {/* Edit sheet */}
      <EntitySheet<SalesTransaction>
        open={editSheet.open}
        onClose={closeEdit}
        entity={editSheet.entity}
        title="Edit Sale"
        description="Update the sales transaction details."
        withCloseConfirmation
        renderForm={({ forceClose, entity }) => (
          <SalesTransactionForm
            onClose={forceClose}
            initialData={entity}
          />
        )}
      />

      {/* View sheet */}
      <EntitySheet<SalesTransaction>
        open={viewSheet.open}
        onClose={closeView}
        entity={viewSheet.entity}
        title="View Transaction"
        description="This is read-only"
        renderForm={({ onClose, entity }) =>
          entity ? (
            <SalesTransactionDetails
              entity={entity}
              onClose={onClose}
            />
          ) : null
        }
      />

      {/* DataTable */}
      <DataTable
        isLoading={isLoading}
        columns={columns}
        data={data ?? { count: 0, next: null, previous: null, results: [] }}
        headerActions={
          <Button onClick={() => openCreate()}>
            <Plus className="size-4 mr-1" />
            New Sale
          </Button>
        }
        defaultRangePreset="Today"
        filters={salesFilters}
        sortOptions={[
          { label: 'Date Created', key: 'created_at', value: 'created_at' },
          { label: 'Amount', key: 'amount', value: 'amount' },
          { label: 'Client Name', key: 'client_name', value: 'client_name' },
        ]}
      />
    </div>
  )
}
