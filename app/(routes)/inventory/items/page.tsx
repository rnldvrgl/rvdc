'use client'

import { getItemColumns } from '@/app/(routes)/inventory/items/columns'
import { DataTable } from '@/components/custom/table/DataTable'
import ItemForm from '@/components/forms/inventory/ItemForm'
import EntitySheet from '@/components/sheets/EntitySheet'
import { Button } from '@/components/ui/button'
import { Item } from '@/lib/constants/interface'
import { useEntitySheet } from '@/lib/hooks/useEntitySheet'
import useSearchParameters from '@/lib/hooks/useSearchParameters'
import { useItemMutations } from '@/lib/mutations/useItemMutations'
import { useItems } from '@/lib/queries/inventory/useItems'
import { Plus } from 'lucide-react'

export default function ItemsPage() {
  const { page, limit, search, ordering } = useSearchParameters()
  const { deleteItem } = useItemMutations()
  const { data, isLoading } = useItems({
    page,
    limit,
    search,
    ordering,
  })

  const {
    sheetState: { open: editOpen, entity },
    openSheet: openEditSheet,
    closeSheet: closeEditSheet,
  } = useEntitySheet<Item>()

  const {
    sheetState: { open: addOpen },
    openSheet: openAddSheet,
    closeSheet: closeAddSheet,
  } = useEntitySheet<Item>()

  const handleDelete = (item: Item) => {
    if (item.id !== undefined) {
      deleteItem.mutate(item.id)
    }
  }

  const columns = getItemColumns({
    onEdit: openEditSheet,
    onDelete: handleDelete,
  })

  return (
    <div className="container mx-auto">
      <EntitySheet<Item>
        open={editOpen}
        onOpenChange={(isOpen) => !isOpen && closeEditSheet()}
        entity={entity}
        title="Edit Item"
        description="Update the item details below."
        renderForm={({ onClose, entity }) => (
          <ItemForm
            onClose={onClose}
            item={entity}
          />
        )}
      />

      <EntitySheet<Item>
        open={addOpen}
        onOpenChange={(isOpen) => !isOpen && closeAddSheet()}
        title="Add Item"
        description="Fill out the form below to add a new item."
        renderForm={({ onClose }) => <ItemForm onClose={onClose} />}
      />

      <DataTable
        isLoading={isLoading}
        columns={columns}
        data={data?.results ?? []}
        headerActions={
          <Button onClick={() => openAddSheet()}>
            <Plus className="size-4 mr-1" />
            Add Item
          </Button>
        }
      />
    </div>
  )
}
