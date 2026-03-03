"use client"

import EntitySheet from "@/components/custom/shared/EntitySheet"
import PageHeader from "@/components/custom/shared/PageHeader"
import { Wrapper } from "@/components/custom/shared/Wrapper"
import { DataTable } from "@/components/custom/table/DataTable"
import { RemittanceDetails } from "@/components/details/RemittanceDetails"
import RemittanceForm from "@/components/forms/RemittanceForm"
import { Button } from "@/components/ui/button"
import { RemittanceRecord } from "@/lib/constants/interface"
import { useCurrentUser } from "@/lib/hooks/useCurrentUser"
import { useEntitySheet } from "@/lib/hooks/useEntitySheet"
import useSearchParameters from "@/lib/hooks/useSearchParameters"
import { useRemittanceMutations } from "@/lib/mutations/useRemittanceMutations"
import {
  useRemittancesRecordFilters,
  useRemittancesRecords,
} from "@/lib/queries/useRemittancesRecords"
import { DollarSign, Plus } from "lucide-react"
import { getRemittanceColumns } from "./columns"

export default function RemittancesPage() {
  const { role, isAdmin } = useCurrentUser()
  const { page, limit, search, ordering, filter } = useSearchParameters({
    defaultRangePreset: "Last 30 Days",
  })
  const { data, isLoading, refetch } = useRemittancesRecords({
    page,
    limit,
    search,
    ordering,
    filter,
  })
  const { filters, orderingOptions } = useRemittancesRecordFilters()
  const { deleteRemittance, markRemitted } = useRemittanceMutations()

  const {
    entityState: viewSheet,
    openEntity: openView,
    closeEntity: closeView,
  } = useEntitySheet<RemittanceRecord>()
  const {
    entityState: createSheet,
    openEntity: openCreate,
    closeEntity: closeCreate,
  } = useEntitySheet<RemittanceRecord>()
  const {
    entityState: editSheet,
    openEntity: openEdit,
    closeEntity: closeEdit,
  } = useEntitySheet<RemittanceRecord>()

  const columns = getRemittanceColumns({
    onView: openView,
    onEdit: openEdit,
    onDelete: (tx) => {
      if (tx?.id) deleteRemittance.mutate(tx.id)
    },
    role: role ?? "guest",
  })

  return (
    <Wrapper>
      <PageHeader
        icon={DollarSign}
        title="Remittance Management"
        description="Track and manage daily cash remittances from all stall locations with comprehensive financial oversight."
        breadcrumbs={["Dashboard", "Receivables", "Remittances"]}
        isAdminOnly={!isAdmin}
        actionButton={
          isAdmin && (
            <Button onClick={() => openCreate()}>
              <Plus className="size-4 mr-2" />
              New Remittance
            </Button>
          )
        }
      />

      {/* Create Remittance Sheet */}
      <EntitySheet
        open={createSheet.open}
        onClose={closeCreate}
        title="New Remittance"
        description="Record a new cash remittance from a stall location."
        withCloseConfirmation
        renderForm={({ forceClose }) => <RemittanceForm onClose={forceClose} />}
      />

      {/* Edit Remittance Sheet */}
      <EntitySheet
        open={editSheet.open}
        onClose={closeEdit}
        entity={editSheet.entity}
        title="Edit Remittance"
        description="Update remittance details and information."
        withCloseConfirmation
        renderForm={({ forceClose, entity }) =>
          entity ? (
            <RemittanceForm
              initialData={{
                ...entity,
                stall: entity.stall,
              }}
              onClose={forceClose}
            />
          ) : null
        }
      />

      {/* View Remittance Sheet */}
      <EntitySheet
        open={viewSheet.open}
        onClose={closeView}
        entity={viewSheet.entity}
        title="Remittance Details"
        description="View comprehensive remittance information and status."
        renderForm={({ entity, onClose }) =>
          entity ? (
            <RemittanceDetails
              entity={entity}
              onClose={onClose}
              onMarkAsRemitted={() => {
                if (entity.id) markRemitted.mutate(entity.id)
                onClose()
              }}
              markAsRemittedPending={markRemitted.isPending}
            />
          ) : null
        }
      />

      {/* Main Content */}
      <DataTable
        title="Remittances"
        description="Daily cash remittances and financial tracking"
        isLoading={isLoading}
        columns={columns}
        data={
          data ?? {
            count: 0,
            next: null,
            previous: null,
            results: [],
          }
        }
        defaultRangePreset="Last 30 Days"
        filters={filters}
        orderingOptions={orderingOptions}
        onRefresh={refetch}
        emptyIcon={DollarSign}
        emptyTitle="No remittances found"
        emptyDescription="Submit your first daily remittance to start tracking"
      />
    </Wrapper>
  )
}
