"use client"

import { getCategoryColumns } from "@/app/(routes)/inventory/categories/columns"
import { ArchiveToggle } from "@/components/custom/shared/ArchiveToggle"
import EntitySheet from "@/components/custom/shared/EntitySheet"
import PageHeader from "@/components/custom/shared/PageHeader"
import { Wrapper } from "@/components/custom/shared/Wrapper"
import { DataTable } from "@/components/custom/table/DataTable"
import ItemCategoryForm from "@/components/forms/inventory/ItemCategoryForm"
import { Button } from "@/components/ui/button"
import { ProductCategory } from "@/lib/constants/interface"
import { useArchive } from "@/lib/hooks/useArchive"
import { useCurrentUser } from "@/lib/hooks/useCurrentUser"
import { useEntitySheet } from "@/lib/hooks/useEntitySheet"
import useSearchParameters from "@/lib/hooks/useSearchParameters"
import { useItemCategoryMutations } from "@/lib/mutations/useItemCategoryMutations"
import { useItemCategories } from "@/lib/queries/inventory/useItemCategories"
import { FolderOpen, Plus } from "lucide-react"
import { useState } from "react"

export default function ItemCategoriesPage() {
  const { isAdmin } = useCurrentUser()
  const [isArchived, setIsArchived] = useState(false)
  const searchParams = useSearchParameters()
  const { page, limit, search, ordering, filter } = searchParams
  const { deleteCategory } = useItemCategoryMutations()
  const { archivedQuery, restoreItem, hardDeleteItem } =
    useArchive<ProductCategory>(
      "/inventory/categories/",
      "item-categories",
      searchParams,
      isArchived,
    )
  const { data, isLoading, refetch } = useItemCategories({
    page,
    limit,
    search,
    ordering,
    filter,
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

  const {
    entityState: { open: viewOpen, entity: viewEntity },
    openEntity: openViewSheet,
    closeEntity: closeViewSheet,
  } = useEntitySheet<ProductCategory>()

  const handleDelete = (category: ProductCategory) => {
    if (category.id !== undefined) {
      deleteCategory.mutate(category.id)
    }
  }

  const handleRestore = (category: ProductCategory) => {
    if (category.id !== undefined) restoreItem.mutate(category.id)
  }

  const handleHardDelete = (category: ProductCategory) => {
    if (category.id !== undefined) hardDeleteItem.mutate(category.id)
  }

  const handleView = (category: ProductCategory) => {
    openViewSheet(category)
  }

  const columns = isArchived
    ? getCategoryColumns({
        onEdit: () => {},
        onDelete: () => {},
        onRestore: handleRestore,
        onHardDelete: handleHardDelete,
      })
    : getCategoryColumns({
        onEdit: openEditSheet,
        onDelete: handleDelete,
        onView: handleView,
      })

  return (
    <Wrapper>
      <PageHeader
        icon={FolderOpen}
        title="Product Categories"
        description="Organize your inventory with product categories to improve organization and searchability of items."
        breadcrumbs={["Dashboard", "Inventory", "Categories"]}
        isAdminOnly
        onRefresh={refetch}
        actionButton={
          !isArchived &&
          isAdmin && (
            <Button onClick={() => openAddSheet()}>
              <Plus className="size-4 mr-2" />
              Add Category
            </Button>
          )
        }
      />

      <ArchiveToggle
        isArchived={isArchived}
        onToggle={setIsArchived}
        archivedCount={archivedQuery.data?.count}
      />

      {!isArchived && (
        <>
          {/* View Category Sheet */}
          <EntitySheet<ProductCategory>
            open={viewOpen}
            onClose={closeViewSheet}
            entity={viewEntity}
            title="Category Details"
            description="View detailed information about this product category."
            renderForm={({ onClose, entity }) =>
              entity ? (
                <div className="space-y-6 p-6">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">
                        Category Name
                      </label>
                      <p className="text-base font-medium">
                        {entity.name || "N/A"}
                      </p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">
                        Category ID
                      </label>
                      <p className="text-base font-medium font-mono bg-muted px-2 py-1 rounded">
                        {entity.id || "N/A"}
                      </p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">
                        Created Date
                      </label>
                      <p className="text-base font-medium">
                        {entity.created_at
                          ? new Date(entity.created_at).toLocaleDateString()
                          : "Unknown"}
                      </p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">
                        Status
                      </label>
                      <p className="text-base font-medium">
                        {!entity.is_deleted ? (
                          <span className="inline-flex items-center gap-1.5 px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400">
                            <div className="size-1.5 rounded-full bg-current"></div>
                            Active
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400">
                            <div className="size-1.5 rounded-full bg-current"></div>
                            Deleted
                          </span>
                        )}
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
                      <Button
                        onClick={() => {
                          onClose()
                          openEditSheet(entity)
                        }}
                      >
                        <Plus className="size-4 mr-2" />
                        Edit Category
                      </Button>
                    )}
                  </div>
                </div>
              ) : null
            }
          />

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
        </>
      )}

      {/* Main Content */}
      <DataTable
        title="Product Categories"
        description="Manage and organize your product categories"
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
        withoutDateRangeFilter
        emptyIcon={FolderOpen}
        emptyTitle={
          isArchived ? "No archived categories" : "No categories found"
        }
        emptyDescription={
          isArchived
            ? "Archived categories will appear here"
            : "Create your first category to organize products"
        }
      />
    </Wrapper>
  )
}
