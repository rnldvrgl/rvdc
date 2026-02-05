"use client"

import { getStallStockColumns } from "@/app/(routes)/inventory/stocks/stall/columns"
import EntitySheet from "@/components/custom/shared/EntitySheet"
import PageHeader from "@/components/custom/shared/PageHeader"
import { Wrapper } from "@/components/custom/shared/Wrapper"
import { DataTable } from "@/components/custom/table/DataTable"
import AddStockForm from "@/components/forms/inventory/AddStockForm"
import RestockForm from "@/components/forms/inventory/RestockForm"
import StockThresholdForm from "@/components/forms/inventory/StockThresholdForm"
import { Button } from "@/components/ui/button"
import { Stock } from "@/lib/constants/interface"
import { useCurrentUser } from "@/lib/hooks/useCurrentUser"
import { useEntitySheet } from "@/lib/hooks/useEntitySheet"
import useSearchParameters from "@/lib/hooks/useSearchParameters"
import { useStallStockMutations } from "@/lib/mutations/useStallStockMutations"
import {
  useStallStocks,
  useStockFilters,
} from "@/lib/queries/inventory/useStocks"
import { Eye, Package, Plus } from "lucide-react"

export default function StocksPage() {
  const { isAdmin, role } = useCurrentUser()
  const { page, limit, search, ordering, filter } = useSearchParameters()
  const { softDeleteStallStock } = useStallStockMutations()

  const { data, isLoading, refetch } = useStallStocks({
    page,
    limit,
    search,
    ordering,
    filter,
  })

  const { filters, orderingOptions } = useStockFilters()

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

  const {
    entityState: { open: addStockOpen, entity: addStockEntity },
    openEntity: openAddStockSheet,
    closeEntity: closeAddStockSheet,
  } = useEntitySheet<Stock>()

  const {
    entityState: { open: viewOpen, entity: viewEntity },
    openEntity: openViewSheet,
    closeEntity: closeViewSheet,
  } = useEntitySheet<Stock>()

  const handleDelete = (stock: Stock) => {
    if (stock.id !== undefined && stock.stall?.id !== undefined) {
      softDeleteStallStock.mutate(stock.id)
    }
  }

  const handleView = (stock: Stock) => {
    openViewSheet(stock)
  }

  const columns = getStallStockColumns({
    onEdit: openEditSheet,
    onDelete: handleDelete,
    onRestock: openRestockSheet,
    onAddStock: openAddStockSheet,
    onView: handleView,
    role,
  })

  return (
    <Wrapper>
      <PageHeader
        icon={Package}
        title="Stall Stock Management"
        description="Monitor and manage inventory levels across all stall locations with real-time stock tracking and automated alerts."
        breadcrumbs={["Dashboard", "Inventory", "Stocks", "Stalls"]}
        onRefresh={refetch}
      />

      {/* View Stock Sheet */}
      <EntitySheet<Stock>
        open={viewOpen}
        onClose={closeViewSheet}
        entity={viewEntity}
        title="Stock Details"
        description="View detailed information about this stock item."
        renderForm={({ onClose, entity }) =>
          entity ? (
            <div className="space-y-6 p-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-muted-foreground">
                    Item Name
                  </label>
                  <p className="text-base font-medium">
                    {entity.item?.name || "N/A"}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">
                    Stall Location
                  </label>
                  <p className="text-base font-medium">
                    {entity.stall?.name || "N/A"}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">
                    Current Quantity
                  </label>
                  <p className="text-base font-medium">
                    {entity.quantity || 0}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">
                    Minimum Threshold
                  </label>
                  <p className="text-base font-medium">
                    {entity.min_threshold || "Not set"}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">
                    Maximum Threshold
                  </label>
                  <p className="text-base font-medium">
                    {entity.max_threshold || "Not set"}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">
                    Stock Tracking
                  </label>
                  <p className="text-base font-medium">
                    {entity.track_stock ? (
                      <span className="inline-flex items-center gap-1.5 px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400">
                        <div className="size-1.5 rounded-full bg-current"></div>
                        Enabled
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-700 dark:bg-gray-900/30 dark:text-gray-400">
                        <div className="size-1.5 rounded-full bg-current"></div>
                        Disabled
                      </span>
                    )}
                  </p>
                </div>
                <div className="sm:col-span-2">
                  <label className="text-sm font-medium text-muted-foreground">
                    Last Updated
                  </label>
                  <p className="text-base font-medium">
                    {entity.updated_at
                      ? new Date(entity.updated_at).toLocaleString()
                      : "Unknown"}
                  </p>
                </div>
              </div>
              <div className="flex justify-end gap-2 pt-4 border-t">
                <Button
                  variant="outline"
                  onClick={onClose}
                >
                  Close
                </Button>
                {isAdmin && (
                  <>
                    <Button
                      variant="outline"
                      onClick={() => {
                        onClose()
                        openRestockSheet(entity)
                      }}
                    >
                      <Plus className="size-4 mr-2" />
                      Restock
                    </Button>
                    <Button
                      onClick={() => {
                        onClose()
                        openEditSheet(entity)
                      }}
                    >
                      <Eye className="size-4 mr-2" />
                      Edit Thresholds
                    </Button>
                  </>
                )}
              </div>
            </div>
          ) : null
        }
      />

      {/* Edit Stock Sheet */}
      <EntitySheet<Stock>
        open={editOpen}
        onClose={closeEditSheet}
        entity={editEntity}
        title="Edit Stall Stock"
        description="Update the stall stock details below."
        withCloseConfirmation
        renderForm={({ forceClose, entity }) =>
          entity ? (
            <StockThresholdForm
              type="stall"
              onClose={forceClose}
              stock={entity}
            />
          ) : null
        }
      />

      {/* Restock Sheet */}
      <EntitySheet<Stock>
        open={restockOpen}
        onClose={closeRestockSheet}
        entity={restockEntity}
        title="Restock Stall"
        description="Add quantity to existing stock."
        withCloseConfirmation
        renderForm={({ forceClose, entity }) =>
          entity ? (
            <RestockForm
              type="stall"
              onClose={forceClose}
              stock={entity}
            />
          ) : null
        }
      />

      {/* Add Stock Sheet */}
      <EntitySheet<Stock>
        open={addStockOpen}
        onClose={closeAddStockSheet}
        entity={addStockEntity}
        title="Add Stock (Direct)"
        description="Directly add quantity to stall without stock room."
        withCloseConfirmation
        renderForm={({ forceClose, entity }) =>
          entity ? (
            <AddStockForm
              onClose={forceClose}
              stock={entity}
            />
          ) : null
        }
      />

      {/* Main Content */}
      <DataTable
        title="Stall Inventory"
        description="Real-time inventory levels across all stall locations"
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
        withoutDateRangeFilter
      />
    </Wrapper>
  )
}
