'use client'

import { getTechnicianColumns } from '@/app/(routes)/technicians/columns'
import EntitySheet from '@/components/custom/shared/EntitySheet'
import { DataTable } from '@/components/custom/table/DataTable'
import TechnicianForm from '@/components/forms/TechnicianForm'
import { Button } from '@/components/ui/button'
import { Technician } from '@/lib/constants/types'
import { useEntitySheet } from '@/lib/hooks/useEntitySheet'
import useSearchParameters from '@/lib/hooks/useSearchParameters'
import { useTechnicianMutations } from '@/lib/mutations/useTechnicianMutations'
import { useTechnicians } from '@/lib/queries/useTechnicians'
import { Plus } from 'lucide-react'

export default function TechniciansPage() {
  const { page, limit, search, ordering, filter } = useSearchParameters()
  const { deleteTechnician } = useTechnicianMutations()
  const { data, isLoading } = useTechnicians({
    page,
    limit,
    search,
    ordering,
    filter,
  })

  // Separate sheets
  const {
    entityState: { open: editOpen, entity },
    openEntity: openEditSheet,
    closeEntity: closeEditSheet,
  } = useEntitySheet<Technician>()

  const {
    entityState: { open: addOpen },
    openEntity: openAddSheet,
    closeEntity: closeAddSheet,
  } = useEntitySheet<Technician>()

  const handleDelete = (Technician: Technician) => {
    if (Technician.id !== undefined) {
      deleteTechnician.mutate(Technician.id)
    }
  }

  const columns = getTechnicianColumns({
    onEdit: openEditSheet,
    onDelete: handleDelete,
    onView: () => {
      console.log('view technician')
    },
  })

  return (
    <div className="container mx-auto">
      {/* Edit Technician Sheet */}
      <EntitySheet<Technician>
        open={editOpen}
        onClose={closeEditSheet}
        entity={entity}
        title="Edit Technician"
        description="Update the Technician details below."
        withCloseConfirmation
        renderForm={({ forceClose, entity }) => (
          <TechnicianForm
            onClose={forceClose}
            technician={entity}
          />
        )}
      />

      {/* Add Technician Sheet */}
      <EntitySheet<Technician>
        open={addOpen}
        onClose={closeAddSheet}
        title="Add Technician"
        description="Fill out the form below to add a new Technician."
        withCloseConfirmation
        renderForm={({ forceClose }) => <TechnicianForm onClose={forceClose} />}
      />

      <DataTable
        isLoading={isLoading}
        columns={columns}
        data={data || { count: 0, next: null, previous: null, results: [] }}
        headerActions={
          <Button onClick={() => openAddSheet()}>
            <Plus className="size-4 mr-1" />
            Add Technician
          </Button>
        }
      />
    </div>
  )
}
