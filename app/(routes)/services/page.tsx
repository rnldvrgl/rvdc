"use client"

import { getServiceColumns } from "@/app/(routes)/services/columns"
import { ConfirmDialog } from "@/components/custom/shared/ConfirmDialog"
import EntitySheet from "@/components/custom/shared/EntitySheet"
import PageHeader from "@/components/custom/shared/PageHeader"
import { Wrapper } from "@/components/custom/shared/Wrapper"
import { DataTable } from "@/components/custom/table/DataTable"
import ServiceForm from "@/components/forms/ServiceForm"
import ServiceDetail from "@/components/services/ServiceDetail"
import { Button } from "@/components/ui/button"
import { Service } from "@/lib/constants/interface"
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
import { Plus, Wrench } from "lucide-react"
import { useState } from "react"
import { toast } from "sonner"

export default function ServicesPage() {
  const { role } = useCurrentUser()
  const canAddService = role === "admin" || role === "manager"
  const [detailsOpen, setDetailsOpen] = useState(false)
  const [selectedService, setSelectedService] = useState<Service | null>(null)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [completeDialogOpen, setCompleteDialogOpen] = useState(false)
  const [serviceToDelete, setServiceToDelete] = useState<Service | null>(null)
  const [serviceToComplete, setServiceToComplete] = useState<Service | null>(
    null,
  )

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
  const { deleteService, completeService } = useServiceMutations()

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
          toast.success("Service completed successfully!")
          setCompleteDialogOpen(false)
          setServiceToComplete(null)
        },
      })
    }
  }

  const columns = getServiceColumns({
    role,
    onView: handleView,
    onEdit: handleEdit,
    onDelete: handleDelete,
    onComplete: handleComplete,
  })

  return (
    <Wrapper>
      <PageHeader
        icon={Wrench}
        title="Services"
        description="Manage repair, installation, and maintenance services"
        actionButton={
          canAddService && (
            <Button
              onClick={() => openEntity()}
              size="sm"
            >
              <Plus className="mr-2 h-4 w-4" />
              New Service
            </Button>
          )
        }
        onRefresh={refetch}
      />

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
    </Wrapper>
  )
}
