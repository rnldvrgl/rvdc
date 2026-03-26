import { Service, ServiceStatus } from "@/lib/constants/interface"
import { useServiceMutations } from "@/lib/mutations/services/useServiceMutations"
import { useCallback, useState } from "react"
import { toast } from "sonner"

interface DialogState<T = Service> {
  isOpen: boolean
  target: T | null
}

function useDialog<T = Service>() {
  const [state, setState] = useState<DialogState<T>>({
    isOpen: false,
    target: null,
  })
  const open = useCallback(
    (target: T) => setState({ isOpen: true, target }),
    [],
  )
  const close = useCallback(() => setState({ isOpen: false, target: null }), [])
  return { isOpen: state.isOpen, target: state.target, open, close } as const
}

export function useServicePageState(refetch: () => void) {
  // Detail sheet
  const [detailsOpen, setDetailsOpen] = useState(false)
  const [selectedService, setSelectedService] = useState<Service | null>(null)

  // Dialogs
  const deleteDialog = useDialog()
  const completeDialog = useDialog()
  const statusChangeDialog = useDialog<{
    service: Service
    newStatus: string
  }>()

  // Cancel dialog needs extra reason state
  const cancelDialog = useDialog()
  const [cancelReason, setCancelReason] = useState("")

  // Mutations
  const { deleteService, completeService, cancelService, updateService } =
    useServiceMutations()

  const handleView = useCallback((service: Service) => {
    setSelectedService(service)
    setDetailsOpen(true)
  }, [])

  const closeDetails = useCallback(() => {
    setDetailsOpen(false)
    setSelectedService(null)
  }, [])

  const handleDelete = useCallback(
    (service: Service) => deleteDialog.open(service),
    [deleteDialog],
  )

  const confirmDelete = useCallback(() => {
    if (deleteDialog.target) {
      deleteService.mutate(deleteDialog.target.id, {
        onSuccess: () => deleteDialog.close(),
      })
    }
  }, [deleteDialog, deleteService])

  const handleComplete = useCallback(
    (service: Service) => completeDialog.open(service),
    [completeDialog],
  )

  const confirmComplete = useCallback(() => {
    if (completeDialog.target) {
      completeService.mutate(completeDialog.target.id, {
        onSuccess: () => {
          completeDialog.close()
          refetch()
        },
      })
    }
  }, [completeDialog, completeService, refetch])

  const handleStatusChange = useCallback(
    (service: Service, newStatus: string) => {
      if (newStatus === "cancelled") {
        cancelDialog.open(service)
        setCancelReason("")
        return
      }
      if (newStatus === "completed") {
        completeDialog.open(service)
        return
      }
      if (newStatus === "in_progress") {
        statusChangeDialog.open({ service, newStatus })
        return
      }
    },
    [cancelDialog, completeDialog, statusChangeDialog],
  )

  const confirmStatusChange = useCallback(() => {
    if (!statusChangeDialog.target) return
    const { service, newStatus } = statusChangeDialog.target
    updateService.mutate(
      { id: service.id, data: { status: newStatus as ServiceStatus } },
      {
        onSuccess: () => {
          statusChangeDialog.close()
          refetch()
        },
        onError: () => {
          toast.error("Failed to update service status")
          statusChangeDialog.close()
        },
      },
    )
  }, [statusChangeDialog, updateService, refetch])

  const confirmCancel = useCallback(() => {
    if (!cancelDialog.target) return
    if (!cancelReason.trim()) {
      toast.error("Please provide a reason for cancellation")
      return
    }
    cancelService.mutate(
      { id: cancelDialog.target.id, reason: cancelReason },
      {
        onSuccess: (response) => {
          const refundDue = (response as { data?: { refund_due?: number } })
            ?.data?.refund_due
          if (refundDue && refundDue > 0) {
            toast.info(
              `₱${refundDue.toLocaleString("en-PH", { minimumFractionDigits: 2 })} refund may be due to the client.`,
            )
          }
          cancelDialog.close()
          setCancelReason("")
          refetch()
        },
        onError: () => {
          toast.error("Failed to cancel service")
        },
      },
    )
  }, [cancelDialog, cancelReason, cancelService, refetch])

  return {
    // Detail sheet
    detailsOpen,
    selectedService,
    handleView,
    closeDetails,

    // Delete/archive
    deleteDialog,
    confirmDelete,
    handleDelete,

    // Complete
    completeDialog,
    confirmComplete,
    handleComplete,

    // Status change
    statusChangeDialog,
    confirmStatusChange,
    handleStatusChange,

    // Cancel
    cancelDialog,
    cancelReason,
    setCancelReason,
    confirmCancel,
  }
}
