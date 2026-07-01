"use client"

import { getAirconBrandColumns } from "@/app/(routes)/aircons/brands/columns"
import EntitySheet from "@/components/custom/shared/EntitySheet"
import PageHeader from "@/components/custom/shared/PageHeader"
import { Wrapper } from "@/components/custom/shared/Wrapper"
import { DataTable } from "@/components/custom/table/DataTable"
import AirconBrandForm from "@/components/forms/installations/AirconBrandForm"
import { Button } from "@/components/ui/button"
import { AirconBrands } from "@/lib/constants/interface"
import { useCurrentUser } from "@/lib/hooks/useCurrentUser"
import { useEntitySheet } from "@/lib/hooks/useEntitySheet"
import useSearchParameters from "@/lib/hooks/useSearchParameters"
import { useAirconBrandMutations } from "@/lib/mutations/installations/useAirconBrandMutations"
import { useAirconBrands } from "@/lib/queries/useAircons"
import { Pencil, Plus, Wind } from "lucide-react"

export default function AirconBrandsPage() {
  const { canManage } = useCurrentUser()
  const { page, limit, search, ordering, filter } = useSearchParameters()
  const { deleteBrand } = useAirconBrandMutations()
  const { data, isLoading, refetch } = useAirconBrands({
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
  } = useEntitySheet<AirconBrands>()

  const {
    entityState: { open: addOpen },
    openEntity: openAddSheet,
    closeEntity: closeAddSheet,
  } = useEntitySheet<AirconBrands>()

  const {
    entityState: { open: viewOpen, entity: viewEntity },
    openEntity: openViewSheet,
    closeEntity: closeViewSheet,
  } = useEntitySheet<AirconBrands>()

  const handleDelete = (brand: AirconBrands) => {
    if (brand.id !== undefined) {
      deleteBrand.mutate(brand.id)
    }
  }

  const handleView = (brand: AirconBrands) => {
    openViewSheet(brand)
  }

  const columns = getAirconBrandColumns({
    onEdit: openEditSheet,
    onDelete: handleDelete,
    onView: handleView,
  })

  return (
    <Wrapper>
      <PageHeader
        variant="compact"
        icon={Wind}
        title="Aircon Brands"
        description="Manage air conditioning equipment brands and manufacturer information for installation and service operations."
        breadcrumbs={["Dashboard", "Aircons", "Brands"]}
        onRefresh={refetch}
        actionButton={
          canManage && (
            <Button onClick={() => openAddSheet()}>
              <Plus className="size-4 mr-2" />
              Add Brand
            </Button>
          )
        }
      />

      {/* View Brand Sheet */}
      <EntitySheet<AirconBrands>
        open={viewOpen}
        onClose={closeViewSheet}
        entity={viewEntity}
        title="Brand Details"
        description="View detailed information about this aircon brand."
        renderForm={({ onClose, entity }) =>
          entity ? (
            <div className="space-y-6 p-6">
              {/* Brand Header Card */}
              <div className="rounded-lg border bg-linear-to-br from-blue-50 to-indigo-50 p-6">
                <div className="flex items-center gap-4">
                  <div className="flex size-14 items-center justify-center rounded-xl bg-blue-100 text-blue-700">
                    <Wind className="size-7" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-gray-900">
                      {entity.name}
                    </h3>
                    <p className="text-sm text-muted-foreground font-mono">
                      ID: #{entity.id}
                    </p>
                  </div>
                </div>
              </div>

              {/* Brand Info */}
              <div className="rounded-lg border p-4">
                <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">
                  Brand Information
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-medium text-muted-foreground">
                      Brand Name
                    </label>
                    <p className="text-base font-semibold mt-0.5">
                      {entity.name}
                    </p>
                  </div>
                  <div>
                    <label className="text-xs font-medium text-muted-foreground">
                      System ID
                    </label>
                    <p className="text-base font-medium font-mono mt-0.5 bg-muted inline-block px-2 py-0.5 rounded">
                      {entity.id}
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-4 border-t">
                <Button
                  variant="outline"
                  onClick={onClose}
                >
                  Close
                </Button>
                {canManage && (
                  <Button
                    onClick={() => {
                      onClose()
                      openEditSheet(entity)
                    }}
                  >
                    <Pencil className="size-4 mr-2" />
                    Edit Brand
                  </Button>
                )}
              </div>
            </div>
          ) : null
        }
      />

      {/* Edit Aircon Brand Sheet */}
      <EntitySheet<AirconBrands>
        open={editOpen}
        onClose={closeEditSheet}
        entity={entity}
        title="Edit Aircon Brand"
        description="Update the aircon brand details below."
        withCloseConfirmation
        renderForm={({ forceClose, entity }) => (
          <AirconBrandForm
            onClose={forceClose}
            brand={entity}
          />
        )}
      />

      {/* Add Aircon Brand Sheet */}
      <EntitySheet<AirconBrands>
        open={addOpen}
        onClose={closeAddSheet}
        title="Add Aircon Brand"
        description="Fill out the form below to add a new aircon brand."
        withCloseConfirmation
        renderForm={({ forceClose }) => (
          <AirconBrandForm onClose={forceClose} />
        )}
      />

      {/* Main Content */}
      <DataTable
        title="Aircon Brands"
        description="Manage air conditioning equipment manufacturers"
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
        withoutDateRangeFilter
        emptyIcon={Wind}
        emptyTitle="No brands found"
        emptyDescription="Add your first brand to organize aircon products"
      />
    </Wrapper>
  )
}
