"use client"

import { getItemColumns } from "@/app/(routes)/inventory/items/columns"
import { MergeItemDialog } from "@/components/custom/inventory/MergeItemDialog"
import EntitySheet from "@/components/custom/shared/EntitySheet"
import PageHeader from "@/components/custom/shared/PageHeader"
import { Wrapper } from "@/components/custom/shared/Wrapper"
import { DataTable } from "@/components/custom/table/DataTable"
import ItemForm from "@/components/forms/inventory/ItemForm"
import { Button } from "@/components/ui/button"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Item } from "@/lib/constants/interface"
import { useArchive } from "@/lib/hooks/useArchive"
import { useCurrentUser } from "@/lib/hooks/useCurrentUser"
import { useEntitySheet } from "@/lib/hooks/useEntitySheet"
import useSearchParameters from "@/lib/hooks/useSearchParameters"
import { useItemMutations } from "@/lib/mutations/useItemMutations"
import { useItemFilters, useItems } from "@/lib/queries/inventory/useItems"
import { Archive, Package, Plus } from "lucide-react"
import { useState } from "react"

export default function ItemsPage() {
  const { isAdmin, role } = useCurrentUser()
  const [viewMode, setViewMode] = useState<"active" | "archived">("active")
  const searchParams = useSearchParameters()
  const { page, limit, search, ordering, filter } = searchParams
  const { deleteItem, toggleTracked } = useItemMutations()
  const isArchived = viewMode === "archived"
  const { archivedQuery, restoreItem } = useArchive<Item>(
    "/inventory/items/",
    "items",
    searchParams,
    isArchived,
  )
  const { data, isLoading, refetch } = useItems({
    page,
    limit,
    search,
    ordering,
    filter,
  })
  const { filters, orderingOptions } = useItemFilters()

  const [
    mergeTarget,
    setMergeTarget,
  ] = useState<Item | null>(null)

  const {
    entityState: { open: editOpen, entity },
    openEntity: openEditSheet,
    closeEntity: closeEditSheet,
  } = useEntitySheet<Item>()

  const {
    entityState: { open: addOpen },
    openEntity: openAddSheet,
    closeEntity: closeAddSheet,
  } = useEntitySheet<Item>()

  const handleDelete = (item: Item) => {
    if (item.id !== undefined) {
      deleteItem.mutate(item.id)
    }
  }

  const handleRestore = (item: Item) => {
    if (item.id !== undefined) restoreItem.mutate(item.id)
  }

  const handleToggleTracked = (item: Item) => {
    if (item.id !== undefined) toggleTracked.mutate(item.id)
  }

  const columns = isArchived
    ? getItemColumns({
        onEdit: () => {},
        onDelete: () => {},
        onRestore: handleRestore,
        role: role || "guest",
      })
    : getItemColumns({
        onEdit: openEditSheet,
        onDelete: handleDelete,
        onToggleTracked: handleToggleTracked,
        onMerge: (item) => setMergeTarget(item),
        role: role || "guest",
      })

  return (
    <Wrapper>
      <PageHeader
        icon={Package}
        title="Inventory Items"
        description="Manage your product catalog and track item details across all categories."
        breadcrumbs={["Dashboard", "Inventory", "Items"]}
        actionButton={
          !isArchived &&
          isAdmin && (
            <Button onClick={() => openAddSheet()}>
              <Plus className="size-4 mr-2" />
              Add Item
            </Button>
          )
        }
      />

      <Tabs
        value={viewMode}
        onValueChange={(value) =>
          setViewMode(value as "active" | "archived")
        }
      >
        <TabsList>
          <TabsTrigger
            value="active"
            className="gap-1.5"
          >
            <Package className="size-3.5" />
            Active
          </TabsTrigger>
          <TabsTrigger
            value="archived"
            className="gap-1.5"
          >
            <Archive className="size-3.5" />
            Archived
          </TabsTrigger>
        </TabsList>
      </Tabs>

      {!isArchived && (
        <>
          {/* Edit Item Sheet */}
          <EntitySheet<Item>
            open={editOpen}
            onClose={closeEditSheet}
            entity={entity}
            title="Edit Item"
            description="Update the item details below."
            withCloseConfirmation
            renderForm={({ forceClose, entity }) => (
              <ItemForm
                onClose={forceClose}
                item={entity}
              />
            )}
          />

          {/* Add Item Sheet */}
          <EntitySheet<Item>
            open={addOpen}
            onClose={closeAddSheet}
            title="Add Item"
            description="Fill out the form below to add a new item."
            withCloseConfirmation
            renderForm={({ forceClose }) => <ItemForm onClose={forceClose} />}
          />

          {/* Merge Duplicate Item Dialog */}
          <MergeItemDialog
            open={!!mergeTarget}
            targetItem={mergeTarget}
            onClose={() => setMergeTarget(null)}
          />
        </>
      )}

      {/* Main Content */}
      <DataTable
        enableVirtualization
        title="Inventory Items"
        description={
          isArchived
            ? "Review archived inventory items"
            : "Manage your inventory catalog"
        }
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
        emptyIcon={Package}
        emptyTitle={
          isArchived
            ? "No archived items"
            : "No inventory items found"
        }
        emptyDescription={
          isArchived
            ? "Archived items will appear here"
            : "Add your first product to build your catalog"
        }
      />
    </Wrapper>
  )
}
