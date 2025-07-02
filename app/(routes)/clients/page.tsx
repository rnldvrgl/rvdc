'use client'

import { getClientColumns } from '@/app/(routes)/clients/columns'
import { DataTable } from '@/components/custom/table/DataTable'
import ClientForm from '@/components/forms/ClientForm'
import EntitySheet from '@/components/sheets/EntitySheet'
import { Button } from '@/components/ui/button'
import { TClient } from '@/lib/constants/types'
import { useEntitySheet } from '@/lib/hooks/useEntitySheet'
import useSearchParameters from '@/lib/hooks/useSearchParameters'
import { useClientMutations } from '@/lib/mutations/useClientMutations'
import { useClients } from '@/lib/queries/useClients'
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
    sheetState: { open: editOpen, entity },
    openSheet: openEditSheet,
    closeSheet: closeEditSheet,
  } = useEntitySheet<TClient>()

  const {
    sheetState: { open: addOpen },
    openSheet: openAddSheet,
    closeSheet: closeAddSheet,
  } = useEntitySheet<TClient>()

  const handleDelete = (client: TClient) => {
    if (client.id !== undefined) {
      deleteClient.mutate(client.id)
    }
  }

  const columns = getClientColumns({
    onEdit: openEditSheet,
    onDelete: handleDelete,
  })

  return (
    <div className="container mx-auto space-y-4">
      {/* Edit Client Sheet */}
      <EntitySheet<TClient>
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
      <EntitySheet<TClient>
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
