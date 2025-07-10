'use client'

import { getStallStockColumns } from '@/app/(routes)/inventory/stocks/stall/columns'
import EntitySheet from '@/components/custom/shared/EntitySheet'
import { DataTable } from '@/components/custom/table/DataTable'
import RestockForm from '@/components/forms/inventory/RestockForm'
import StockThresholdForm from '@/components/forms/inventory/StockThresholdForm'
import { Stock } from '@/lib/constants/interface'
import { useEntitySheet } from '@/lib/hooks/useEntitySheet'
import useSearchParameters from '@/lib/hooks/useSearchParameters'
import { useStallStockMutations } from '@/lib/mutations/useStallStockMutations'
import { useStallStocks } from '@/lib/queries/inventory/useStocks'
import useUserProfileStore from '@/lib/store/useUserProfileStore'

export default function StocksPage() {
  const { page, limit, search, ordering, filter } = useSearchParameters()
  const { softDeleteStallStock } = useStallStockMutations()
  const userProfile = useUserProfileStore((state) => state.userProfile)
  const role = userProfile?.role
  const { data, isLoading } = useStallStocks({
    page,
    limit,
    search,
    ordering,
    filter,
  })

  const {
    entityState: { open: editOpen, entity: editEntity },
    openEntity: openEditSheet,
    closeEntity: closeEditSheet,
  } = useEntitySheet<Stock>()

  const {
    entityState: { open: restockOpen, entity: restockEntity },
    openEntity: openRestockSheet,
    closeEntity: closeRestockSheet,
  } = useEntitySheet<Stock>()

  const handleDelete = (stock: Stock) => {
    if (stock.id !== undefined && stock.stall && stock.stall.id !== undefined) {
      softDeleteStallStock.mutate(stock.id)
    }
  }

  const columns = getStallStockColumns({
    onEdit: openEditSheet,
    onDelete: handleDelete,
    onRestock: openRestockSheet,
    role,
  })

  return (
    <div className="container mx-auto">
      <EntitySheet<Stock>
        open={editOpen}
        onOpenChange={(isOpen) => !isOpen && closeEditSheet()}
        entity={editEntity}
        title="Edit Stall Stock"
        description="Update the stall stock details below."
        renderForm={({ onClose, entity }) =>
          entity ? (
            <StockThresholdForm
              type="stall"
              onClose={onClose}
              stock={entity}
            />
          ) : null
        }
      />

      <EntitySheet<Stock>
        open={restockOpen}
        onOpenChange={(isOpen) => !isOpen && closeRestockSheet()}
        entity={restockEntity}
        title="Restock Stall"
        description="Add quantity to existing stock."
        renderForm={({ onClose, entity }) =>
          entity ? (
            <RestockForm
              type="stall"
              onClose={onClose}
              stock={entity}
            />
          ) : null
        }
      />

      <DataTable
        isLoading={isLoading}
        columns={columns}
        data={data?.results ?? []}
      />
    </div>
  )
}
