'use client'

import EntitySheet from '@/components/custom/shared/EntitySheet'
import { DataTable } from '@/components/custom/table/DataTable'
import { StockTransferDetails } from '@/components/details/StockTransferDetails'
import StockTransferForm from '@/components/forms/inventory/StockTransferForm'
import { Button } from '@/components/ui/button'
import { StockTransfer } from '@/lib/constants/interface'
import { useEntitySheet } from '@/lib/hooks/useEntitySheet'
import useSearchParameters from '@/lib/hooks/useSearchParameters'
import { useStockTransferMutations } from '@/lib/mutations/useStockTransferMutations'
import { useStockTransfers } from '@/lib/queries/inventory/useStocks'
import { Plus } from 'lucide-react'
import { getStockTransferColumns } from './columns'

export default function StockTransfersPage() {
  const { page, limit, search, ordering } = useSearchParameters()
  const { deleteStockTransfer, markTransferExpenseAsPaid } =
    useStockTransferMutations()
  const { data, isLoading } = useStockTransfers({
    page,
    limit,
    search,
    ordering,
  })

  const handleDelete = (stockTransfer: StockTransfer) => {
    if (stockTransfer.id !== undefined) {
      deleteStockTransfer.mutate(stockTransfer.id)
    }
  }

  const handleMarkAsPaid = (stockTransfer: StockTransfer) => {
    if (stockTransfer?.id) {
      markTransferExpenseAsPaid.mutate(stockTransfer.id)
    }
  }

  // Sheets
  const {
    entityState: viewSheet,
    openEntity: openView,
    closeEntity: closeView,
  } = useEntitySheet<StockTransfer>()
  const {
    entityState: createSheet,
    openEntity: openCreate,
    closeEntity: closeCreate,
  } = useEntitySheet<StockTransfer>()
  const {
    entityState: editSheet,
    openEntity: openEdit,
    closeEntity: closeEdit,
  } = useEntitySheet<StockTransfer>()

  const columns = getStockTransferColumns({
    onView: openView,
    onEdit: openEdit,
    onDelete: handleDelete,
  })

  return (
    <div className="container mx-auto">
      {/* Create transfer sheet */}
      <EntitySheet<StockTransfer>
        open={createSheet.open}
        onClose={closeCreate}
        title="New Stock Transfer"
        description="Create a new stock transfer by selecting technician, destination stall, and items."
        withCloseConfirmation
        renderForm={({ forceClose }) => (
          <StockTransferForm onClose={forceClose} />
        )}
      />

      {/* Edit transfer sheet */}
      <EntitySheet<StockTransfer>
        open={editSheet.open}
        onClose={closeEdit}
        entity={editSheet.entity}
        title="Edit Stock Transfer"
        description="Update the details of this stock transfer."
        withCloseConfirmation
        renderForm={({ forceClose, entity }) => (
          <StockTransferForm
            onClose={forceClose}
            initialData={entity}
          />
        )}
      />

      {/* View transfer sheet */}
      <EntitySheet<StockTransfer>
        open={viewSheet.open}
        onClose={closeView}
        entity={viewSheet.entity}
        title="Transfer Details"
        description="Review the details of this stock transfer."
        withCloseConfirmation={false}
        renderForm={({ onClose, entity }) =>
          entity ? (
            <StockTransferDetails
              entity={entity}
              onClose={onClose}
              onMarkAsPaid={() => {
                handleMarkAsPaid(entity)
                closeView()
              }}
              markAsPaidPending={markTransferExpenseAsPaid.isPending}
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
            Transfer Stock
          </Button>
        }
      />
    </div>
  )
}
