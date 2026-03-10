"use client"

import { getAirconUnitsColumns } from "@/app/(routes)/aircons/units/columns"
import { AirconUnitDetails } from "@/components/aircons/AirconUnitDetails"
import { ArchiveToggle } from "@/components/custom/shared/ArchiveToggle"
import EntitySheet from "@/components/custom/shared/EntitySheet"
import PageHeader from "@/components/custom/shared/PageHeader"
import { Wrapper } from "@/components/custom/shared/Wrapper"
import { DataTable } from "@/components/custom/table/DataTable"
import AirconUnitForm from "@/components/forms/installations/AirconUnitForm"
import ScheduleInstallationForm from "@/components/forms/installations/ScheduleInstallationForm"
import { Button } from "@/components/ui/button"
import { AirconUnits } from "@/lib/constants/interface"
import { useArchive } from "@/lib/hooks/useArchive"
import { useCurrentUser } from "@/lib/hooks/useCurrentUser"
import { useEntitySheet } from "@/lib/hooks/useEntitySheet"
import useSearchParameters from "@/lib/hooks/useSearchParameters"
import { useAirconUnitMutations } from "@/lib/mutations/installations/useAirconUnitMutations"
import { useAirconUnitFilters, useAirconUnits } from "@/lib/queries/useAircons"
import { Plus, Snowflake } from "lucide-react"
import { useState } from "react"

const emptyData = {
  count: 0,
  next: null,
  previous: null,
  results: [] as AirconUnits[],
}

export default function AirconUnitsPage() {
  const { isAdmin } = useCurrentUser()
  const searchParams = useSearchParameters()
  const { page, limit, search, ordering, filter } = searchParams
  const { filters, orderingOptions } = useAirconUnitFilters()
  const { deleteUnit } = useAirconUnitMutations()
  const { data, isLoading, refetch } = useAirconUnits({
    page,
    limit,
    search,
    ordering,
    filter,
  })

  const [isArchived, setIsArchived] = useState(false)
  const { archivedQuery, restoreItem, hardDeleteItem } =
    useArchive<AirconUnits>(
      "installations/aircon-units/",
      "aircon-units",
      searchParams,
      isArchived,
    )

  // Edit sheet
  const {
    entityState: { open: editOpen, entity },
    openEntity: openEditSheet,
    closeEntity: closeEditSheet,
  } = useEntitySheet<AirconUnits>()

  // Add sheet
  const {
    entityState: { open: addOpen },
    openEntity: openAddSheet,
    closeEntity: closeAddSheet,
  } = useEntitySheet<AirconUnits>()

  // View sheet
  const {
    entityState: { open: viewOpen, entity: viewEntity },
    openEntity: openViewSheet,
    closeEntity: closeViewSheet,
  } = useEntitySheet<AirconUnits>()

  // Install sheet
  const {
    entityState: { open: installOpen, entity: installEntity },
    openEntity: openInstallSheet,
    closeEntity: closeInstallSheet,
  } = useEntitySheet<AirconUnits>()

  const handleDelete = (unit: AirconUnits) => {
    if (unit.id !== undefined) {
      deleteUnit.mutate(unit.id)
    }
  }

  const handleRestore = (unit: AirconUnits) => {
    if (unit.id !== undefined) {
      restoreItem.mutate(unit.id)
    }
  }

  const handleHardDelete = (unit: AirconUnits) => {
    if (unit.id !== undefined) {
      hardDeleteItem.mutate(unit.id)
    }
  }

  const handleView = (unit: AirconUnits) => {
    openViewSheet(unit)
  }

  const handleInstall = (unit: AirconUnits) => {
    openInstallSheet(unit)
  }

  const columns = isArchived
    ? getAirconUnitsColumns({
        onEdit: () => {},
        onDelete: () => {},
        onRestore: handleRestore,
        onHardDelete: handleHardDelete,
      })
    : getAirconUnitsColumns({
        onEdit: openEditSheet,
        onDelete: handleDelete,
        onView: handleView,
        onInstall: handleInstall,
      })

  const tableData = isArchived
    ? archivedQuery.data || emptyData
    : data || emptyData

  return (
    <Wrapper>
      <PageHeader
        icon={Snowflake}
        title="Aircon Units Inventory"
        description="Manage your aircon unit inventory. Add, edit, and track individual units available for installation and sale."
        breadcrumbs={["Dashboard", "Aircons", "Units"]}
        actionButton={
          <Button onClick={() => openAddSheet()}>
            <Plus className="size-4 mr-2" />
            Add Unit
          </Button>
        }
      />

      {/* View Unit Sheet */}
      <EntitySheet<AirconUnits>
        className="sm:min-w-2xl md:minx-w-3xl xl:min-w-4xl"
        open={viewOpen}
        onClose={closeViewSheet}
        entity={viewEntity}
        title="Unit Details"
        description="View detailed information about this aircon unit."
        renderForm={({ onClose, entity }) =>
          entity ? (
            <AirconUnitDetails
              unit={entity}
              onClose={onClose}
              onEdit={openEditSheet}
              showEditButton={isAdmin}
            />
          ) : null
        }
      />

      {/* Edit Aircon Unit Sheet */}
      <EntitySheet<AirconUnits>
        open={editOpen}
        onClose={closeEditSheet}
        entity={entity}
        title="Edit Aircon Unit"
        description="Update the aircon unit details below."
        withCloseConfirmation
        renderForm={({ forceClose, entity }) => (
          <AirconUnitForm
            onClose={forceClose}
            initialData={entity}
          />
        )}
      />

      {/* Add Aircon Unit Sheet */}
      <EntitySheet<AirconUnits>
        open={addOpen}
        onClose={closeAddSheet}
        title="Add Aircon Unit"
        description="Fill out the form below to add a new aircon unit."
        withCloseConfirmation
        renderForm={({ forceClose }) => <AirconUnitForm onClose={forceClose} />}
      />

      {/* Schedule Installation Sheet */}
      <EntitySheet<AirconUnits>
        open={installOpen}
        onClose={closeInstallSheet}
        entity={installEntity}
        title="Schedule Installation"
        description="Create an installation service for this unit."
        withCloseConfirmation
        renderForm={({ forceClose, entity }) =>
          entity ? (
            <ScheduleInstallationForm
              unitId={entity.id}
              unitSerialNumber={entity.serial_number}
              isUnitSold={entity.is_sold || false}
              onClose={forceClose}
            />
          ) : null
        }
      />

      {/* Main Content */}
      <ArchiveToggle
        isArchived={isArchived}
        onToggle={setIsArchived}
        archivedCount={archivedQuery.data?.count}
      />

      <DataTable
        title="Aircon Units Inventory"
        description="Track and manage all aircon units in stock"
        isLoading={isArchived ? archivedQuery.isLoading : isLoading}
        columns={columns}
        data={tableData}
        filters={filters}
        orderingOptions={orderingOptions}
        onRefresh={isArchived ? archivedQuery.refetch : refetch}
        emptyIcon={Snowflake}
        emptyTitle={isArchived ? "No archived units" : "No aircon units found"}
        emptyDescription={
          isArchived
            ? "Archived units will appear here"
            : "Add units to start tracking your inventory"
        }
      />
    </Wrapper>
  )
}
