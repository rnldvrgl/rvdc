'use client'

import { getClientColumns } from '@/app/(routes)/clients/columns'
import Loader from '@/app/loading'
import { DataTable } from '@/components/custom/table/DataTable'
import ClientSheet from '@/components/sheets/ClientSheet'
import { TClient } from '@/lib/constants/types'
import { useEditableSheet } from '@/lib/hooks/useEditableSheet'
import useSearchParameters from '@/lib/hooks/useSearchParameters'
import { useClients } from '@/lib/queries/useClients'

const ClientsPage = () => {
  const {
    selectedItem: selectedClient,
    isOpen: editClientOpen,
    setIsOpen: setEditClientOpen,
    handleEdit,
  } = useEditableSheet<TClient>()

  const columns = getClientColumns(handleEdit)
  const { page, limit, search, ordering } = useSearchParameters()
  const { data, isLoading } = useClients({ page, limit, search, ordering })

  if (isLoading) return <Loader />

  return (
    <div className="container mx-auto py-10">
      <ClientSheet
        client_data={selectedClient}
        open={editClientOpen}
        onOpenChange={setEditClientOpen}
      />
      <DataTable
        columns={columns}
        data={data?.results || []}
        pageCount={data?.count || 1}
        totalCount={data?.count || 0}
      />
    </div>
  )
}

export default ClientsPage
