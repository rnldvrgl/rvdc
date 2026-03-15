"use client"

import { getClientColumns } from "@/app/(routes)/clients/columns"
import { ArchiveToggle } from "@/components/custom/shared/ArchiveToggle"
import EntitySheet from "@/components/custom/shared/EntitySheet"
import PageHeader from "@/components/custom/shared/PageHeader"
import { Wrapper } from "@/components/custom/shared/Wrapper"
import { DataTable } from "@/components/custom/table/DataTable"
import ClientForm from "@/components/forms/ClientForm"
import { Button } from "@/components/ui/button"

import { Client } from "@/lib/constants/types"
import { useArchive } from "@/lib/hooks/useArchive"
import { useEntitySheet } from "@/lib/hooks/useEntitySheet"
import useSearchParameters from "@/lib/hooks/useSearchParameters"
import { useClientMutations } from "@/lib/mutations/useClientMutations"
import { useClientFilters, useClients } from "@/lib/queries/clients/useClients"
import { Plus, Users } from "lucide-react"
import { useRouter } from "next/navigation"
import { useState } from "react"

const emptyData = {
  count: 0,
  next: null,
  previous: null,
  results: [] as Client[],
}

export default function ClientsPage() {
  const router = useRouter()
  const searchParams = useSearchParameters()
  const { page, limit, search, ordering, filter } = searchParams
  const [isArchived, setIsArchived] = useState(false)

  const { deleteClient, updateClient } = useClientMutations()
  const { data, isLoading, refetch } = useClients({
    page,
    limit,
    search,
    ordering,
    filter,
  })
  const { filters, orderingOptions } = useClientFilters()

  const { archivedQuery, restoreItem, hardDeleteItem } = useArchive<Client>(
    "/clients/",
    "clients",
    searchParams,
    isArchived,
  )

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

  const handleToggleBlocklisted = (client: Client) => {
    if (client.id !== undefined) {
      updateClient.mutate({
        id: client.id,
        data: {
          ...client,
          is_blocklisted: !client.is_blocklisted,
        },
      })
    }
  }

  const handleRestore = (client: Client) => {
    if (client.id !== undefined) restoreItem.mutate(client.id)
  }

  const handleHardDelete = (client: Client) => {
    if (client.id !== undefined) hardDeleteItem.mutate(client.id)
  }

  const columns = isArchived
    ? getClientColumns({
        onEdit: () => {},
        onDelete: () => {},
        onRestore: handleRestore,
      })
    : getClientColumns({
        onEdit: openEditSheet,
        onDelete: handleDelete,
        onCustomAction: handleToggleBlocklisted,
        onView: (client) => router.push(`/clients/${client.id}`),
      })

  const tableData = isArchived
    ? archivedQuery.data || emptyData
    : data || emptyData

  return (
    <Wrapper>
      <PageHeader
        icon={Users}
        title="Client Management"
        description="Manage customer information, contact details, and account status for all your clients."
        breadcrumbs={["Dashboard", "Clients"]}
        onRefresh={isArchived ? archivedQuery.refetch : refetch}
        actionButton={
          !isArchived ? (
            <Button onClick={() => openAddSheet()}>
              <Plus className="size-4 mr-2" />
              Add Client
            </Button>
          ) : undefined
        }
      />

      {/* Edit Client Sheet */}
      {!isArchived && (
        <EntitySheet<Client>
          open={editOpen}
          onClose={closeEditSheet}
          entity={entity}
          title="Edit Client"
          description="Update the client details below."
          withCloseConfirmation
          renderForm={({ forceClose, entity }) => (
            <ClientForm
              onClose={forceClose}
              client={entity}
            />
          )}
        />
      )}

      {/* Add Client Sheet */}
      {!isArchived && (
        <EntitySheet<Client>
          open={addOpen}
          onClose={closeAddSheet}
          title="Add Client"
          description="Fill out the form below to add a new client."
          withCloseConfirmation
          renderForm={({ forceClose }) => <ClientForm onClose={forceClose} />}
        />
      )}

      <ArchiveToggle
        isArchived={isArchived}
        onToggle={setIsArchived}
        archivedCount={archivedQuery.data?.count}
      />

      {/* Main Content */}
      <DataTable
        enableVirtualization
        title={isArchived ? "Archived Clients" : "Clients"}
        description={
          isArchived
            ? "Restore or permanently delete archived clients"
            : "Manage your client database"
        }
        isLoading={isArchived ? archivedQuery.isLoading : isLoading}
        columns={columns}
        data={tableData}
        filters={filters}
        orderingOptions={orderingOptions}
        emptyIcon={Users}
        emptyTitle={isArchived ? "No archived clients" : "No clients found"}
        emptyDescription={
          isArchived
            ? "Deleted clients will appear here"
            : "Add your first client to build your customer database"
        }
      />
    </Wrapper>
  )
}
