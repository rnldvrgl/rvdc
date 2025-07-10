'use client'

import { getTechnicianColumns } from '@/app/(routes)/technicians/columns'
import EntitySheet from '@/components/custom/shared/EntitySheet'
import { DataTable } from '@/components/custom/table/DataTable'
import TechnicianForm from '@/components/forms/TechnicianForm'
import { Button } from '@/components/ui/button'
import { Technician } from '@/lib/constants/types'
import useSearchParameters from '@/lib/hooks/useSearchParameters'
import { useTechnicianMutations } from '@/lib/mutations/useTechnicianMutations'
import { useTechnicians } from '@/lib/queries/useTechnicians'
import { Plus } from 'lucide-react'

export default function TechniciansPage() {
  const { page, limit, search, ordering } = useSearchParameters()
  const { deleteTechnician } = useTechnicianMutations()
  const { data, isLoading } = useTechnicians({
    page,
    limit,
    search,
    ordering,
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
  })

  return (
    <div className="container mx-auto">
      {/* Edit Technician Sheet */}
      <EntitySheet<Technician>
        open={editOpen}
        onOpenChange={(isOpen) => !isOpen && closeEditSheet()}
        entity={entity}
        title="Edit Technician"
        description="Update the Technician details below."
        renderForm={({ onClose, entity }) => (
          <TechnicianForm
            onClose={onClose}
            technician={entity}
          />
        )}
      />

      {/* Add Technician Sheet */}
      <EntitySheet<Technician>
        open={addOpen}
        onOpenChange={(isOpen) => !isOpen && closeAddSheet()}
        title="Add Technician"
        description="Fill out the form below to add a new Technician."
        renderForm={({ onClose }) => <TechnicianForm onClose={onClose} />}
      />

      <DataTable
        isLoading={isLoading}
        columns={columns}
        data={data?.results ?? []}
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
