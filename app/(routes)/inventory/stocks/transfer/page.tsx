'use client'

import { DataTable } from '@/components/custom/table/DataTable'
import StockTransferWizardForm from '@/components/forms/inventory/StockTransferWizardForm'
import EntitySheet from '@/components/sheets/EntitySheet'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { StockTransfer } from '@/lib/constants/interface'
import { useEntitySheet } from '@/lib/hooks/useEntitySheet'
import useSearchParameters from '@/lib/hooks/useSearchParameters'
import { useStockTransferMutations } from '@/lib/mutations/useStockTransferMutations'
import { useStockTransfers } from '@/lib/queries/inventory/useStockTransfers'
import { formatDate, getTransferBadgeVariant } from '@/lib/utils/helpers'
import { Plus } from 'lucide-react'
import { getStockTransferColumns } from './columns'

// Reusable row component
function DetailRow({
  label,
  value,
}: {
  label: string
  value: React.ReactNode
}) {
  return (
    <div>
      <span className="text-muted-foreground">{label}</span>
      <div className="font-medium">{value}</div>
    </div>
  )
}

export default function StockTransfersPage() {
  const { page, limit, search, ordering } = useSearchParameters()
  const { deleteStockTransfer } = useStockTransferMutations()
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

  // Sheets
  const {
    sheetState: viewSheet,
    openSheet: openView,
    closeSheet: closeView,
  } = useEntitySheet<StockTransfer>()
  const {
    sheetState: createSheet,
    openSheet: openCreate,
    closeSheet: closeCreate,
  } = useEntitySheet<StockTransfer>()
  const {
    sheetState: editSheet,
    openSheet: openEdit,
    closeSheet: closeEdit,
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
        onOpenChange={(isOpen) => !isOpen && closeCreate()}
        title="New Stock Transfer"
        description="Create a new stock transfer by selecting technician, destination stall, and items."
        renderForm={({ onClose }) => (
          <StockTransferWizardForm onClose={onClose} />
        )}
      />

      {/* Edit transfer sheet */}
      <EntitySheet<StockTransfer>
        open={editSheet.open}
        onOpenChange={(isOpen) => !isOpen && closeEdit()}
        entity={editSheet.entity}
        title="Edit Stock Transfer"
        description="Update the details of this stock transfer."
        renderForm={({ onClose, entity }) => (
          <StockTransferWizardForm
            onClose={onClose}
            initialData={entity}
          />
        )}
      />

      {/* View transfer sheet */}
      <EntitySheet<StockTransfer>
        open={viewSheet.open}
        onOpenChange={(isOpen) => !isOpen && closeView()}
        entity={viewSheet.entity}
        title="Transfer Details"
        description="Review the details of this stock transfer."
        renderForm={({ onClose, entity }) => (
          <div className="space-y-6">
            <div className="space-y-2 border-b pb-4">
              <h3 className="text-lg font-semibold">General Information</h3>
              <div className="grid grid-cols-1 gap-4">
                <DetailRow
                  label="To Stall"
                  value={entity?.to_stall?.name ?? 'N/A'}
                />
                <DetailRow
                  label="Technician"
                  value={
                    entity?.technician
                      ? `${entity.technician.first_name} ${entity.technician.last_name}`
                      : 'N/A'
                  }
                />
                <DetailRow
                  label="Date"
                  value={
                    entity?.transfer_date
                      ? formatDate(new Date(entity.transfer_date))
                      : 'N/A'
                  }
                />

                <div className="flex items-center gap-2">
                  <span className="text-muted-foreground">Finalized</span>
                  <Badge
                    variant={getTransferBadgeVariant(
                      entity?.is_finalized ?? false,
                    )}
                  >
                    {entity?.is_finalized ? 'Yes' : 'No'}
                  </Badge>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-muted-foreground">Paid</span>
                  <Badge
                    variant={getTransferBadgeVariant(entity?.is_paid ?? false)}
                  >
                    {entity?.is_paid ? 'Yes' : 'No'}
                  </Badge>
                </div>
              </div>
            </div>

            <div>
              <h3 className="text-lg font-semibold mb-2">Transferred Items</h3>
              {entity?.items?.length ? (
                <div className="space-y-2">
                  {entity.items.map((item, idx) => (
                    <div
                      key={idx}
                      className="flex items-center justify-between rounded-lg border p-3"
                    >
                      <div className="flex flex-col">
                        <span className="font-medium">{item.item.name}</span>
                        <span className="text-sm text-muted-foreground">
                          Item SKU: {item.item.sku}
                        </span>
                      </div>
                      <Badge variant="secondary">Qty: {item.quantity}</Badge>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">
                  No items listed.
                </p>
              )}
            </div>

            <div className="pt-4">
              <Button
                type="button"
                onClick={onClose}
              >
                Close
              </Button>
            </div>
          </div>
        )}
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
