"use client"

import { getAirconUnitsColumns } from "@/app/(routes)/aircons/units/columns"
import EntitySheet from "@/components/custom/shared/EntitySheet"
import PageHeader from "@/components/custom/shared/PageHeader"
import { Wrapper } from "@/components/custom/shared/Wrapper"
import { DataTable } from "@/components/custom/table/DataTable"
import AirconUnitForm from "@/components/forms/installations/AirconUnitForm"
import { Button } from "@/components/ui/button"
import { AirconUnits } from "@/lib/constants/interface"
import { useCurrentUser } from "@/lib/hooks/useCurrentUser"
import { useEntitySheet } from "@/lib/hooks/useEntitySheet"
import useSearchParameters from "@/lib/hooks/useSearchParameters"
import { useAirconUnitMutations } from "@/lib/mutations/installations/useAirconUnitMutations"
import { useAirconUnitFilters, useAirconUnits } from "@/lib/queries/useAircons"
import { Eye, Plus, Snowflake } from "lucide-react"

export default function AirconUnitsPage() {
  const { isAdmin } = useCurrentUser()
  const { page, limit, search, ordering, filter } = useSearchParameters()
  const { filters, orderingOptions } = useAirconUnitFilters()
  const { deleteUnit } = useAirconUnitMutations()
  const { data, isLoading, refetch } = useAirconUnits({
    page,
    limit,
    search,
    ordering,
    filter,
  })

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

  const handleDelete = (unit: AirconUnits) => {
    if (unit.id !== undefined) {
      deleteUnit.mutate(unit.id)
    }
  }

  const handleView = (unit: AirconUnits) => {
    openViewSheet(unit)
  }

  const columns = getAirconUnitsColumns({
    onEdit: openEditSheet,
    onDelete: handleDelete,
    onView: handleView,
  })

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
            <div className="space-y-6 p-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-muted-foreground">
                    Indoor Serial Number
                  </label>
                  <p className="text-base font-medium font-mono bg-muted px-2 py-1 rounded">
                    {entity.serial_number || "N/A"}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">
                    Outdoor Serial Number
                  </label>
                  <p className="text-base font-medium font-mono bg-muted px-2 py-1 rounded">
                    {entity.outdoor_serial_number || "N/A"}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">
                    Model
                  </label>
                  <p className="text-base font-medium">
                    {entity.model?.name || "N/A"}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">
                    Brand
                  </label>
                  <p className="text-base font-medium">
                    {entity.model?.brand?.name || "N/A"}
                  </p>
                </div>
                <div className="sm:col-span-2">
                  <label className="text-sm font-medium text-muted-foreground">
                    Created Date
                  </label>
                  <p className="text-base font-medium">
                    {entity.created_at
                      ? new Date(entity.created_at).toLocaleDateString()
                      : "N/A"}
                  </p>
                </div>
              </div>
              <div className="flex justify-end gap-2 pt-4 border-t">
                <Button
                  variant="outline"
                  onClick={onClose}
                >
                  Close
                </Button>
                {isAdmin && (
                  <Button
                    onClick={() => {
                      onClose()
                      openEditSheet(entity)
                    }}
                  >
                    <Eye className="size-4 mr-2" />
                    Edit Unit
                  </Button>
                )}
              </div>
            </div>
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

      {/* Main Content */}
      <DataTable
        title="Aircon Units Inventory"
        description="Track and manage all aircon units in stock"
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
        onRefresh={refetch}
      />
    </Wrapper>
  )
}
