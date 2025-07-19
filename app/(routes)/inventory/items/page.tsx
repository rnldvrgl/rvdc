'use client'

import { getItemColumns } from '@/app/(routes)/inventory/items/columns'
import EntitySheet from '@/components/custom/shared/EntitySheet'
import { DataTable } from '@/components/custom/table/DataTable'
import ItemForm from '@/components/forms/inventory/ItemForm'
import { Button } from '@/components/ui/button'
import { Item } from '@/lib/constants/interface'
import { useEntitySheet } from '@/lib/hooks/useEntitySheet'
import useSearchParameters from '@/lib/hooks/useSearchParameters'
import { useItemMutations } from '@/lib/mutations/useItemMutations'
import { useItems } from '@/lib/queries/inventory/useItems'
import useUserProfileStore from '@/lib/store/useUserProfileStore'
import { Plus } from 'lucide-react'

export default function ItemsPage() {
  const { page, limit, search, ordering, filter } = useSearchParameters()
  const { deleteItem } = useItemMutations()
  const { data, isLoading } = useItems({
    page,
    limit,
    search,
    ordering,
    filter,
  })
  const userProfile = useUserProfileStore((state) => state.userProfile)
  const role = userProfile?.role || 'guest'

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

  const columns = getItemColumns({
    onEdit: openEditSheet,
    onDelete: handleDelete,
    role,
  })

  return (
    <div className="container mx-auto">
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

      <EntitySheet<Item>
        open={addOpen}
        onClose={closeAddSheet}
        title="Add Item"
        description="Fill out the form below to add a new item."
        withCloseConfirmation
        renderForm={({ forceClose }) => <ItemForm onClose={forceClose} />}
      />

      <DataTable
        isLoading={isLoading}
        columns={columns}
        data={data || { count: 0, next: null, previous: null, results: [] }}
        headerActions={
          role === 'admin' && (
            <Button onClick={() => openAddSheet()}>
              <Plus className="size-4 mr-1" />
              Add Item
            </Button>
          )
        }
      />
    </div>
  )
}
