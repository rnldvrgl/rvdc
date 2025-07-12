'use client'

import { getCategoryColumns } from '@/app/(routes)/inventory/categories/columns'
import EntitySheet from '@/components/custom/shared/EntitySheet'
import { DataTable } from '@/components/custom/table/DataTable'
import ItemCategoryForm from '@/components/forms/inventory/ItemCategoryForm'
import { Button } from '@/components/ui/button'
import { ProductCategory } from '@/lib/constants/interface'
import { useEntitySheet } from '@/lib/hooks/useEntitySheet'
import useSearchParameters from '@/lib/hooks/useSearchParameters'
import { useItemCategoryMutations } from '@/lib/mutations/useItemCategoryMutations'
import { useItemCategories } from '@/lib/queries/inventory/useItemCategories'
import { Plus } from 'lucide-react'

export default function ItemCategoriesPage() {
  const { page, limit, search, ordering } = useSearchParameters()
  const { deleteCategory } = useItemCategoryMutations()
  const { data, isLoading } = useItemCategories({
    page,
    limit,
    search,
    ordering,
  })

  const {
    entityState: { open: editOpen, entity },
    openEntity: openEditSheet,
    closeEntity: closeEditSheet,
  } = useEntitySheet<ProductCategory>()

  const {
    entityState: { open: addOpen },
    openEntity: openAddSheet,
    closeEntity: closeAddSheet,
  } = useEntitySheet<ProductCategory>()

  const handleDelete = (category: ProductCategory) => {
    if (category.id !== undefined) {
      deleteCategory.mutate(category.id)
    }
  }

  const columns = getCategoryColumns({
    onEdit: openEditSheet,
    onDelete: handleDelete,
  })

  return (
    <div className="container mx-auto">
      {/* Edit Category Sheet */}
      <EntitySheet<ProductCategory>
        open={editOpen}
        onClose={closeEditSheet}
        entity={entity}
        title="Edit Item Category"
        description="Update the item category details below."
        withCloseConfirmation
        renderForm={({ forceClose, entity }) => (
          <ItemCategoryForm
            onClose={forceClose}
            category={entity}
          />
        )}
      />

      {/* Add Category Sheet */}
      <EntitySheet<ProductCategory>
        open={addOpen}
        onClose={closeAddSheet}
        title="Add Item Category"
        description="Fill out the form below to add a new item category."
        withCloseConfirmation
        renderForm={({ forceClose }) => (
          <ItemCategoryForm onClose={forceClose} />
        )}
      />

      <DataTable
        isLoading={isLoading}
        columns={columns}
        data={data?.results ?? []}
        headerActions={
          <Button onClick={() => openAddSheet()}>
            <Plus className="size-4 mr-1" />
            Add Category
          </Button>
        }
      />
    </div>
  )
}
