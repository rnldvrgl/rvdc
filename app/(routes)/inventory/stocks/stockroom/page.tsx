"use client"

import { getStockRoomStockColumns } from "@/app/(routes)/inventory/stocks/stockroom/columns"
import { ArchiveToggle } from "@/components/custom/shared/ArchiveToggle"
import EntitySheet from "@/components/custom/shared/EntitySheet"
import PageHeader from "@/components/custom/shared/PageHeader"
import { Wrapper } from "@/components/custom/shared/Wrapper"
import { DataTable } from "@/components/custom/table/DataTable"
import RestockForm from "@/components/forms/inventory/RestockForm"
import StockRoomAuditDialog from "@/components/forms/inventory/StockRoomAuditDialog"
import StockThresholdForm from "@/components/forms/inventory/StockThresholdForm"
import { Button } from "@/components/ui/button"
import { StockRoomStock } from "@/lib/constants/interface"
import { useArchive } from "@/lib/hooks/useArchive"
import { useCurrentUser } from "@/lib/hooks/useCurrentUser"
import { useEntitySheet } from "@/lib/hooks/useEntitySheet"
import useSearchParameters from "@/lib/hooks/useSearchParameters"
import { useStockRoomStockMutations } from "@/lib/mutations/useStockRoomStockMutations"
import {
  useStockRoomFilters,
  useStockRoomStocks,
} from "@/lib/queries/inventory/useStocks"
import { Eye, Plus, Warehouse } from "lucide-react"
import { useState } from "react"

export default function StockRoomStocksPage() {
  const { isAdmin } = useCurrentUser()
  const [isArchived, setIsArchived] = useState(false)
  const searchParams = useSearchParameters()
  const { page, limit, search, ordering, filter } = searchParams
  const { softDeleteStockRoomStock } = useStockRoomStockMutations()
  const { archivedQuery, restoreItem, hardDeleteItem } =
    useArchive<StockRoomStock>(
      "/inventory/stockroom/stocks/",
      "stockroom-stocks",
      searchParams,
      isArchived,
    )
  const { data, isLoading, refetch } = useStockRoomStocks({
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

  const {
    entityState: { open: viewOpen, entity: viewEntity },
    openEntity: openViewSheet,
    closeEntity: closeViewSheet,
  } = useEntitySheet<StockRoomStock>()

  const {
    entityState: { open: auditOpen, entity: auditEntity },
    openEntity: openAuditDialog,
    closeEntity: closeAuditDialog,
  } = useEntitySheet<StockRoomStock>()

  const handleDelete = (stock: StockRoomStock) => {
    if (stock.id !== undefined) {
      softDeleteStockRoomStock.mutate(stock.id)
    }
  }

  const handleRestore = (stock: StockRoomStock) => {
    if (stock.id !== undefined) restoreItem.mutate(stock.id)
  }

  const handleHardDelete = (stock: StockRoomStock) => {
    if (stock.id !== undefined) hardDeleteItem.mutate(stock.id)
  }

  const handleView = (stock: StockRoomStock) => {
    openViewSheet(stock)
  }

  const columns = isArchived
    ? getStockRoomStockColumns({
        onEdit: () => {},
        onDelete: () => {},
        onRestore: handleRestore,
      })
    : getStockRoomStockColumns({
        onEdit: openEditSheet,
        onDelete: handleDelete,
        onRestock: openRestockSheet,
        onView: handleView,
        onAudit: openAuditDialog,
      })

  return (
    <Wrapper>
      <PageHeader
        icon={Warehouse}
        title="Stockroom Management"
        description="Manage central warehouse inventory with comprehensive stock tracking, automated reordering, and threshold management."
        breadcrumbs={["Dashboard", "Inventory", "Stocks", "Stockroom"]}
        isAdminOnly
        onRefresh={refetch}
      />

      <ArchiveToggle
        isArchived={isArchived}
        onToggle={setIsArchived}
        archivedCount={archivedQuery.data?.count}
      />

      {!isArchived && (
        <>
          {/* View Stock Sheet */}
          <EntitySheet<StockRoomStock>
            open={viewOpen}
            onClose={closeViewSheet}
            entity={viewEntity}
            title="Stockroom Item Details"
            description="View detailed information about this stockroom item."
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
                        Item Code/SKU
                      </label>
                      <p className="text-base font-medium font-mono bg-muted px-2 py-1 rounded">
                        {entity.item?.id || "N/A"}
                      </p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">
                        Current Quantity
                      </label>
                      <p className="text-base font-medium">
                        {entity.quantity || 0} units
                      </p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">
                        Unit Cost
                      </label>
                      <p className="text-base font-medium">
                        ₱{entity.item?.cost_price?.toLocaleString() || "0.00"}
                      </p>
                    </div>
                    {/*<div>
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
								</div>*/}
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">
                        Total Value
                      </label>
                      <p className="text-base font-medium">
                        ₱
                        {(
                          entity.quantity * Number(entity.item.retail_price)
                        ).toLocaleString()}
                      </p>
                    </div>
                    {parseFloat(
                      entity.item?.waste_tolerance_percentage || "0",
                    ) > 0 && (
                      <div>
                        <label className="text-sm font-medium text-muted-foreground">
                          Waste Tolerance
                        </label>
                        <p className="text-base font-medium text-amber-600 dark:text-amber-400">
                          {entity.item.waste_tolerance_percentage}%
                        </p>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          Acceptable loss when dispensing this item
                        </p>
                      </div>
                    )}
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">
                        Stock Status
                      </label>
                      <p className="text-base font-medium">
                        {(entity.quantity || 0) <= 0 ? (
                          <span className="inline-flex items-center gap-1.5 px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400">
                            <div className="size-1.5 rounded-full bg-current"></div>
                            Low Stock
                          </span>
                        ) : (entity.quantity || 0) >= 999999 ? (
                          <span className="inline-flex items-center gap-1.5 px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400">
                            <div className="size-1.5 rounded-full bg-current"></div>
                            Overstocked
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400">
                            <div className="size-1.5 rounded-full bg-current"></div>
                            Optimal
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
          <EntitySheet<StockRoomStock>
            open={editOpen}
            onClose={closeEditSheet}
            entity={editEntity}
            title="Edit Stockroom Thresholds"
            description="Update the stock threshold limits below."
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

          {/* Restock Sheet */}
          <EntitySheet<StockRoomStock>
            open={restockOpen}
            onClose={closeRestockSheet}
            entity={restockEntity}
            title="Restock Stockroom"
            description="Add quantity to existing stockroom inventory."
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

          {/* Audit Dialog */}
          <StockRoomAuditDialog
            open={auditOpen}
            onClose={closeAuditDialog}
            stock={auditEntity ?? null}
          />
        </>
      )}

      {/* Main Content */}
      <DataTable
        enableVirtualization
        title="Stockroom Inventory"
        description="Central warehouse inventory management and tracking"
        isLoading={isArchived ? archivedQuery.isLoading : isLoading}
        columns={columns}
        data={
          (isArchived ? archivedQuery.data : data) || {
            count: 0,
            next: null,
            previous: null,
            results: [],
          }
        }
        filters={isArchived ? undefined : filters}
        orderingOptions={isArchived ? undefined : orderingOptions}
        onRefresh={isArchived ? archivedQuery.refetch : refetch}
        withoutDateRangeFilter
        emptyIcon={Warehouse}
        emptyTitle={
          isArchived ? "No archived stockroom items" : "Stockroom is empty"
        }
        emptyDescription={
          isArchived
            ? "Archived items will appear here"
            : "Add stock entries to track warehouse inventory"
        }
      />
    </Wrapper>
  )
}
