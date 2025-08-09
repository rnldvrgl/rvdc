'use client'

import EntitySheet from '@/components/custom/shared/EntitySheet'
import { DataTable } from '@/components/custom/table/DataTable'
import { ChequeCollectionDetails } from '@/components/details/ChequeCollectionDetails'
import ChequeCollectionForm from '@/components/forms/ChequeCollectionForm'
import { Button } from '@/components/ui/button'
import { ChequeCollection } from '@/lib/constants/interface'
import { useCurrentUser } from '@/lib/hooks/useCurrentUser'
import { useEntitySheet } from '@/lib/hooks/useEntitySheet'
import useSearchParameters from '@/lib/hooks/useSearchParameters'
import { useChequeCollectionMutations } from '@/lib/mutations/useChequeCollectionMutations'
import {
  useChequeCollectionFilters,
  useChequeCollections,
} from '@/lib/queries/useChequeCollections'
import { Plus } from 'lucide-react'
import { getChequeCollectionColumns } from './columns'

export default function ChequeCollectionsPage() {
  const { role } = useCurrentUser()
  const { page, limit, search, ordering, filter } = useSearchParameters()
  const { data, isLoading } = useChequeCollections({
    page,
    limit,
    search,
    ordering,
    filter,
  })

  const { filters, orderingOptions } = useChequeCollectionFilters()
  const { deleteChequeCollection } = useChequeCollectionMutations()

  const {
    entityState: viewSheet,
    openEntity: openView,
    closeEntity: closeView,
  } = useEntitySheet<ChequeCollection>()
  const {
    entityState: createSheet,
    openEntity: openCreate,
    closeEntity: closeCreate,
  } = useEntitySheet<ChequeCollection>()
  const {
    entityState: editSheet,
    openEntity: openEdit,
    closeEntity: closeEdit,
  } = useEntitySheet<ChequeCollection>()

  const columns = getChequeCollectionColumns({
    onView: openView,
    onEdit: openEdit,
    onDelete: (record) => {
      if (record?.id) deleteChequeCollection.mutate(record.id)
    },
    role: role ?? 'guest',
  })

  return (
    <>
      {/* Create */}
      <EntitySheet
        open={createSheet.open}
        onClose={closeCreate}
        title="New Cheque Collection"
        description="Record a new cheque collection."
        withCloseConfirmation
        renderForm={({ forceClose }) => (
          <ChequeCollectionForm onClose={forceClose} />
        )}
      />

      {/* Edit */}
      <EntitySheet
        open={editSheet.open}
        onClose={closeEdit}
        entity={editSheet.entity}
        title="Edit Cheque Collection"
        description="Update cheque collection details."
        withCloseConfirmation
        renderForm={({ forceClose, entity }) =>
          entity ? (
            <ChequeCollectionForm
              initialData={entity}
              onClose={forceClose}
            />
          ) : null
        }
      />

      {/* View */}
      <EntitySheet
        open={viewSheet.open}
        onClose={closeView}
        entity={viewSheet.entity}
        title="View Cheque Collection"
        description="Read-only details"
        renderForm={({ entity, onClose }) =>
          entity ? (
            <ChequeCollectionDetails
              entity={entity}
              onClose={onClose}
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
            New Cheque Collection
          </Button>
        }
        defaultRangePreset="Last 30 Days"
        filters={filters}
        orderingOptions={orderingOptions}
      />
    </>
  )
}
