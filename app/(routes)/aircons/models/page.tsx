'use client'

import { getAirconModelColumns } from '@/app/(routes)/aircons/models/columns'
import EntitySheet from '@/components/custom/shared/EntitySheet'
import { DataTable } from '@/components/custom/table/DataTable'
import AirconModelForm from '@/components/forms/installations/AirconModelForm'
import { Button } from '@/components/ui/button'
import { AirconModels } from '@/lib/constants/interface'
import { useEntitySheet } from '@/lib/hooks/useEntitySheet'
import useSearchParameters from '@/lib/hooks/useSearchParameters'
import { useAirconModelMutations } from '@/lib/mutations/installations/useAirconModelMutations'
import {
  useAirconModelFilters,
  useAirconModels,
} from '@/lib/queries/useAircons'
import { Plus } from 'lucide-react'

export default function AirconModelsPage() {
  const { page, limit, search, ordering, filter } = useSearchParameters()
  const { filters, orderingOptions } = useAirconModelFilters()
  const { deleteModel } = useAirconModelMutations()
  const { data, isLoading } = useAirconModels({
    page,
    limit,
    search,
    ordering,
    filter,
  })

  // Edit sheet state
  const {
    entityState: { open: editOpen, entity },
    openEntity: openEditSheet,
    closeEntity: closeEditSheet,
  } = useEntitySheet<AirconModels>()

  // Add sheet state
  const {
    entityState: { open: addOpen },
    openEntity: openAddSheet,
    closeEntity: closeAddSheet,
  } = useEntitySheet<AirconModels>()

  // Discount sheet state
  const {
    entityState: { open: discountOpen, entity: discountEntity },
    openEntity: openDiscountSheet,
    closeEntity: closeDiscountSheet,
  } = useEntitySheet<AirconModels>()

  // Delete handler
  const handleDelete = (model: AirconModels) => {
    if (model.id !== undefined) {
      deleteModel.mutate(model.id)
    }
  }

  const columns = getAirconModelColumns({
    onEdit: openEditSheet,
    onDelete: handleDelete,
    onCustomAction: openDiscountSheet,
  })

  return (
    <div className="container mx-auto">
      {/* Edit Aircon Model Sheet */}
      <EntitySheet<AirconModels>
        open={editOpen}
        onClose={closeEditSheet}
        entity={entity}
        title="Edit Aircon Model"
        description="Update the aircon model details below."
        withCloseConfirmation
        renderForm={({ forceClose, entity }) => (
          <AirconModelForm
            onClose={forceClose}
            initialData={entity}
          />
        )}
      />

      {/* Add Aircon Model Sheet */}
      <EntitySheet<AirconModels>
        open={addOpen}
        onClose={closeAddSheet}
        title="Add Aircon Model"
        description="Fill out the form below to add a new aircon model."
        withCloseConfirmation
        renderForm={({ forceClose }) => (
          <AirconModelForm onClose={forceClose} />
        )}
      />

      {/* Discount Sheet */}
      <EntitySheet<AirconModels>
        open={discountOpen}
        onClose={closeDiscountSheet}
        entity={discountEntity}
        title={
          discountEntity?.discount_percentage
            ? 'Update Discount'
            : 'Add Discount'
        }
        description={
          discountEntity?.discount_percentage
            ? 'Update the promo discount for this model.'
            : 'Apply a promo discount to this model.'
        }
        withCloseConfirmation
        renderForm={({ forceClose, entity }) => (
          <AirconModelForm
            onClose={forceClose}
            initialData={entity}
            isAddingDiscount
          />
        )}
      />

      {/* Data Table */}
      <DataTable
        isLoading={isLoading}
        columns={columns}
        data={data || { count: 0, next: null, previous: null, results: [] }}
        headerActions={
          <Button onClick={() => openAddSheet()}>
            <Plus className="size-4 mr-1" />
            Add Model
          </Button>
        }
        filters={filters}
        orderingOptions={orderingOptions}
      />
    </div>
  )
}
