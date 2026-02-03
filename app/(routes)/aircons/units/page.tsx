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
import {
  Calendar,
  Eye,
  Plus,
  ShoppingCart,
  Snowflake,
  Sparkles,
  Wrench,
} from "lucide-react"

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
        title="Aircon Units"
        description="Manage individual air conditioning units, track installation status, and handle sales, reservations, and maintenance operations."
        breadcrumbs={["Dashboard", "Aircons", "Units"]}
        isAdminOnly={!isAdmin}
        actionButton={
          isAdmin && (
            <Button onClick={() => openAddSheet()}>
              <Plus className="size-4 mr-2" />
              Add Unit
            </Button>
          )
        }
      />

      {/* View Unit Sheet */}
      <EntitySheet<AirconUnits>
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
                    Serial Number
                  </label>
                  <p className="text-base font-medium font-mono bg-muted px-2 py-1 rounded">
                    {entity.serial_number || "N/A"}
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
                <div>
                  <label className="text-sm font-medium text-muted-foreground">
                    Client
                  </label>
                  <p className="text-base font-medium">
                    {entity.reserved_at && entity.reserved_by
                      ? `${entity.reserved_by?.full_name}`
                      : "No client assigned"}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">
                    Installation Status
                  </label>
                  <p className="text-base font-medium">
                    {entity.installation ? (
                      <span className="inline-flex items-center gap-1.5 px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400">
                        <Wrench className="size-3" />
                        Installed
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400">
                        <Calendar className="size-3" />
                        Pending Installation
                      </span>
                    )}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">
                    Sale Status
                  </label>
                  <p className="text-base font-medium">
                    {entity.sale ? (
                      <span className="inline-flex items-center gap-1.5 px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400">
                        <ShoppingCart className="size-3" />
                        Sold
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-700 dark:bg-gray-900/30 dark:text-gray-400">
                        <Calendar className="size-3" />
                        Available
                      </span>
                    )}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">
                    Cleaning Status
                  </label>
                  <p className="text-base font-medium">
                    {entity.free_cleaning_redeemed ? (
                      <span className="inline-flex items-center gap-1.5 px-2 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400">
                        <Sparkles className="size-3" />
                        Cleaning Redeemed
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-700 dark:bg-gray-900/30 dark:text-gray-400">
                        <Sparkles className="size-3" />
                        Cleaning Available
                      </span>
                    )}
                  </p>
                </div>
                <div className="sm:col-span-2">
                  <label className="text-sm font-medium text-muted-foreground">
                    Installation Date
                  </label>
                  <p className="text-base font-medium">
                    {entity.installation
                      ? new Date(entity.installation).toLocaleDateString()
                      : "Not installed yet"}
                  </p>
                </div>
                {/*<div className="sm:col-span-2">
									<label className="text-sm font-medium text-muted-foreground">
										Notes
									</label>
									<p className="text-base text-muted-foreground">
										{entity.notes || "No notes available"}
									</p>
								</div>*/}
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
        title="Aircon Units"
        description="Individual unit tracking and management"
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
