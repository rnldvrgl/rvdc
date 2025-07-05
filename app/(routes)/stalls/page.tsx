'use client'

import { getStallColumns } from '@/app/(routes)/stalls/columns'
import { DataTable } from '@/components/custom/table/DataTable'
import StallForm from '@/components/forms/inventory/StallForm'
import EntitySheet from '@/components/sheets/EntitySheet'
import { Button } from '@/components/ui/button'
import { Stall } from '@/lib/constants/interface'
import { useEntitySheet } from '@/lib/hooks/useEntitySheet'
import { useStallMutations } from '@/lib/mutations/useStallMutations'
import { useStalls } from '@/lib/queries/inventory/useStalls'
import { Plus } from 'lucide-react'

export default function StallsPage() {
  const { data, isLoading } = useStalls()
  const { deleteStall } = useStallMutations()

  const {
    sheetState: { open: editOpen, entity },
    openSheet: openEditSheet,
    closeSheet: closeEditSheet,
  } = useEntitySheet<Stall>()

  const {
    sheetState: { open: addOpen },
    openSheet: openAddSheet,
    closeSheet: closeAddSheet,
  } = useEntitySheet<Stall>()

  const handleDelete = (stall: Stall) => {
    if (stall.id !== undefined) {
      deleteStall.mutate(stall.id)
    }
  }

  const columns = getStallColumns({
    onEdit: openEditSheet,
    onDelete: handleDelete,
  })

  return (
    <div className="container mx-auto">
      <EntitySheet<Stall>
        open={editOpen}
        onOpenChange={(isOpen) => !isOpen && closeEditSheet()}
        entity={entity}
        title="Edit Stall"
        description="Update the stall details below."
        renderForm={({ onClose, entity }) => (
          <StallForm
            onClose={onClose}
            stall={entity}
          />
        )}
      />

      <EntitySheet<Stall>
        open={addOpen}
        onOpenChange={(isOpen) => !isOpen && closeAddSheet()}
        title="Add Stall"
        description="Fill out the form below to add a new stall."
        renderForm={({ onClose }) => <StallForm onClose={onClose} />}
      />

      <DataTable
        isLoading={isLoading}
        columns={columns}
        data={data?.results ?? []}
        headerActions={
          <Button onClick={() => openAddSheet()}>
            <Plus className="size-4 mr-1" />
            Add Stall
          </Button>
        }
      />
    </div>
  )
}
