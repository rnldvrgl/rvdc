'use client'

import { getStockRoomStockColumns } from '@/app/(routes)/inventory/stocks/stockroom/columns'
import EntitySheet from '@/components/custom/shared/EntitySheet'
import { DataTable } from '@/components/custom/table/DataTable'
import RestockForm from '@/components/forms/inventory/RestockForm'
import StockThresholdForm from '@/components/forms/inventory/StockThresholdForm'
import { StockRoomStock } from '@/lib/constants/interface'
import { useEntitySheet } from '@/lib/hooks/useEntitySheet'
import useSearchParameters from '@/lib/hooks/useSearchParameters'
import { useStockRoomStockMutations } from '@/lib/mutations/useStockRoomStockMutations'
import {
  useStockRoomFilters,
  useStockRoomStocks,
} from '@/lib/queries/inventory/useStocks'

export default function StockRoomStocksPage() {
  const { page, limit, search, ordering, filter } = useSearchParameters()
  const { softDeleteStockRoomStock } = useStockRoomStockMutations()
  const { data, isLoading } = useStockRoomStocks({
    page,
    limit,
    search,
    ordering,
    filter,
  })
  const { filters, orderingOptions } = useStockRoomFilters()

  const {
    entityState: { open: editOpen, entity: editEntity },
    openEntity: openEditSheet,
    closeEntity: closeEditSheet,
  } = useEntitySheet<StockRoomStock>()

  const {
    entityState: { open: restockOpen, entity: restockEntity },
    openEntity: openRestockSheet,
    closeEntity: closeRestockSheet,
  } = useEntitySheet<StockRoomStock>()

  const handleDelete = (stock: StockRoomStock) => {
    if (stock.id !== undefined) {
      softDeleteStockRoomStock.mutate(stock.id)
    }
  }

  const columns = getStockRoomStockColumns({
    onEdit: openEditSheet,
    onDelete: handleDelete,
    onRestock: openRestockSheet,
  })

  return (
    <div className="container mx-auto">
      <EntitySheet<StockRoomStock>
        open={editOpen}
        onClose={closeEditSheet}
        entity={editEntity}
        title="Edit Stall Stock"
        description="Update the stall stock details below."
        withCloseConfirmation
        renderForm={({ forceClose, entity }) =>
          entity ? (
            <StockThresholdForm
              type="stock_room"
              onClose={forceClose}
              stock={entity}
            />
          ) : null
        }
      />

      <EntitySheet<StockRoomStock>
        open={restockOpen}
        onClose={closeRestockSheet}
        entity={restockEntity}
        title="Restock Stock Room Stock"
        description="Add quantity to existing stock."
        withCloseConfirmation
        renderForm={({ forceClose, entity }) =>
          entity ? (
            <RestockForm
              type="stock_room"
              onClose={forceClose}
              stock={entity}
            />
          ) : null
        }
      />

      <DataTable
        isLoading={isLoading}
        columns={columns}
        data={data || { count: 0, next: null, previous: null, results: [] }}
        filters={filters}
        orderingOptions={orderingOptions}
      />
    </div>
  )
}
