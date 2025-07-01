'use client'

import { columns } from '@/app/(routes)/clients/columns'
import Loader from '@/app/loading'
import { DataTable } from '@/components/custom/table/DataTable'
import useSearchParameters from '@/lib/hooks/useSearchParameters'
import { useClients } from '@/lib/queries/useClients'

const ClientsPage = () => {
  const { page, limit, search, ordering } = useSearchParameters()
  const { data, isLoading } = useClients({ page, limit, search, ordering })

  if (isLoading) return <Loader />

  return (
    <div className="container mx-auto py-10">
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
