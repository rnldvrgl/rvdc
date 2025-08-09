'use client'

import EntitySheet from '@/components/custom/shared/EntitySheet'
import { DataTable } from '@/components/custom/table/DataTable'
import { RemittanceDetails } from '@/components/details/RemittanceDetails'
import RemittanceForm from '@/components/forms/RemittanceForm'
import { Button } from '@/components/ui/button'
import { RemittanceRecord } from '@/lib/constants/interface'
import { useCurrentUser } from '@/lib/hooks/useCurrentUser'
import { useEntitySheet } from '@/lib/hooks/useEntitySheet'
import useSearchParameters from '@/lib/hooks/useSearchParameters'
import { useRemittanceMutations } from '@/lib/mutations/useRemittanceMutations'
import {
  useRemittancesRecordFilters,
  useRemittancesRecords,
} from '@/lib/queries/useRemittancesRecords'
import { Plus } from 'lucide-react'
import { getRemittanceColumns } from './columns'

export default function RemittancesPage() {
  const { role } = useCurrentUser()
  const { page, limit, search, ordering, filter } = useSearchParameters()
  const { data, isLoading } = useRemittancesRecords({
    page,
    limit,
    search,
    ordering,
    filter,
  })
  const { filters, orderingOptions } = useRemittancesRecordFilters()
  const { deleteRemittance, markRemitted } = useRemittanceMutations()

  const {
    entityState: viewSheet,
    openEntity: openView,
    closeEntity: closeView,
  } = useEntitySheet<RemittanceRecord>()
  const {
    entityState: createSheet,
    openEntity: openCreate,
    closeEntity: closeCreate,
  } = useEntitySheet<RemittanceRecord>()
  const {
    entityState: editSheet,
    openEntity: openEdit,
    closeEntity: closeEdit,
  } = useEntitySheet<RemittanceRecord>()

  const columns = getRemittanceColumns({
    onView: openView,
    onEdit: openEdit,
    onDelete: (tx) => {
      if (tx?.id) deleteRemittance.mutate(tx.id)
    },
    role: role ?? 'guest',
  })

  return (
    <>
      <EntitySheet
        open={createSheet.open}
        onClose={closeCreate}
        title="New Remittance"
        description="Record a new remittance."
        withCloseConfirmation
        renderForm={({ forceClose }) => <RemittanceForm onClose={forceClose} />}
      />

      <EntitySheet
        open={editSheet.open}
        onClose={closeEdit}
        entity={editSheet.entity}
        title="Edit Remittance"
        description="Update remittance details."
        withCloseConfirmation
        renderForm={({ forceClose, entity }) =>
          entity ? (
            <RemittanceForm
              initialData={{
                ...entity,
                stall: entity.stall,
              }}
              onClose={forceClose}
            />
          ) : null
        }
      />

      <EntitySheet
        open={viewSheet.open}
        onClose={closeView}
        entity={viewSheet.entity}
        title="View Remittance"
        description="Read-only details"
        renderForm={({ entity, onClose }) =>
          entity ? (
            <RemittanceDetails
              entity={entity}
              onClose={onClose}
              onMarkAsRemitted={() => {
                if (entity.id) markRemitted.mutate(entity.id)
                onClose()
              }}
              markAsRemittedPending={markRemitted.isPending}
            />
          ) : null
        }
      />

      <DataTable
        isLoading={isLoading}
        columns={columns}
        data={data ?? { count: 0, next: null, previous: null, results: [] }}
        headerActions={
          <Button onClick={() => openCreate()}>
            <Plus className="size-4 mr-1" />
            New Remittance
          </Button>
        }
        defaultRangePreset="Last 30 Days"
        filters={filters}
        orderingOptions={orderingOptions}
      />
    </>
  )
}
