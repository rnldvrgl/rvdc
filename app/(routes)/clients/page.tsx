'use client'

import { getClientColumns } from '@/app/(routes)/clients/columns'
import { DataTable } from '@/components/custom/table/DataTable'
import ClientForm from '@/components/forms/ClientForm'
import EntitySheet from '@/components/sheets/EntitySheet'
import { TClient } from '@/lib/constants/types'
import { useEntitySheet } from '@/lib/hooks/useEntitySheet'
import useSearchParameters from '@/lib/hooks/useSearchParameters'
import { useClientMutations } from '@/lib/mutations/useClientMutations'
import { useClients } from '@/lib/queries/useClients'

export default function ClientsPage() {
  const { page, limit, search, ordering } = useSearchParameters()
  const { deleteClient } = useClientMutations()
  const { data, isLoading } = useClients({
    page,
    limit,
    search,
    ordering,
  })

  const {
    sheetState: { open, entity },
    openSheet,
    closeSheet,
  } = useEntitySheet<TClient>()

  const handleDelete = (client: TClient) => {
    if (client.id !== undefined) {
      deleteClient.mutate(client.id)
    }
  }

  const columns = getClientColumns({
    onEdit: openSheet,
    onDelete: handleDelete,
  })

  return (
    <div className="container mx-auto">
      <EntitySheet<TClient>
        open={open}
        onOpenChange={(isOpen) => !isOpen && closeSheet()}
        entity={entity}
        title={entity ? 'Edit Client' : 'Add Client'}
        description={
          entity
            ? 'Update the client details below.'
            : 'Fill out the form below to add a new client.'
        }
        renderForm={({ onClose, entity }) => (
          <ClientForm
            onClose={onClose}
            client={entity}
          />
        )}
      />
      <DataTable
        isLoading={isLoading}
        columns={columns}
        data={data?.results ?? []}
      />
    </div>
  )
}
