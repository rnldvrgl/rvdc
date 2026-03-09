"use client"

import { getServiceColumns } from "@/app/(routes)/services/columns"
import { useServicePageState } from "@/app/(routes)/services/useServicePageState"
import { ArchiveToggle } from "@/components/custom/shared/ArchiveToggle"
import { ConfirmDialog } from "@/components/custom/shared/ConfirmDialog"
import EntitySheet from "@/components/custom/shared/EntitySheet"
import PageHeader from "@/components/custom/shared/PageHeader"
import { Wrapper } from "@/components/custom/shared/Wrapper"
import { DataTable } from "@/components/custom/table/DataTable"
import ServiceForm from "@/components/forms/ServiceForm"
import ServiceFormWizard from "@/components/forms/ServiceFormWizard"
import ServiceDetail from "@/components/services/ServiceDetail"
import ServiceKanbanBoard from "@/components/services/ServiceKanbanBoard"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { Service } from "@/lib/constants/interface"
import { PaginatedResult } from "@/lib/constants/types"
import { useArchive } from "@/lib/hooks/useArchive"
import { useCurrentUser } from "@/lib/hooks/useCurrentUser"
import { useEntitySheet } from "@/lib/hooks/useEntitySheet"
import useSearchParameters from "@/lib/hooks/useSearchParameters"
import {
  useService,
  useServiceFilters,
  useServices,
} from "@/lib/queries/services/useServices"
import { Kanban, List, Plus, Wrench } from "lucide-react"
import { useState } from "react"

type ViewMode = "table" | "kanban"

export default function ServicesPage() {
  const { role } = useCurrentUser()
  const canAddService = role === "admin" || role === "manager"
  const [viewMode, setViewMode] = useState<ViewMode>("table")
  const [isArchived, setIsArchived] = useState(false)

  // Search params
  const searchParams = useSearchParameters()
  const { filter, ordering, search, page, limit } = searchParams

  // Data fetching
  const {
    data: services,
    isLoading,
    refetch,
  } = useServices({
    page: viewMode === "kanban" ? 1 : page,
    limit: viewMode === "kanban" ? 1000 : limit,
    search,
    filter,
    ordering,
  })

  const { filters: filterDefs, orderingOptions } = useServiceFilters()

  const { archivedQuery, restoreItem, hardDeleteItem } = useArchive<Service>(
    "services/services/",
    "services",
    searchParams,
    isArchived,
  )

  // All dialog/detail state extracted to hook
  const state = useServicePageState(refetch)

  // Entity sheet for create/edit
  const { entityState, openEntity, closeEntity } = useEntitySheet<Service>()

  const handleEdit = (service: Service) => {
    openEntity(service)
  }

  // Fetch fresh service data when viewing details
  const { data: detailService, refetch: refetchService } = useService(
    state.selectedService?.id,
  )

  const handleRestore = (service: Service) => {
    if (service?.id) restoreItem.mutate(service.id)
  }
  const handleHardDelete = (service: Service) => {
    if (service?.id) hardDeleteItem.mutate(service.id)
  }

  const columns = isArchived
    ? getServiceColumns({
        role,
        onEdit: () => {},
        onDelete: () => {},
        onRestore: handleRestore,
        onHardDelete: handleHardDelete,
      })
    : getServiceColumns({
        role,
        onView: state.handleView,
        onEdit: handleEdit,
        onDelete: state.handleDelete,
        onComplete: state.handleComplete,
        onStatusChange: state.handleStatusChange,
      })

  const emptyServices = {
    count: 0,
    next: null,
    previous: null,
    results: [],
  } as PaginatedResult<Service>

  const tableData = isArchived
    ? archivedQuery.data || emptyServices
    : (services ?? emptyServices)

  return (
    <Wrapper>
      <PageHeader
        icon={Wrench}
        title="Services"
        description="Manage repair, installation, and maintenance services"
        actionButton={
          canAddService &&
          !isArchived && (
            <div className="flex items-center gap-2">
              {/* View toggle */}
              <div className="flex items-center rounded-lg border bg-muted p-0.5">
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant={viewMode === "table" ? "default" : "ghost"}
                      aria-label="Table view"
                      onClick={() => setViewMode("table")}
                    >
                      <List className="h-4 w-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Table view</TooltipContent>
                </Tooltip>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant={viewMode === "kanban" ? "default" : "ghost"}
                      aria-label="Kanban board view"
                      onClick={() => setViewMode("kanban")}
                    >
                      <Kanban className="h-4 w-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Kanban board</TooltipContent>
                </Tooltip>
              </div>

              <Button
                onClick={() => openEntity()}
                size="sm"
              >
                <Plus className="mr-2 h-4 w-4" />
                New Service
              </Button>
            </div>
          )
        }
        onRefresh={isArchived ? archivedQuery.refetch : refetch}
      />

      <ArchiveToggle
        isArchived={isArchived}
        onToggle={setIsArchived}
        archivedCount={archivedQuery.data?.count}
      />

      {/* Conditional view rendering */}
      {isArchived ? (
        <DataTable<Service, unknown>
          columns={columns}
          data={tableData}
          isLoading={archivedQuery.isLoading}
          filters={filterDefs ?? []}
          orderingOptions={orderingOptions ?? []}
          emptyIcon={Wrench}
          emptyTitle="No archived services"
          emptyDescription="Deleted services will appear here"
        />
      ) : viewMode === "table" ? (
        <DataTable<Service, unknown>
          columns={columns}
          data={tableData}
          isLoading={isLoading}
          filters={filterDefs ?? []}
          orderingOptions={orderingOptions ?? []}
          emptyIcon={Wrench}
          emptyTitle="No services found"
          emptyDescription="Create your first service request to get started"
        />
      ) : (
        <ServiceKanbanBoard
          services={services?.results ?? []}
          onView={state.handleView}
          onStatusChange={state.handleStatusChange}
        />
      )}

      {/* Create/Edit Sheet */}
      <EntitySheet
        className="sm:min-w-2xl md:min-w-3xl xl:min-w-4xl"
        open={entityState.open}
        onClose={closeEntity}
        title={entityState.entity ? "Edit Service" : "Create New Service"}
        description={
          entityState.entity
            ? "Update service information"
            : "Create a new service request"
        }
        entity={entityState.entity}
        renderForm={({ onClose, entity, forceClose }) =>
          entity ? (
            <ServiceForm
              initialData={entity as Service}
              onClose={onClose}
              forceClose={forceClose}
            />
          ) : (
            <ServiceFormWizard
              onClose={onClose}
              forceClose={forceClose}
            />
          )
        }
        withCloseConfirmation
      />

      {/* Details Sheet */}
      {state.detailsOpen && state.selectedService && (
        <EntitySheet
          withCloseConfirmation
          className="sm:min-w-4xl md:min-w-5xl xl:min-w-6xl"
          open={state.detailsOpen}
          onClose={state.closeDetails}
          title={`Service #${String(state.selectedService.id).padStart(4, "0")}`}
          description={`Created ${new Date(state.selectedService.created_at).toLocaleDateString("en-PH", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}`}
          entity={detailService}
          renderForm={() => (
            <ServiceDetail
              service={detailService || state.selectedService!}
              onEdit={() => {
                state.closeDetails()
                handleEdit(detailService || state.selectedService!)
              }}
              onRefresh={async () => {
                await refetchService()
              }}
            />
          )}
        />
      )}

      {/* Archive Confirmation Dialog */}
      <ConfirmDialog
        open={state.deleteDialog.isOpen}
        onCancel={state.deleteDialog.close}
        title="Archive Service"
        description={
          state.deleteDialog.target
            ? `Are you sure you want to archive service #${state.deleteDialog.target.id}? You can restore it from the Archived tab.`
            : ""
        }
        onConfirm={state.confirmDelete}
        confirmText="Archive"
      />

      {/* Complete Confirmation Dialog */}
      <ConfirmDialog
        open={state.completeDialog.isOpen}
        onCancel={state.completeDialog.close}
        title="Complete Service"
        description={
          state.completeDialog.target
            ? `Complete service #${state.completeDialog.target.id}? This will finalize stock consumption and create transactions.`
            : ""
        }
        onConfirm={state.confirmComplete}
        confirmText="Complete"
      />

      {/* Status Change Confirmation Dialog (for pending → in_progress) */}
      <ConfirmDialog
        open={state.statusChangeDialog.isOpen}
        onCancel={state.statusChangeDialog.close}
        title="Start Service"
        description={
          state.statusChangeDialog.target
            ? `Move service #${state.statusChangeDialog.target.service.id} to "In Progress"? This indicates work has started.`
            : ""
        }
        onConfirm={state.confirmStatusChange}
        confirmText="Start Progress"
      />

      {/* Cancel Service Dialog (with reason) */}
      <Dialog
        open={state.cancelDialog.isOpen}
        onOpenChange={(open) => {
          if (!open) state.cancelDialog.close()
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Cancel Service</DialogTitle>
            <DialogDescription>
              {state.cancelDialog.target
                ? `Cancel service #${state.cancelDialog.target.id}? Please provide a reason.`
                : ""}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            <div className="space-y-2">
              <Label htmlFor="cancel-reason">Cancellation Reason</Label>
              <Textarea
                id="cancel-reason"
                placeholder="Enter the reason for cancellation..."
                value={state.cancelReason}
                onChange={(e) => state.setCancelReason(e.target.value)}
                rows={3}
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button
                variant="outline"
                onClick={state.cancelDialog.close}
              >
                Keep Service
              </Button>
              <Button
                variant="destructive"
                onClick={state.confirmCancel}
                disabled={!state.cancelReason.trim()}
              >
                Cancel Service
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </Wrapper>
  )
}
