"use client"

import { getServiceColumns } from "@/app/(routes)/services/columns"
import { ConfirmDialog } from "@/components/custom/shared/ConfirmDialog"
import EntitySheet from "@/components/custom/shared/EntitySheet"
import PageHeader from "@/components/custom/shared/PageHeader"
import { Wrapper } from "@/components/custom/shared/Wrapper"
import { DataTable } from "@/components/custom/table/DataTable"
import ServiceForm from "@/components/forms/ServiceForm"
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
import { Service, ServiceStatus } from "@/lib/constants/interface"
import { PaginatedResult } from "@/lib/constants/types"
import { useCurrentUser } from "@/lib/hooks/useCurrentUser"
import { useEntitySheet } from "@/lib/hooks/useEntitySheet"
import useSearchParameters from "@/lib/hooks/useSearchParameters"
import { useServiceMutations } from "@/lib/mutations/services/useServiceMutations"
import {
  useService,
  useServiceFilters,
  useServices,
} from "@/lib/queries/services/useServices"
import { Kanban, List, Plus, Wrench } from "lucide-react"
import { useState } from "react"
import { toast } from "sonner"

type ViewMode = "table" | "kanban"

export default function ServicesPage() {
  const { role } = useCurrentUser()
  const canAddService = role === "admin" || role === "manager"
  const [viewMode, setViewMode] = useState<ViewMode>("table")
  const [detailsOpen, setDetailsOpen] = useState(false)
  const [selectedService, setSelectedService] = useState<Service | null>(null)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [completeDialogOpen, setCompleteDialogOpen] = useState(false)
  const [serviceToDelete, setServiceToDelete] = useState<Service | null>(null)
  const [serviceToComplete, setServiceToComplete] = useState<Service | null>(
    null,
  )

  // Cancel dialog state (for drag-to-cancel and inline cancel)
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false)
  const [cancelReason, setCancelReason] = useState("")
  const [serviceToCancel, setServiceToCancel] = useState<Service | null>(null)

  // Status change state (for confirming transitions)
  const [statusChangeDialogOpen, setStatusChangeDialogOpen] = useState(false)
  const [statusChangeTarget, setStatusChangeTarget] = useState<{
    service: Service
    newStatus: string
  } | null>(null)

  // Search params
  const { filter, ordering, search, page, limit } = useSearchParameters()

  // Data fetching
  const {
    data: services,
    isLoading,
    refetch,
  } = useServices({
    page,
    limit,
    search,
    filter,
    ordering,
  })

  const { filters: filterDefs, orderingOptions } = useServiceFilters()

  // Mutations
  const { deleteService, completeService, cancelService, updateService } =
    useServiceMutations()

  // Entity sheet for create/edit
  const { entityState, openEntity, closeEntity } = useEntitySheet<Service>()

  const handleView = (service: Service) => {
    setSelectedService(service)
    setDetailsOpen(true)
  }

  // Fetch fresh service data when viewing details
  const { data: detailService, refetch: refetchService } = useService(
    selectedService?.id,
  )

  const handleEdit = (service: Service) => {
    openEntity(service)
  }

  const handleDelete = (service: Service) => {
    setServiceToDelete(service)
    setDeleteDialogOpen(true)
  }

  const confirmDelete = () => {
    if (serviceToDelete) {
      deleteService.mutate(serviceToDelete.id, {
        onSuccess: () => {
          setDeleteDialogOpen(false)
          setServiceToDelete(null)
        },
      })
    }
  }

  const handleComplete = (service: Service) => {
    setServiceToComplete(service)
    setCompleteDialogOpen(true)
  }

  const confirmComplete = () => {
    if (serviceToComplete) {
      completeService.mutate(serviceToComplete.id, {
        onSuccess: () => {
          setCompleteDialogOpen(false)
          setServiceToComplete(null)
          refetch()
        },
      })
    }
  }

  // ── Status change handler (from both table inline buttons & kanban drag) ──
  const handleStatusChange = (service: Service, newStatus: string) => {
    if (newStatus === "cancelled") {
      // Need cancel reason dialog
      setServiceToCancel(service)
      setCancelReason("")
      setCancelDialogOpen(true)
      return
    }

    if (newStatus === "completed") {
      // Use existing complete flow
      handleComplete(service)
      return
    }

    if (newStatus === "in_progress") {
      // Confirm start progress
      setStatusChangeTarget({ service, newStatus })
      setStatusChangeDialogOpen(true)
      return
    }
  }

  const confirmStatusChange = () => {
    if (!statusChangeTarget) return

    const { service, newStatus } = statusChangeTarget

    updateService.mutate(
      { id: service.id, data: { status: newStatus as ServiceStatus } },
      {
        onSuccess: () => {
          setStatusChangeDialogOpen(false)
          setStatusChangeTarget(null)
          refetch()
        },
        onError: () => {
          toast.error("Failed to update service status")
          setStatusChangeDialogOpen(false)
          setStatusChangeTarget(null)
        },
      },
    )
  }

  const confirmCancel = () => {
    if (!serviceToCancel) return
    if (!cancelReason.trim()) {
      toast.error("Please provide a reason for cancellation")
      return
    }

    cancelService.mutate(
      { id: serviceToCancel.id, reason: cancelReason },
      {
        onSuccess: () => {
          setCancelDialogOpen(false)
          setServiceToCancel(null)
          setCancelReason("")
          refetch()
        },
        onError: () => {
          toast.error("Failed to cancel service")
        },
      },
    )
  }

  const columns = getServiceColumns({
    role,
    onView: handleView,
    onEdit: handleEdit,
    onDelete: handleDelete,
    onComplete: handleComplete,
    onStatusChange: handleStatusChange,
  })

  return (
    <Wrapper>
      <PageHeader
        icon={Wrench}
        title="Services"
        description="Manage repair, installation, and maintenance services"
        actionButton={
          <div className="flex items-center gap-2">
            {/* View toggle */}
            <div className="flex items-center rounded-lg border bg-muted p-0.5">
              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    aria-label="Table view"
                    onClick={() => setViewMode("table")}
                    className={`inline-flex items-center justify-center rounded-md px-2.5 py-1.5 text-sm transition-colors ${
                      viewMode === "table"
                        ? "bg-background shadow-sm text-foreground"
                        : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    <List className="h-4 w-4" />
                  </button>
                </TooltipTrigger>
                <TooltipContent>Table view</TooltipContent>
              </Tooltip>
              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    aria-label="Kanban board view"
                    onClick={() => setViewMode("kanban")}
                    className={`inline-flex items-center justify-center rounded-md px-2.5 py-1.5 text-sm transition-colors ${
                      viewMode === "kanban"
                        ? "bg-background shadow-sm text-foreground"
                        : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    <Kanban className="h-4 w-4" />
                  </button>
                </TooltipTrigger>
                <TooltipContent>Kanban board</TooltipContent>
              </Tooltip>
            </div>

            {canAddService && (
              <Button
                onClick={() => openEntity()}
                size="sm"
              >
                <Plus className="mr-2 h-4 w-4" />
                New Service
              </Button>
            )}
          </div>
        }
        onRefresh={refetch}
      />

      {/* Conditional view rendering */}
      {viewMode === "table" ? (
        <DataTable<Service, unknown>
          columns={columns}
          data={
            services ??
            ({
              count: 0,
              next: null,
              previous: null,
              results: [],
            } as PaginatedResult<Service>)
          }
          isLoading={isLoading}
          filters={filterDefs ?? []}
          orderingOptions={orderingOptions ?? []}
        />
      ) : (
        <ServiceKanbanBoard
          services={services?.results ?? []}
          onView={handleView}
          onStatusChange={handleStatusChange}
        />
      )}

      {/* Create/Edit Sheet */}
      <EntitySheet
        className="sm:min-w-2xl md:minx-w-3xl xl:min-w-3xl"
        open={entityState.open}
        onClose={closeEntity}
        title={entityState.entity ? "Edit Service" : "Create New Service"}
        description={
          entityState.entity
            ? "Update service information"
            : "Create a new service request"
        }
        entity={entityState.entity}
        renderForm={({ onClose, entity, forceClose }) => (
          <ServiceForm
            initialData={entity as Service}
            onClose={onClose}
            forceClose={forceClose}
          />
        )}
        withCloseConfirmation
      />

      {/* Details Sheet */}
      {detailsOpen && selectedService && (
        <EntitySheet
          withCloseConfirmation
          className="sm:min-w-2xl md:minx-w-3xl xl:min-w-3xl"
          open={detailsOpen}
          onClose={() => {
            setDetailsOpen(false)
            setSelectedService(null)
          }}
          title={`Service #${String(selectedService.id).padStart(4, "0")}`}
          description={`Created ${new Date(selectedService.created_at).toLocaleDateString("en-PH", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}`}
          entity={detailService}
          renderForm={() => (
            <ServiceDetail
              service={detailService || selectedService}
              onEdit={() => {
                setDetailsOpen(false)
                handleEdit(detailService || selectedService)
              }}
              onRefresh={async () => {
                await refetchService()
              }}
            />
          )}
        />
      )}

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        open={deleteDialogOpen}
        onCancel={() => setDeleteDialogOpen(false)}
        title="Delete Service"
        description={
          serviceToDelete
            ? `Are you sure you want to delete service #${serviceToDelete.id}? This action cannot be undone.`
            : ""
        }
        onConfirm={confirmDelete}
        confirmText="Delete"
      />

      {/* Complete Confirmation Dialog */}
      <ConfirmDialog
        open={completeDialogOpen}
        onCancel={() => setCompleteDialogOpen(false)}
        title="Complete Service"
        description={
          serviceToComplete
            ? `Complete service #${serviceToComplete.id}? This will finalize stock consumption and create transactions.`
            : ""
        }
        onConfirm={confirmComplete}
        confirmText="Complete"
      />

      {/* Status Change Confirmation Dialog (for pending → in_progress) */}
      <ConfirmDialog
        open={statusChangeDialogOpen}
        onCancel={() => {
          setStatusChangeDialogOpen(false)
          setStatusChangeTarget(null)
        }}
        title="Start Service"
        description={
          statusChangeTarget
            ? `Move service #${statusChangeTarget.service.id} to "In Progress"? This indicates work has started.`
            : ""
        }
        onConfirm={confirmStatusChange}
        confirmText="Start Progress"
      />

      {/* Cancel Service Dialog (with reason) */}
      <Dialog
        open={cancelDialogOpen}
        onOpenChange={setCancelDialogOpen}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Cancel Service</DialogTitle>
            <DialogDescription>
              {serviceToCancel
                ? `Cancel service #${serviceToCancel.id}? Please provide a reason.`
                : ""}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            <div className="space-y-2">
              <Label htmlFor="cancel-reason">Cancellation Reason</Label>
              <Textarea
                id="cancel-reason"
                placeholder="Enter the reason for cancellation..."
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
                rows={3}
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button
                variant="outline"
                onClick={() => {
                  setCancelDialogOpen(false)
                  setServiceToCancel(null)
                  setCancelReason("")
                }}
              >
                Keep Service
              </Button>
              <Button
                variant="destructive"
                onClick={confirmCancel}
                disabled={!cancelReason.trim()}
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
