"use client"

import { getClientColumns } from "@/app/(routes)/clients/columns"
import EntitySheet from "@/components/custom/shared/EntitySheet"
import PageHeader from "@/components/custom/shared/PageHeader"
import { Wrapper } from "@/components/custom/shared/Wrapper"
import { DataTable } from "@/components/custom/table/DataTable"
import ClientForm from "@/components/forms/ClientForm"
import { Button } from "@/components/ui/button"

import { Client } from "@/lib/constants/types"
import { useEntitySheet } from "@/lib/hooks/useEntitySheet"
import useSearchParameters from "@/lib/hooks/useSearchParameters"
import { useClientMutations } from "@/lib/mutations/useClientMutations"
import { useClientFilters, useClients } from "@/lib/queries/clients/useClients"
import { Plus, Users } from "lucide-react"

export default function ClientsPage() {
  const { page, limit, search, ordering, filter } = useSearchParameters()
  const { deleteClient, updateClient } = useClientMutations()
  const { data, isLoading, refetch } = useClients({
    page,
    limit,
    search,
    ordering,
    filter,
  })
  const { filters, orderingOptions } = useClientFilters()

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

  const columns = getClientColumns({
    onEdit: openEditSheet,
    onDelete: handleDelete,
    onCustomAction: handleToggleBlocklisted,
  })

  return (
    <Wrapper>
      <PageHeader
        icon={Users}
        title="Client Management"
        description="Manage customer information, contact details, and account status for all your clients."
        breadcrumbs={["Dashboard", "Clients"]}
        onRefresh={refetch}
        actionButton={
          <Button onClick={() => openAddSheet()}>
            <Plus className="size-4 mr-2" />
            Add Client
          </Button>
        }
      />

      {/* Edit Client Sheet */}
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

      {/* Add Client Sheet */}
      <EntitySheet<Client>
        open={addOpen}
        onClose={closeAddSheet}
        title="Add Client"
        description="Fill out the form below to add a new client."
        withCloseConfirmation
        renderForm={({ forceClose }) => <ClientForm onClose={forceClose} />}
      />

      {/* Main Content */}
      <DataTable
        title="Clients"
        description="Manage your client database"
        isLoading={isLoading}
        columns={columns}
        data={
          data || {
            count: 0,
            next: null,
            previous: null,
            results: [],
          }
        }
        filters={filters}
        orderingOptions={orderingOptions}
        emptyIcon={Users}
        emptyTitle="No clients found"
        emptyDescription="Add your first client to build your customer database"
      />
    </Wrapper>
  )
}
