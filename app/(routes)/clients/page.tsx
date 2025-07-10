'use client'

import { getClientColumns } from '@/app/(routes)/clients/columns'
import EntitySheet from '@/components/custom/shared/EntitySheet'
import { DataTable } from '@/components/custom/table/DataTable'
import ClientForm from '@/components/forms/ClientForm'
import { Button } from '@/components/ui/button'
import { Client } from '@/lib/constants/types'
import { useEntitySheet } from '@/lib/hooks/useEntitySheet'
import useSearchParameters from '@/lib/hooks/useSearchParameters'
import { useClientMutations } from '@/lib/mutations/useClientMutations'
import { useClients } from '@/lib/queries/clients/useClients'
import { Plus } from 'lucide-react'

export default function ClientsPage() {
  const { page, limit, search, ordering } = useSearchParameters()
  const { deleteClient } = useClientMutations()
  const { data, isLoading } = useClients({
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
  } = useEntitySheet<Client>()

  const {
    entityState: { open: addOpen },
    openEntity: openAddSheet,
    closeEntity: closeAddSheet,
  } = useEntitySheet<Client>()

  const handleDelete = (client: Client) => {
    if (client.id !== undefined) {
      deleteClient.mutate(client.id)
    }
  }

  const columns = getClientColumns({
    onEdit: openEditSheet,
    onDelete: handleDelete,
  })

  return (
    <div className="container mx-auto">
      {/* Edit Client Sheet */}
      <EntitySheet<Client>
        open={editOpen}
        onOpenChange={(isOpen) => !isOpen && closeEditSheet()}
        entity={entity}
        title="Edit Client"
        description="Update the client details below."
        renderForm={({ onClose, entity }) => (
          <ClientForm
            onClose={onClose}
            client={entity}
          />
        )}
      />

      {/* Add Client Sheet */}
      <EntitySheet<Client>
        open={addOpen}
        onOpenChange={(isOpen) => !isOpen && closeAddSheet()}
        title="Add Client"
        description="Fill out the form below to add a new client."
        renderForm={({ onClose }) => <ClientForm onClose={onClose} />}
      />

      <DataTable
        isLoading={isLoading}
        columns={columns}
        data={data?.results ?? []}
        headerActions={
          <Button onClick={() => openAddSheet()}>
            <Plus className="size-4 mr-1" />
            Add Client
          </Button>
        }
      />
    </div>
  )
}
