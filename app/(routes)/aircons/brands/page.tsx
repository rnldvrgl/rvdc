'use client'

import { getAirconBrandColumns } from '@/app/(routes)/aircons/brands/columns'
import EntitySheet from '@/components/custom/shared/EntitySheet'
import { DataTable } from '@/components/custom/table/DataTable'
import AirconBrandForm from '@/components/forms/installations/AirconBrandForm'
import { Button } from '@/components/ui/button'
import { AirconBrands } from '@/lib/constants/interface'
import { useEntitySheet } from '@/lib/hooks/useEntitySheet'
import useSearchParameters from '@/lib/hooks/useSearchParameters'
import { useAirconBrandMutations } from '@/lib/mutations/useAirconBrandMutations'
import { useAirconBrands } from '@/lib/queries/useAircons'
import { Plus } from 'lucide-react'

export default function AirconBrandsPage() {
  const { page, limit, search, ordering, filter } = useSearchParameters()
  const { deleteBrand } = useAirconBrandMutations()
  const { data, isLoading } = useAirconBrands({
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

  const handleDelete = (brand: AirconBrands) => {
    if (brand.id !== undefined) {
      deleteBrand.mutate(brand.id)
    }
  }

  const columns = getAirconBrandColumns({
    onEdit: openEditSheet,
    onDelete: handleDelete,
  })

  return (
    <div className="container mx-auto">
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

      <DataTable
        isLoading={isLoading}
        columns={columns}
        data={data || { count: 0, next: null, previous: null, results: [] }}
        headerActions={
          <Button onClick={() => openAddSheet()}>
            <Plus className="size-4 mr-1" />
            Add Brand
          </Button>
        }
      />
    </div>
  )
}
