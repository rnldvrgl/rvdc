'use client'

import { getAirconUnitsColumns } from '@/app/(routes)/aircons/units/columns'
import EntitySheet from '@/components/custom/shared/EntitySheet'
import { DataTable } from '@/components/custom/table/DataTable'
import AirconUnitForm from '@/components/forms/installations/AirconUnitForm'
import { Button } from '@/components/ui/button'
import { AirconUnits } from '@/lib/constants/interface'
import { useEntitySheet } from '@/lib/hooks/useEntitySheet'
import useSearchParameters from '@/lib/hooks/useSearchParameters'
import { useAirconUnitMutations } from '@/lib/mutations/installations/useAirconUnitMutations'
import { useAirconUnitStatusMutations } from '@/lib/mutations/installations/useAirconUnitStatusMutations'
import { useAirconUnitFilters, useAirconUnits } from '@/lib/queries/useAircons'
import { Plus } from 'lucide-react'

export default function AirconUnitsPage() {
  const { page, limit, search, ordering, filter } = useSearchParameters()
  const { filters, orderingOptions } = useAirconUnitFilters()
  const { deleteUnit } = useAirconUnitMutations()
  const { claimSale, claimInstallation, reserveUnit, redeemCleaning } =
    useAirconUnitStatusMutations()
  const { data, isLoading } = useAirconUnits({
    page,
    limit,
    search,
    ordering,
    filter,
  })

  // Edit sheet
  const {
    entityState: { open: editOpen, entity },
    openEntity: openEditSheet,
    closeEntity: closeEditSheet,
  } = useEntitySheet<AirconUnits>()

  // Add sheet
  const {
    entityState: { open: addOpen },
    openEntity: openAddSheet,
    closeEntity: closeAddSheet,
  } = useEntitySheet<AirconUnits>()

  const handleDelete = (unit: AirconUnits) => {
    if (unit.id !== undefined) {
      deleteUnit.mutate(unit.id)
    }
  }

  const columns = getAirconUnitsColumns({
    onEdit: openEditSheet,
    onDelete: handleDelete,
    onSold: (unit) => unit.id && claimSale.mutate(unit.id),
    onInstall: (unit) => unit.id && claimInstallation.mutate(unit.id),
    onReserve: (unit) =>
      unit.id &&
      reserveUnit.mutate({
        id: unit.id,
        client_id: 1, // TODO: replace with real client_id from UI
      }),
    onRedeemCleaning: (unit) => unit.id && redeemCleaning.mutate(unit.id),
  })

  return (
    <>
      {/* Edit Aircon Unit Sheet */}
      <EntitySheet<AirconUnits>
        open={editOpen}
        onClose={closeEditSheet}
        entity={entity}
        title="Edit Aircon Unit"
        description="Update the aircon unit details below."
        withCloseConfirmation
        renderForm={({ forceClose, entity }) => (
          <AirconUnitForm
            onClose={forceClose}
            initialData={entity}
          />
        )}
      />

      {/* Add Aircon Unit Sheet */}
      <EntitySheet<AirconUnits>
        open={addOpen}
        onClose={closeAddSheet}
        title="Add Aircon Unit"
        description="Fill out the form below to add a new aircon unit."
        withCloseConfirmation
        renderForm={({ forceClose }) => <AirconUnitForm onClose={forceClose} />}
      />

      {/* Data Table */}
      <DataTable
        isLoading={isLoading}
        columns={columns}
        data={data || { count: 0, next: null, previous: null, results: [] }}
        headerActions={
          <Button onClick={() => openAddSheet()}>
            <Plus className="size-4 mr-1" />
            Add Unit
          </Button>
        }
        filters={filters}
        orderingOptions={orderingOptions}
      />
    </>
  )
}
