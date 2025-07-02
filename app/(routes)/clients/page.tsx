'use client'

import { getClientColumns } from '@/app/(routes)/clients/columns'
import Loader from '@/app/loading'
import { DataTable } from '@/components/custom/table/DataTable'
import ClientForm from '@/components/forms/ClientForm'
import EntitySheet from '@/components/sheets/EntitySheet'
import { TClient } from '@/lib/constants/types'
import { useEntitySheet } from '@/lib/hooks/useEntitySheet'
import useSearchParameters from '@/lib/hooks/useSearchParameters'
import { useClients } from '@/lib/queries/useClients'

export default function ClientsPage() {
  const { page, limit, search, ordering } = useSearchParameters()
  const { data, isLoading } = useClients({ page, limit, search, ordering })

  const {
    sheetState: { open, entity },
    openSheet,
    closeSheet,
  } = useEntitySheet<TClient>()

  const columns = getClientColumns(openSheet)

  if (isLoading) return <Loader />

  return (
    <div className="container mx-auto">
      <EntitySheet
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
        columns={columns}
        data={data?.results ?? []}
        pageCount={data?.count ?? 1}
        totalCount={data?.count ?? 0}
      />
    </div>
  )
}
