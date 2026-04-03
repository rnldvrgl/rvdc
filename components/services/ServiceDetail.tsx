"use client"

import { CardSelect } from "@/components/custom/inputs/CardSelect"
import { ComboBox } from "@/components/custom/inputs/ComboBox"
import { DateTimePicker } from "@/components/custom/inputs/DateTimePicker"
import { ConfirmDialog } from "@/components/custom/shared/ConfirmDialog"
import {
    ServiceReceiptPrintContent,
    type ServiceReceiptMode,
} from "@/components/custom/shared/ServiceReceiptPrintContent"
import ServiceApplianceManager from "@/components/forms/ServiceApplianceManager"
import PartsManager from "@/components/forms/PartsManager"
import ApplianceKanbanBoard from "@/components/services/ApplianceKanbanBoard"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Calendar as CalendarWidget } from "@/components/ui/calendar"
import { Checkbox } from "@/components/ui/checkbox"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Textarea } from "@/components/ui/textarea"
import {
    Tooltip,
    TooltipContent,
    TooltipTrigger,
} from "@/components/ui/tooltip"
import { Service, ServicePayload, ServiceReceipt } from "@/lib/constants/interface"
import { useCurrentUser } from "@/lib/hooks/useCurrentUser"
import { usePrint } from "@/lib/hooks/usePrint"
import { useServiceApplianceMutations } from "@/lib/mutations/services/useServiceApplianceMutations"
import { useServiceMutations } from "@/lib/mutations/services/useServiceMutations"
import { useServiceReceiptMutations } from "@/lib/mutations/services/useServiceReceiptMutations"
import { useServiceItems } from "@/lib/queries/services/useServiceItems"
import { useChequeChoices } from "@/lib/queries/useChoices"
import { useSchedulesByService } from "@/lib/queries/useSchedules"
import {
    formatCurrency,
    formatTimeTo12Hour,
    getBadgeVariant,
} from "@/lib/utils/helpers"
import { formatDate } from "@/lib/utils/helpers/date"
import {
    getServiceModeLabel,
    getServiceStatusLabel,
    getServiceTypeBadgeClass,
    getServiceTypeLabel,
} from "@/lib/utils/helpers/service"
import { useQueryClient } from "@tanstack/react-query"
import { format } from "date-fns"
import {
    AlertTriangle,
    Calendar,
    CalendarIcon,
    CheckCircle,
    Clock,
    Copy,
    Edit,
    Hash,
    Info,
    Kanban,
    List,
    MapPin,
    Package,
    PenLine,
    Phone,
    Plus,
    Printer,
    RotateCcw,
    Trash2,
    Truck,
    User,
    Wallet,
    Wrench,
    XIcon,
} from "lucide-react"
import { useEffect, useState } from "react"
import { toast } from "sonner"

interface ServiceDetailProps {
  service: Service
  onEdit?: () => void
  onRefresh?: () => void
}

const paymentStatusLabels: Record<string, string> = {
  pending: "Pending",
  unpaid: "Unpaid",
  partial: "Partially Paid",
  paid: "Paid",
}

const applianceStatusLabels: Record<string, string> = {
  pending: "Pending",
  in_repair: "In Repair",
  completed: "Completed",
  ready_for_pickup: "Ready for Pickup",
  delivered: "Delivered",
  cancelled: "Cancelled",
}

export default function ServiceDetail({
  service,
  onEdit,
  onRefresh,
}: ServiceDetailProps) {
  const queryClient = useQueryClient()
  const { canManage, role, isAdmin } = useCurrentUser()
  const [completeDialogOpen, setCompleteDialogOpen] = useState(false)
  const [paymentDialogOpen, setPaymentDialogOpen] = useState(false)
  const [paymentAmount, setPaymentAmount] = useState("")
  const [paymentType, setPaymentType] = useState("cash")
  const [paymentNotes, setPaymentNotes] = useState("")
  const [selectedCheque, setSelectedCheque] = useState<number | null>(null)
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false)
  const [reopenDialogOpen, setReopenDialogOpen] = useState(false)
  const [reopenReason, setReopenReason] = useState("")
  const [cancelReason, setCancelReason] = useState("")
  const [refundDialogOpen, setRefundDialogOpen] = useState(false)
  const [refundAmount, setRefundAmount] = useState("")
  const [refundReason, setRefundReason] = useState("")
  const [refundType, setRefundType] = useState<"full" | "partial">("partial")
  const [refundMethod, setRefundMethod] = useState<
    "cash" | "gcash" | "bank_transfer"
  >("cash")
  const [discountValue, setDiscountValue] = useState("")
  const [discountReason, setDiscountReason] = useState("")
  const [scheduleDeliveryDialogOpen, setScheduleDeliveryDialogOpen] =
    useState(false)
  const [deliveryDate, setDeliveryDate] = useState<Date | undefined>()
  const [appointmentDate, setAppointmentDate] = useState<Date | undefined>()
  const [isSettingAppointment, setIsSettingAppointment] = useState(false)
  const [applianceView, setApplianceView] = useState<"list" | "kanban">("list")
  const [receiptPrintDialogOpen, setReceiptPrintDialogOpen] = useState(false)
  const [receiptMode, setReceiptMode] = useState<ServiceReceiptMode>("combined")
  const [showAddReceiptForm, setShowAddReceiptForm] = useState(false)
  const [editingReceiptId, setEditingReceiptId] = useState<number | null>(null)
  const emptyReceiptDraft = {
    document_type: "or" as "or" | "si",
    receipt_number: "",
    receipt_book: "",
    with_2307: false,
    amount: "",
  }
  const [receiptDraft, setReceiptDraft] = useState(emptyReceiptDraft)
  const [transactionDateOpen, setTransactionDateOpen] = useState(false)
  const [reServiceDialogOpen, setReServiceDialogOpen] = useState(false)
  const [reServiceReason, setReServiceReason] = useState("")
  const [claimingApplianceId, setClaimingApplianceId] = useState<number | null>(null)
  const [forfeitingApplianceId, setForfeitingApplianceId] = useState<number | null>(null)
  const [forfeitingApplianceNotes, setForfeitingApplianceNotes] = useState("")
  const [acquiringApplianceId, setAcquiringApplianceId] = useState<number | null>(null)
  const [acquiringAppliancePrice, setAcquiringAppliancePrice] = useState("")
  const [acquiringApplianceNotes, setAcquiringApplianceNotes] = useState("")
  const {
    completeService,
    recordPayment,
    cancelService,
    refundService,
    updateService,
    reopenService,
    toggleServiceItemsChecked,
  } = useServiceMutations()
  const { addService } = useServiceMutations()
  const { updateAppliance, markApplianceClaimed, markApplianceForfeited, convertApplianceToAcquisition } = useServiceApplianceMutations()
  const { addReceipt, updateReceipt, deleteReceipt } =
    useServiceReceiptMutations()

  // Receipt printing
  const {
    printRef: serviceReceiptRef,
    confirmPrint: confirmServicePrint,
    cancelPrint: cancelServicePrint,
    showPrintDialog: showServicePrintDialog,
    setShowPrintDialog: setShowServicePrintDialog,
  } = usePrint({
    documentTitle: `Service Receipt - SVC-${service.id}`,
    requireConfirmation: true,
  })
  const { data: schedules = [], isLoading: schedulesLoading } =
    useSchedulesByService(service.id)
  const { data: chequeChoices = [], rawData: chequeRawData = [] } =
    useChequeChoices(service.client?.id)

  const canComplete = service.status === "in_progress"
  const isCompleted = service.status === "completed"
  const isCarryIn = service.service_mode === "carry_in"
  const isUnclaimedMode = service.service_mode === "carry_in" || service.service_mode === "pull_out"
  // Block reopen/reservice when any appliance is acquired or forfeited — company asset records already exist
  const hasAnyForfeitedOrAcquired = service.is_forfeited || (service.appliances?.some((a) => a.is_forfeited) ?? false)

  // Initialize discount form with existing values
  useEffect(() => {
    const discountAmount = parseFloat(service.service_discount_amount || "0")

    if (discountAmount > 0) {
      setDiscountValue(service.service_discount_amount || "")
    } else {
      setDiscountValue("")
    }

    setDiscountReason(service.discount_reason || "")
  }, [service.id, service.service_discount_amount, service.discount_reason])

  // Auto-fill payment amount when cheque is selected
  useEffect(() => {
    if (selectedCheque && chequeRawData.length > 0) {
      const selectedChequeData = chequeRawData.find(
        (c) => c.id === selectedCheque,
      )
      if (selectedChequeData) {
        setPaymentAmount(selectedChequeData.cheque_amount)
      }
    }
  }, [selectedCheque, chequeRawData])

  // Calculate discount amount
  const calculateDiscount = () => {
    if (!discountValue) return 0
    const value = parseFloat(discountValue)
    if (isNaN(value)) return 0
    return value
  }

  // Check if all appliances are ready for completion
  const hasUnfinishedAppliances = service.appliances?.some(
    (appliance) => appliance.status === "pending",
  )

  const handleComplete = () => {
    // Validate appliances are ready
    if (hasUnfinishedAppliances) {
      toast.error(
        "Cannot complete service. Some appliances are not finished yet. Please update appliance status to 'Completed' or 'Ready for Pickup' first.",
      )
      setCompleteDialogOpen(false)
      return
    }

    // Validate items have been confirmed
    if (service.has_pending_items) {
      toast.error(
        "Cannot complete service. Items have not been confirmed for all appliances. Please ask the clerk to confirm parts/items used.",
      )
      setCompleteDialogOpen(false)
      return
    }

    completeService.mutate(service.id, {
      onSuccess: (response) => {
        const data = response.data
        toast.success("Service completed successfully!")
        if (data?.receipt || data?.main_receipt || data?.sub_receipt) {
          toast.info("Receipt created successfully.")
          // Open print dialog after completion
          setCompleteDialogOpen(false)
          setReceiptPrintDialogOpen(true)
        } else {
          toast.warning(
            data?.message || "Service completed but no receipt was created.",
          )
          setCompleteDialogOpen(false)
        }
      },
      onSettled: () => {
        onRefresh?.()
      },
    })
  }

  const handleReopen = () => {
    reopenService.mutate(
      { id: service.id, reason: reopenReason },
      {
        onSuccess: () => {
          setReopenDialogOpen(false)
          setReopenReason("")
          onRefresh?.()
        },
      },
    )
  }

  const handleAddPayment = () => {
    const balanceDue = parseFloat(service.balance_due || "0")
    setPaymentAmount(balanceDue > 0 ? balanceDue.toString() : "0")
    setPaymentType("cash")
    setPaymentNotes("")
    setSelectedCheque(null)
    setPaymentDialogOpen(true)
  }

  const handleCancelService = () => {
    if (!cancelReason.trim()) {
      toast.error("Please provide a reason for cancellation")
      return
    }

    cancelService.mutate(
      { id: service.id, reason: cancelReason },
      {
        onSuccess: () => {
          setCancelDialogOpen(false)
          setCancelReason("")
        },
        onSettled: () => {
          onRefresh?.()
        },
      },
    )
  }

  const handleScheduleDelivery = async () => {
    if (!deliveryDate) {
      toast.error("Please select a delivery date and time")
      return
    }

    const formatDateForBackend = (date: Date): string => {
      const year = date.getFullYear()
      const month = String(date.getMonth() + 1).padStart(2, "0")
      const day = String(date.getDate()).padStart(2, "0")
      const hours = String(date.getHours()).padStart(2, "0")
      const minutes = String(date.getMinutes()).padStart(2, "0")
      const seconds = String(date.getSeconds()).padStart(2, "0")
      return `${year}-${month}-${day}T${hours}:${minutes}:${seconds}`
    }

    updateService.mutate(
      {
        id: service.id,
        data: {
          delivery_date: formatDateForBackend(deliveryDate),
        },
      },
      {
        onSuccess: () => {
          toast.success("Delivery scheduled successfully")
          setScheduleDeliveryDialogOpen(false)
          setDeliveryDate(undefined)
          if (onRefresh) onRefresh()
        },
        onError: (error: unknown) => {
          const errorMessage =
            error && typeof error === "object" && "response" in error
              ? (error.response as { data?: { message?: string } })?.data
                  ?.message
              : undefined
          toast.error(errorMessage || "Failed to schedule delivery")
        },
      },
    )
  }

  const handleSetAppointment = async () => {
    if (!appointmentDate) {
      toast.error("Please select an appointment date and time")
      return
    }

    const formatDateForBackend = (date: Date): string => {
      const year = date.getFullYear()
      const month = String(date.getMonth() + 1).padStart(2, "0")
      const day = String(date.getDate()).padStart(2, "0")
      const hours = String(date.getHours()).padStart(2, "0")
      const minutes = String(date.getMinutes()).padStart(2, "0")
      const seconds = String(date.getSeconds()).padStart(2, "0")
      return `${year}-${month}-${day}T${hours}:${minutes}:${seconds}`
    }

    updateService.mutate(
      {
        id: service.id,
        data: {
          appointment_datetime: formatDateForBackend(appointmentDate),
        },
      },
      {
        onSuccess: () => {
          toast.success("Appointment scheduled successfully")
          setIsSettingAppointment(false)
          setAppointmentDate(undefined)
          queryClient.invalidateQueries({
            queryKey: ["schedules", "service", service.id],
          })
          if (onRefresh) onRefresh()
        },
      },
    )
  }

  const handleRefundService = () => {
    const amount = parseFloat(refundAmount)
    if (!amount || amount <= 0) {
      toast.error("Please enter a valid refund amount")
      return
    }

    const maxRefundable =
      parseFloat(service.total_paid || "0") -
      parseFloat(service.total_refunded || "0")
    if (amount > maxRefundable) {
      toast.error(
        `Maximum refundable amount is ${formatCurrency(maxRefundable)}`,
      )
      return
    }

    if (!refundReason.trim()) {
      toast.error("Please provide a reason for refund")
      return
    }

    const roundedAmount = Math.round(amount * 100) / 100

    refundService.mutate(
      {
        id: service.id,
        data: {
          refund_amount: roundedAmount,
          reason: refundReason,
          refund_type: refundType,
          refund_method: refundMethod,
        },
      },
      {
        onSuccess: () => {
          setRefundDialogOpen(false)
          setRefundAmount("")
          setRefundReason("")
        },
        onSettled: () => {
          onRefresh?.()
        },
      },
    )
  }

  const handleApplyDiscount = () => {
    // Allow removing discount
    if (!discountValue || parseFloat(discountValue) <= 0) {
      updateService.mutate(
        {
          id: service.id,
          data: {
            service_discount_amount: 0,
            service_discount_percentage: 0,
            discount_reason: "",
          },
        },
        {
          onSuccess: () => {
            setDiscountValue("")
            setDiscountReason("")
          },
          onSettled: () => {
            onRefresh?.()
          },
        },
      )
      return
    }

    updateService.mutate(
      {
        id: service.id,
        data: {
          service_discount_amount:
            Math.round(parseFloat(discountValue) * 100) / 100,
          service_discount_percentage: 0,
          discount_reason: discountReason,
        },
      },
      {
        onSuccess: () => {
          toast.success("Discount applied successfully")
        },
        onSettled: () => {
          onRefresh?.()
        },
      },
    )
  }

  const handlePaymentSubmit = () => {
    if (!paymentAmount || parseFloat(paymentAmount) <= 0) {
      toast.error("Please enter a valid payment amount")
      return
    }

    if (paymentType === "cheque" && !selectedCheque) {
      toast.error("Please select a cheque for cheque payments")
      return
    }

    const roundedAmount = Math.round(parseFloat(paymentAmount) * 100) / 100

    recordPayment.mutate(
      {
        id: service.id,
        data: {
          payment_type: paymentType,
          amount: roundedAmount.toString(),
          notes: paymentNotes || undefined,
          cheque_collection:
            paymentType === "cheque" ? selectedCheque : undefined,
        },
      },
      {
        onSuccess: () => {
          setPaymentDialogOpen(false)
          setPaymentAmount("")
          setPaymentType("cash")
          setPaymentNotes("")
          setSelectedCheque(null)
        },
        onSettled: () => {
          // Call onRefresh after query invalidation completes
          onRefresh?.()
        },
      },
    )
  }

  const OverPaymentWarning = () => {
    return (
      <Alert
        variant="warning"
        className="mt-3"
      >
        <AlertTriangle className="h-4 w-4" />
        <AlertDescription>
          Overpayment detected! Customer paid more than the total amount. Please
          process a refund for the excess amount.
        </AlertDescription>
      </Alert>
    )
  }

  return (
    <div className="space-y-4">
      {/* Header: Badges + Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        {/* Status Badges — compact inline pills */}
        <div className="flex flex-wrap items-center gap-1.5">
          <Badge
            variant={getBadgeVariant(service.status)}
            className="text-[11px] px-2 py-0.5"
          >
            {getServiceStatusLabel(service.status)}
          </Badge>
          <Badge
            variant="outline"
            className={`text-[11px] px-2 py-0.5 ${getServiceTypeBadgeClass(service.service_type)}`}
          >
            {getServiceTypeLabel(service.service_type)}
          </Badge>
          <Badge
            className="text-[11px] px-2 py-0.5"
            variant="secondary"
          >
            {getServiceModeLabel(service.service_mode)}
          </Badge>
          <Badge
            variant={getBadgeVariant(service.payment_status)}
            className="text-[11px] px-2 py-0.5"
          >
            {paymentStatusLabels[service.payment_status] ||
              service.payment_status}
          </Badge>
          {service.is_back_job && (
            <Badge
              variant="outline"
              className="text-[11px] px-2 py-0.5 border-orange-500 text-orange-600 bg-orange-50 dark:bg-orange-950/30"
            >
              Re-Service
            </Badge>
          )}
          {service.claimed_at && (
            <Badge
              variant="outline"
              className="text-[11px] px-2 py-0.5 border-green-500 text-green-700 bg-green-50 dark:bg-green-950/30"
            >
              Claimed
            </Badge>
          )}
          {service.is_forfeited && (
            <Badge
              variant="outline"
              className="text-[11px] px-2 py-0.5 border-red-500 text-red-700 bg-red-50 dark:bg-red-950/30"
            >
              {service.forfeiture_type === "client_sold" ? "Acquired" : "Forfeited"}
            </Badge>
          )}
        </div>

        {/* Action Buttons — icon-only on small screens */}
        <div className="flex items-center gap-1.5">
          {!isCompleted && onEdit && canManage && (
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="outline"
                  size="icon"
                  className="h-7 w-7"
                  onClick={onEdit}
                >
                  <Edit className="h-3.5 w-3.5" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Edit</TooltipContent>
            </Tooltip>
          )}
          {service.status !== "completed" &&
            service.status !== "cancelled" &&
            canManage && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="destructive"
                    size="icon"
                    className="h-7 w-7"
                    onClick={() => setCancelDialogOpen(true)}
                  >
                    <XIcon className="h-3.5 w-3.5" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Cancel Service</TooltipContent>
              </Tooltip>
            )}
          {service.status === "completed" && canManage && (
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="warning"
                  size="icon"
                  className="h-7 w-7"
                  onClick={() => {
                    setRefundDialogOpen(true)
                    const maxRefund =
                      parseFloat(service.total_paid || "0") -
                      parseFloat(service.total_refunded || "0")
                    setRefundAmount(maxRefund.toString())
                  }}
                >
                  <Info className="h-3.5 w-3.5" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Process Refund</TooltipContent>
            </Tooltip>
          )}
          {service.status === "completed" && (
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  className="h-7 px-2.5 text-xs"
                  onClick={() => setReceiptPrintDialogOpen(true)}
                >
                  <Printer className="mr-1 h-3.5 w-3.5" />
                  Print
                </Button>
              </TooltipTrigger>
              <TooltipContent>Print Service Receipt</TooltipContent>
            </Tooltip>
          )}
          {isCompleted && canManage && (
            <Tooltip>
              <TooltipTrigger asChild>
                <span tabIndex={hasAnyForfeitedOrAcquired ? 0 : undefined}>
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-7 px-2.5 text-xs"
                    onClick={() => setReopenDialogOpen(true)}
                    disabled={hasAnyForfeitedOrAcquired}
                  >
                    <RotateCcw className="mr-1 h-3.5 w-3.5" />
                    Reopen
                  </Button>
                </span>
              </TooltipTrigger>
              <TooltipContent>
                {hasAnyForfeitedOrAcquired
                  ? "Cannot reopen: appliance(s) have been acquired or forfeited as company property"
                  : "Reopen service to add/remove parts, then re-complete"}
              </TooltipContent>
            </Tooltip>
          )}
          {isCompleted && canManage && (
            <Tooltip>
              <TooltipTrigger asChild>
                <span tabIndex={hasAnyForfeitedOrAcquired ? 0 : undefined}>
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-7 px-2.5 text-xs border-orange-500 text-orange-600 dark:text-orange-400 hover:bg-orange-50 dark:hover:bg-orange-950/30"
                    onClick={() => setReServiceDialogOpen(true)}
                    disabled={hasAnyForfeitedOrAcquired}
                  >
                    <Copy className="mr-1 h-3.5 w-3.5" />
                    Re-Service
                  </Button>
                </span>
              </TooltipTrigger>
              <TooltipContent>
                {hasAnyForfeitedOrAcquired
                  ? "Cannot re-service: appliance(s) have been acquired or forfeited as company property"
                  : "Create a back job / re-service for this completed service"}
              </TooltipContent>
            </Tooltip>
          )}
          {canComplete && canManage && (
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  size="sm"
                  variant="success"
                  className="h-7 px-2.5 text-xs"
                  onClick={() => setCompleteDialogOpen(true)}
                >
                  <CheckCircle className="mr-1 h-3.5 w-3.5" />
                  Complete
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                Finalize service, create transactions, and mark as completed
              </TooltipContent>
            </Tooltip>
          )}
        </div>
      </div>

      {/* Tabs */}
      <Tabs
        defaultValue="overview"
        className="w-full"
      >
        <TabsList className="grid w-full grid-cols-4 h-9">
          <TabsTrigger
            value="overview"
            className="text-xs sm:text-sm gap-1.5"
          >
            <Info className="h-3.5 w-3.5 hidden sm:block" />
            Overview
          </TabsTrigger>
          <TabsTrigger
            value="appliances"
            className="text-xs sm:text-sm gap-1.5"
          >
            <Package className="h-3.5 w-3.5 hidden sm:block" />
            <span className="hidden sm:inline">
              {service.service_type === "installation" ? "Units" : "Appliances"}
            </span>
            <span className="inline sm:hidden">
              {service.service_type === "installation" ? "Units" : "Items"}
            </span>
            {service.appliances && service.appliances.length > 0 && (
              <Badge
                variant="secondary"
                className="h-5 min-w-5 px-1 text-[10px] rounded-full"
              >
                {service.appliances.length}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger
            value="payments"
            className="text-xs sm:text-sm gap-1.5"
          >
            <Wallet className="h-3.5 w-3.5 hidden sm:block" />
            Payments
            {service.payments && service.payments.length > 0 && (
              <Badge
                variant="secondary"
                className="h-5 min-w-5 px-1 text-[10px] rounded-full"
              >
                {service.payments.length}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger
            value="schedule"
            className="text-xs sm:text-sm gap-1.5"
          >
            <Calendar className="h-3.5 w-3.5 hidden sm:block" />
            Schedule
          </TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent
          value="overview"
          className="space-y-2"
        >
          {/* Service Info Grid */}
          <div className="rounded-lg border bg-card">
            <div className="px-4 py-3 space-y-3">
              {/* Header: ID + Status badges */}
              <div className="flex items-center justify-between">
                <p className="text-sm font-semibold flex items-center gap-1.5">
                  <Hash className="h-3.5 w-3.5 text-muted-foreground" />
                  SVC-{service.id}
                </p>
                <div className="flex flex-wrap items-center gap-1.5">
                  <Badge
                    variant={getBadgeVariant(service.status)}
                    className="text-[11px]"
                  >
                    {getServiceStatusLabel(service.status)}
                  </Badge>
                  <Badge
                    variant={getBadgeVariant(service.payment_status)}
                    className="text-[11px]"
                  >
                    {paymentStatusLabels[service.payment_status] ||
                      service.payment_status}
                  </Badge>
                </div>
              </div>

              <Separator />

              {/* Details grid */}
              <div className="grid grid-cols-2 gap-x-6 gap-y-3 text-sm">
                {/* Client */}
                <div className="col-span-2 sm:col-span-1">
                  <p className="text-xs text-muted-foreground mb-0.5 flex items-center gap-1">
                    <User className="h-3 w-3" />
                    Client
                  </p>
                  <p className="font-medium">
                    {service.client?.full_name || "N/A"}
                  </p>
                  {service.client?.contact_number && (
                    <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                      <Phone className="h-3 w-3 shrink-0" />
                      {service.client.contact_number}
                    </p>
                  )}
                </div>

                {/* Type & Mode */}
                <div className="col-span-2 sm:col-span-1">
                  <p className="text-xs text-muted-foreground mb-0.5 flex items-center gap-1">
                    <Wrench className="h-3 w-3" />
                    Service
                  </p>
                  <div className="flex flex-wrap items-center gap-1.5">
                    <Badge
                      variant="outline"
                      className={`text-[11px] ${getServiceTypeBadgeClass(service.service_type)}`}
                    >
                      {getServiceTypeLabel(service.service_type)}
                    </Badge>
                    <Badge
                      variant="secondary"
                      className="text-[11px]"
                    >
                      {getServiceModeLabel(service.service_mode)}
                    </Badge>
                    {service.stall && (
                      <Badge
                        variant="outline"
                        className="text-[11px]"
                      >
                        {typeof service.stall === "object" &&
                        "name" in service.stall
                          ? (service.stall as { name: string }).name
                          : `Stall #${service.stall}`}
                      </Badge>
                    )}
                  </div>
                </div>

                {/* Technicians — inline in overview */}
                {service.technician_assignments &&
                  service.technician_assignments.length > 0 && (
                    <div className="col-span-2">
                      <p className="text-xs text-muted-foreground mb-0.5 flex items-center gap-1">
                        <User className="h-3 w-3" />
                        Technicians
                      </p>
                      <div className="flex flex-wrap gap-1">
                        {service.technician_assignments.map(
                          (assignment, index) => (
                            <Badge
                              key={index}
                              variant="secondary"
                              className="text-[11px]"
                            >
                              {assignment.technician_name ||
                                `Tech #${assignment.technician}`}
                            </Badge>
                          ),
                        )}
                      </div>
                    </div>
                  )}

                {/* Address (non carry-in) */}
                {!isCarryIn &&
                  (service.override_address || service.client?.address) && (
                    <div className="col-span-2">
                      <p className="text-xs text-muted-foreground mb-0.5 flex items-center gap-1">
                        <MapPin className="h-3 w-3" />
                        Address
                      </p>
                      <p className="text-sm">
                        {service.override_address || service.client?.address}
                      </p>
                    </div>
                  )}

                {/* Schedule dates */}
                {service.service_mode === "pull_out" && service.pickup_date && (
                  <div>
                    <p className="text-xs text-muted-foreground mb-0.5 flex items-center gap-1">
                      <Truck className="h-3 w-3" />
                      Pickup
                    </p>
                    <p className="text-sm">
                      {formatDate(new Date(service.pickup_date), "PPp")}
                    </p>
                  </div>
                )}
                {service.service_mode === "pull_out" &&
                  service.delivery_date && (
                    <div>
                      <p className="text-xs text-muted-foreground mb-0.5 flex items-center gap-1">
                        <Truck className="h-3 w-3" />
                        Delivery
                      </p>
                      <p className="text-sm">
                        {formatDate(new Date(service.delivery_date), "PPp")}
                      </p>
                    </div>
                  )}
                {service.service_mode === "home_service" &&
                  schedules.length > 0 &&
                  schedules[0].scheduled_date && (
                    <div>
                      <p className="text-xs text-muted-foreground mb-0.5 flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        Scheduled
                      </p>
                      <p className="text-sm">
                        {formatDate(
                          new Date(schedules[0].scheduled_date),
                          "PPp",
                        )}
                      </p>
                    </div>
                  )}

                {/* Created date */}
                <div>
                  <p className="text-xs text-muted-foreground mb-0.5 flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    Created
                  </p>
                  <p className="text-sm">
                    {formatDate(new Date(service.created_at), "PP")}
                  </p>
                </div>

                {/* Service override contact */}
                {!isCarryIn && service.override_contact_person && (
                  <div>
                    <p className="text-xs text-muted-foreground mb-0.5 flex items-center gap-1">
                      <User className="h-3 w-3" />
                      Contact Person
                    </p>
                    <p className="text-sm">
                      {service.override_contact_person}
                      {service.override_contact_number && (
                        <span className="text-muted-foreground">
                          {" "}
                          · {service.override_contact_number}
                        </span>
                      )}
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Appliances Breakdown */}
          {service.appliances && service.appliances.length > 0 && (
            <div className="rounded-lg border bg-card px-4 py-3">
              <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground mb-2 flex items-center gap-1.5">
                <Package className="h-3.5 w-3.5" />
                Appliances & Charges
              </p>
              <div className="space-y-2">
                {service.appliances.map((appliance) => {
                  const laborFee = parseFloat(appliance.labor_fee || "0")
                  const discountedLaborFee = parseFloat(
                    appliance.discounted_labor_fee ||
                      appliance.labor_fee ||
                      "0",
                  )
                  const hasLaborDiscount =
                    appliance.labor_discount_amount &&
                    parseFloat(appliance.labor_discount_amount) > 0 &&
                    !appliance.labor_is_free

                  const partsCost = parseFloat(
                    appliance.total_parts_cost || "0",
                  )
                  const partsOriginalCost = appliance.items_used
                    ? appliance.items_used.reduce(
                        (sum, part) =>
                          sum +
                          parseFloat(part.item_price || "0") * part.quantity,
                        0,
                      )
                    : 0
                  const hasPartsDiscount = partsOriginalCost > partsCost

                  // Find the installation unit linked to this appliance (by serial number)
                  const linkedUnit =
                    service.service_type === "installation" &&
                    service.installation_units &&
                    appliance.serial_number
                      ? service.installation_units.find(
                          (u) => u.serial_number === appliance.serial_number,
                        )
                      : null
                  const applianceUnitPrice = linkedUnit
                    ? appliance.unit_price
                      ? parseFloat(appliance.unit_price)
                      : parseFloat(
                          linkedUnit.sale_price ||
                            linkedUnit.model?.selling_price ||
                            linkedUnit.model?.retail_price ||
                            "0",
                        )
                    : appliance.unit_price
                      ? parseFloat(appliance.unit_price)
                      : 0

                  const applianceTotal =
                    discountedLaborFee + partsCost + applianceUnitPrice

                  return (
                    <div
                      key={appliance.id}
                      className="rounded-lg border p-3 space-y-2"
                    >
                      <div className="flex items-start justify-between">
                        <div>
                          <p className="font-medium text-sm">
                            {appliance.appliance_type?.name ||
                              (appliance.brand && appliance.model
                                ? `${appliance.brand} ${appliance.model}`
                                : "Unknown Appliance")}
                          </p>
                          {appliance.appliance_type?.name &&
                            (appliance.brand || appliance.model) && (
                              <p className="text-xs text-muted-foreground">
                                {[appliance.brand, appliance.model]
                                  .filter(Boolean)
                                  .join(" ")}
                              </p>
                            )}
                          {appliance.serial_number && (
                            <p className="text-xs text-muted-foreground">
                              SN: {appliance.serial_number}
                            </p>
                          )}
                        </div>
                        <Badge variant={getBadgeVariant(appliance.status)}>
                          {applianceStatusLabels[appliance.status] ||
                            appliance.status}
                        </Badge>
                      </div>

                      <Separator />

                      <div className="space-y-1 text-sm">
                        <div className="flex justify-between items-center">
                          <span className="text-muted-foreground">
                            Labor Fee
                            {appliance.auto_adjust_labor && (
                              <span
                                className="text-xs ml-1 text-blue-500"
                                title="Auto-adjusted: labor = total fee − parts"
                              >
                                (auto)
                              </span>
                            )}
                          </span>
                          {appliance.labor_is_free ? (
                            <Badge
                              variant="success"
                              className="text-xs"
                            >
                              FREE
                            </Badge>
                          ) : (
                            <div className="flex flex-col items-end gap-0.5">
                              {hasLaborDiscount && (
                                <div className="flex items-center gap-1.5">
                                  <span className="text-xs line-through text-muted-foreground">
                                    {formatCurrency(laborFee)}
                                  </span>
                                  <Badge
                                    variant="outline"
                                    className="text-success border-green-600 text-xs px-1.5 py-0"
                                  >
                                    ₱{appliance.labor_discount_amount} off
                                  </Badge>
                                </div>
                              )}
                              <span className="font-medium">
                                {formatCurrency(discountedLaborFee)}
                              </span>
                            </div>
                          )}
                        </div>
                        {appliance.auto_adjust_labor &&
                          appliance.total_service_fee && (
                            <div className="flex justify-between items-center text-xs text-blue-600">
                              <span>Total Quoted Fee</span>
                              <span>
                                {formatCurrency(
                                  parseFloat(appliance.total_service_fee),
                                )}
                              </span>
                            </div>
                          )}
                        {appliance.items_used &&
                          appliance.items_used.length > 0 && (
                            <>
                              <div className="flex justify-between items-center">
                                <span className="text-muted-foreground flex items-center gap-1.5">
                                  Parts
                                  <Badge
                                    variant="secondary"
                                    className="h-4 min-w-4 px-1 text-[10px] rounded-full"
                                  >
                                    {appliance.items_used.length}
                                  </Badge>
                                </span>
                                <div className="flex flex-col items-end gap-0.5">
                                  {hasPartsDiscount && (
                                    <div className="flex items-center gap-1.5">
                                      <span className="text-xs line-through text-muted-foreground">
                                        {formatCurrency(partsOriginalCost)}
                                      </span>
                                      <Badge
                                        variant="outline"
                                        className="text-success border-green-600 text-xs px-1.5 py-0"
                                      >
                                        {formatCurrency(
                                          partsOriginalCost - partsCost,
                                        )}
                                      </Badge>
                                    </div>
                                  )}
                                  <span className="font-medium">
                                    {formatCurrency(partsCost)}
                                  </span>
                                </div>
                              </div>
                              {/* Show parts details */}
                              <div className="ml-4 mt-1 space-y-1 text-xs">
                                {appliance.items_used.map((part) => {
                                  const partHasDiscount =
                                    part.discount_amount &&
                                    parseFloat(part.discount_amount) > 0
                                  return (
                                    <div
                                      key={part.id}
                                      className="flex justify-between items-center text-muted-foreground"
                                    >
                                      <div className="flex items-center gap-1.5">
                                        <span>
                                          • {part.item_name} (x{part.quantity})
                                        </span>
                                        {part.is_free ? (
                                          <Badge
                                            variant="success"
                                            className="text-xs"
                                          >
                                            FREE
                                          </Badge>
                                        ) : (
                                          partHasDiscount && (
                                            <Badge
                                              variant="outline"
                                              className="text-success border-green-600 text-xs px-1 py-0"
                                            >
                                              ₱{part.discount_amount} off
                                            </Badge>
                                          )
                                        )}
                                      </div>
                                      <div className="flex flex-col items-end">
                                        {!part.is_free && partHasDiscount && (
                                          <span className="text-xs line-through">
                                            {formatCurrency(
                                              parseFloat(
                                                part.item_price || "0",
                                              ) * part.quantity,
                                            )}
                                          </span>
                                        )}
                                        <span>
                                          {formatCurrency(part.line_total)}
                                        </span>
                                      </div>
                                    </div>
                                  )
                                })}
                              </div>
                            </>
                          )}
                        {/* Show unit price for this appliance */}
                        {applianceUnitPrice > 0 && (
                          <div className="flex justify-between items-center">
                            <span className="text-muted-foreground">
                              Unit Price
                              {linkedUnit?.model
                                ? ` (${linkedUnit.model.brand?.name || ""} ${linkedUnit.model.name || ""})`
                                : ""}
                            </span>
                            <span className="font-medium">
                              {formatCurrency(applianceUnitPrice)}
                            </span>
                          </div>
                        )}
                        <Separator />
                        <div className="flex justify-between font-semibold">
                          <span>Subtotal</span>
                          <span>{formatCurrency(applianceTotal)}</span>
                        </div>
                      </div>

                      {/* Per-appliance claiming / acquisition status & actions */}
                      {(appliance.claimed_at || appliance.is_forfeited || (isCompleted && canManage && (isUnclaimedMode || service.status !== "cancelled"))) && (
                        <>
                          <Separator />
                          <div className="flex items-center justify-between flex-wrap gap-2">
                            {/* Status badges */}
                            <div className="flex flex-wrap gap-1.5">
                              {appliance.claimed_at && (
                                <Badge variant="outline" className="text-[11px] border-green-500 text-green-700 dark:text-green-400 bg-green-50 dark:bg-green-950/30">
                                  <CheckCircle className="mr-1 h-3 w-3" />
                                  Claimed {formatDate(new Date(appliance.claimed_at), "PP")}
                                </Badge>
                              )}
                              {appliance.is_forfeited && appliance.forfeiture_type === "client_sold" && (
                                <Badge variant="outline" className="text-[11px] border-blue-500 text-blue-700 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/30">
                                  <Wallet className="mr-1 h-3 w-3" />
                                  Acquired{appliance.acquisition_price ? ` @ ${formatCurrency(parseFloat(appliance.acquisition_price))}` : ""}
                                </Badge>
                              )}
                              {appliance.is_forfeited && appliance.forfeiture_type !== "client_sold" && (
                                <Badge variant="outline" className="text-[11px] border-red-500 text-red-700 dark:text-red-400 bg-red-50 dark:bg-red-950/30">
                                  <AlertTriangle className="mr-1 h-3 w-3" />
                                  Forfeited
                                </Badge>
                              )}
                            </div>

                            {/* Action buttons — only when not yet resolved and user can manage */}
                            {!appliance.claimed_at && !appliance.is_forfeited && canManage && (
                              <div className="flex flex-wrap gap-1.5">
                                {isCompleted && isUnclaimedMode && (
                                  <Tooltip>
                                    <TooltipTrigger asChild>
                                      <Button
                                        variant="success"
                                        size="sm"
                                        className="h-6 px-2 text-xs"
                                        onClick={() => setClaimingApplianceId(appliance.id)}
                                      >
                                        <Truck className="mr-1 h-3 w-3" />
                                        Mark Claimed
                                      </Button>
                                    </TooltipTrigger>
                                    <TooltipContent>Client collected this appliance</TooltipContent>
                                  </Tooltip>
                                )}
                                {isCompleted && isUnclaimedMode && (
                                  <Tooltip>
                                    <TooltipTrigger asChild>
                                      <Button
                                        variant="warning"
                                        size="sm"
                                        className="h-6 px-2 text-xs"
                                        onClick={() => {
                                          setForfeitingApplianceNotes("")
                                          setForfeitingApplianceId(appliance.id)
                                        }}
                                      >
                                        <AlertTriangle className="mr-1 h-3 w-3" />
                                        Forfeit
                                      </Button>
                                    </TooltipTrigger>
                                    <TooltipContent>Declare as company property (unclaimed)</TooltipContent>
                                  </Tooltip>
                                )}
                                {service.status !== "cancelled" && (
                                  <Tooltip>
                                    <TooltipTrigger asChild>
                                      <Button
                                        variant="outline"
                                        size="sm"
                                        className="h-6 px-2 text-xs border-blue-500 text-blue-700 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950/30"
                                        onClick={() => {
                                          setAcquiringAppliancePrice("")
                                          setAcquiringApplianceNotes("")
                                          setAcquiringApplianceId(appliance.id)
                                        }}
                                      >
                                        <Wallet className="mr-1 h-3 w-3" />
                                        Acquire
                                      </Button>
                                    </TooltipTrigger>
                                    <TooltipContent>Client sells this appliance to company</TooltipContent>
                                  </Tooltip>
                                )}
                              </div>
                            )}
                          </div>
                        </>
                      )}
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {/* Financial Summary */}
          <div className="rounded-lg border bg-card">
            <div className="px-4 py-3 space-y-2">
              <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                <Wallet className="h-3.5 w-3.5" />
                Financial Summary
              </p>
              {/* Show service-level discount if exists */}
              {service.service_discount_amount &&
                parseFloat(service.service_discount_amount) > 0 && (
                  <>
                    <div className="flex items-center justify-between text-sm">
                      <p className="text-muted-foreground">Original Amount</p>
                      <p className="line-through">
                        {(() => {
                          // Calculate subtotal from appliances (before service discount)
                          const appliancesSubtotal =
                            service.appliances?.reduce((total, appliance) => {
                              const laborFee = parseFloat(
                                appliance.discounted_labor_fee ||
                                  appliance.labor_fee ||
                                  "0",
                              )
                              const partsCost = parseFloat(
                                appliance.total_parts_cost || "0",
                              )
                              // Per-appliance unit price (brand_new linked by serial or second-hand)
                              const linkedUnit =
                                service.service_type === "installation" &&
                                service.installation_units &&
                                appliance.serial_number
                                  ? service.installation_units.find(
                                      (u) =>
                                        u.serial_number ===
                                        appliance.serial_number,
                                    )
                                  : null
                              const unitPrice = linkedUnit
                                ? appliance.unit_price
                                  ? parseFloat(appliance.unit_price)
                                  : parseFloat(
                                      linkedUnit.sale_price ||
                                        linkedUnit.model?.selling_price ||
                                        linkedUnit.model?.retail_price ||
                                        "0",
                                    )
                                : appliance.unit_price
                                  ? parseFloat(appliance.unit_price)
                                  : 0
                              return total + laborFee + partsCost + unitPrice
                            }, 0) || 0

                          return formatCurrency(appliancesSubtotal)
                        })()}
                      </p>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <p className="text-muted-foreground">Service Discount</p>
                      <div className="flex items-center gap-2">
                        <Badge
                          variant="outline"
                          className="text-success border-green-600"
                        >
                          ₱{service.service_discount_amount} off
                        </Badge>
                        <p className="text-success font-medium">
                          -
                          {formatCurrency(
                            parseFloat(service.service_discount_amount || "0"),
                          )}
                        </p>
                      </div>
                    </div>
                    <Separator />
                  </>
                )}
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium text-muted-foreground">
                  Total Revenue
                </p>
                <p className="text-lg font-bold">
                  {formatCurrency(parseFloat(service.total_revenue || "0"))}
                </p>
              </div>
              <Separator />
              <div className="flex items-center justify-between text-sm">
                <p className="text-muted-foreground">Main Stall</p>
                <p>
                  {formatCurrency(
                    parseFloat(service.main_stall_revenue || "0"),
                  )}
                </p>
              </div>
              <div className="flex items-center justify-between text-sm">
                <p className="text-muted-foreground">Sub Stall</p>
                <p>
                  {formatCurrency(parseFloat(service.sub_stall_revenue || "0"))}
                </p>
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium text-muted-foreground">
                  Payment Status
                </p>
                <Badge variant={getBadgeVariant(service.payment_status)}>
                  {paymentStatusLabels[service.payment_status] ||
                    service.payment_status}
                </Badge>
              </div>
              {service.total_paid && (
                <div className="flex items-center justify-between text-sm">
                  <p className="text-muted-foreground">Paid</p>
                  <p className="font-medium text-success">
                    {formatCurrency(
                      parseFloat(service.total_paid || "0") -
                        parseFloat(service.total_refunded || "0"),
                    )}
                  </p>
                </div>
              )}
              <Separator />
              {(() => {
                const balanceDue = parseFloat(service.balance_due || "0")
                return (
                  <>
                    <div className="flex items-center justify-between text-sm">
                      <p className="text-muted-foreground">Balance Due</p>
                      <p
                        className={`font-medium ${balanceDue < 0 ? "text-orange-600" : "text-destructive"}`}
                      >
                        {formatCurrency(balanceDue)}
                      </p>
                    </div>
                    {balanceDue < 0 && <OverPaymentWarning />}
                  </>
                )
              })()}
              <Separator />
              {/* Receipts — one per payment/partial payment */}
              <div className="space-y-3 rounded-2xl border bg-muted/20 p-4">
                <div className="flex items-center justify-between gap-2">
                  <p className="text-sm font-semibold">Receipts</p>
                  {!showAddReceiptForm && editingReceiptId === null && (
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-7 gap-1 text-xs"
                      onClick={() => {
                        setReceiptDraft(emptyReceiptDraft)
                        setShowAddReceiptForm(true)
                      }}
                    >
                      <Plus className="h-3.5 w-3.5" />
                      Add Receipt
                    </Button>
                  )}
                </div>

                {/* Existing receipt cards */}
                {(service.receipts ?? []).length === 0 &&
                  !showAddReceiptForm && (
                    <p className="text-center text-xs text-muted-foreground py-3">
                      No receipts recorded yet.
                    </p>
                  )}

                {(service.receipts ?? []).map((receipt: ServiceReceipt) =>
                  editingReceiptId === receipt.id ? (
                    /* ── Inline edit form ── */
                    <div
                      key={receipt.id}
                      className="space-y-3 rounded-xl border bg-background/80 p-3"
                    >
                      <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                        Edit Receipt
                      </p>
                      <CardSelect
                        columns={2}
                        options={[
                          {
                            label: "Official Receipt",
                            value: "or",
                            icon: Wallet,
                          },
                          {
                            label: "Sales Invoice",
                            value: "si",
                            icon: Package,
                          },
                        ]}
                        value={receiptDraft.document_type}
                        onChange={(v) =>
                          setReceiptDraft((d) => ({
                            ...d,
                            document_type: v as "or" | "si",
                            with_2307: v === "si" ? false : d.with_2307,
                          }))
                        }
                        disabled={updateReceipt.isPending}
                      />
                      <div className="grid gap-2 sm:grid-cols-2">
                        <div className="space-y-1">
                          <Label className="text-xs">
                            {receiptDraft.document_type === "or"
                              ? "OR Number"
                              : "SI Number"}
                          </Label>
                          <Input
                            value={receiptDraft.receipt_number}
                            onChange={(e) =>
                              setReceiptDraft((d) => ({
                                ...d,
                                receipt_number: e.target.value,
                              }))
                            }
                            placeholder={
                              receiptDraft.document_type === "or"
                                ? "e.g. OR-0001"
                                : "e.g. SI-0001"
                            }
                            className="h-8 text-sm"
                          />
                        </div>
                        <div className="space-y-1">
                          <Label className="text-xs">Book #</Label>
                          <Input
                            value={receiptDraft.receipt_book}
                            onChange={(e) =>
                              setReceiptDraft((d) => ({
                                ...d,
                                receipt_book: e.target.value,
                              }))
                            }
                            placeholder="e.g. 1"
                            className="h-8 text-sm"
                          />
                        </div>
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs">Amount (optional)</Label>
                        <Input
                          type="number"
                          value={receiptDraft.amount}
                          onChange={(e) =>
                            setReceiptDraft((d) => ({
                              ...d,
                              amount: e.target.value,
                            }))
                          }
                          placeholder="Leave blank to use total revenue"
                          className="h-8 text-sm"
                        />
                      </div>
                      {receiptDraft.document_type === "or" && (
                        <div className="flex items-center gap-2">
                          <Checkbox
                            id={`edit-2307-${receipt.id}`}
                            checked={receiptDraft.with_2307}
                            onCheckedChange={(v) =>
                              setReceiptDraft((d) => ({
                                ...d,
                                with_2307: v === true,
                              }))
                            }
                            disabled={updateReceipt.isPending}
                          />
                          <Label
                            htmlFor={`edit-2307-${receipt.id}`}
                            className="cursor-pointer text-sm"
                          >
                            With BIR Form 2307
                          </Label>
                        </div>
                      )}
                      <div className="flex justify-end gap-1.5">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => setEditingReceiptId(null)}
                        >
                          Cancel
                        </Button>
                        <Button
                          size="sm"
                          disabled={updateReceipt.isPending}
                          onClick={() => {
                            updateReceipt.mutate(
                              {
                                id: receipt.id,
                                data: {
                                  service: service.id,
                                  document_type: receiptDraft.document_type,
                                  receipt_number:
                                    receiptDraft.receipt_number || null,
                                  receipt_book:
                                    receiptDraft.receipt_book || null,
                                  with_2307: receiptDraft.with_2307,
                                  amount: receiptDraft.amount || null,
                                },
                              },
                              {
                                onSuccess: () => {
                                  setEditingReceiptId(null)
                                  onRefresh?.()
                                },
                              },
                            )
                          }}
                        >
                          <CheckCircle className="mr-1.5 h-3.5 w-3.5" />
                          Save
                        </Button>
                      </div>
                    </div>
                  ) : (
                    /* ── Receipt display card ── */
                    <div
                      key={receipt.id}
                      className="flex items-start justify-between gap-2 rounded-xl border bg-background/80 px-3 py-2.5"
                    >
                      <div className="min-w-0 space-y-0.5">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <Badge
                            variant={
                              receipt.document_type === "or"
                                ? "default"
                                : "secondary"
                            }
                            className="text-xs shrink-0"
                          >
                            {receipt.document_type === "or"
                              ? "Official Receipt"
                              : "Sales Invoice"}
                          </Badge>
                          {receipt.with_2307 && (
                            <Badge
                              variant="outline"
                              className="text-xs border-blue-500 text-blue-600 shrink-0"
                            >
                              2307
                            </Badge>
                          )}
                        </div>
                        <p className="text-sm font-medium">
                          {receipt.receipt_number || (
                            <span className="text-muted-foreground italic">
                              No receipt #
                            </span>
                          )}
                        </p>
                        {receipt.receipt_book && (
                          <p className="text-xs text-muted-foreground">
                            Book #{receipt.receipt_book}
                          </p>
                        )}
                        {receipt.amount && (
                          <p className="text-xs text-muted-foreground">
                            {formatCurrency(parseFloat(receipt.amount))}
                          </p>
                        )}
                      </div>
                      <div className="flex items-center gap-1 shrink-0">
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-7 w-7"
                          onClick={() => {
                            setReceiptDraft({
                              document_type: receipt.document_type,
                              receipt_number: receipt.receipt_number ?? "",
                              receipt_book: receipt.receipt_book ?? "",
                              with_2307: receipt.with_2307,
                              amount: receipt.amount ?? "",
                            })
                            setEditingReceiptId(receipt.id)
                            setShowAddReceiptForm(false)
                          }}
                        >
                          <PenLine className="h-3.5 w-3.5" />
                        </Button>
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-7 w-7 text-destructive hover:text-destructive"
                          disabled={deleteReceipt.isPending}
                          onClick={() =>
                            deleteReceipt.mutate(
                              { id: receipt.id, serviceId: service.id },
                              { onSuccess: () => onRefresh?.() },
                            )
                          }
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </div>
                  ),
                )}

                {/* Add receipt inline form */}
                {showAddReceiptForm && (
                  <div className="space-y-3 rounded-xl border bg-background/80 p-3">
                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                      New Receipt
                    </p>
                    <CardSelect
                      columns={2}
                      options={[
                        {
                          label: "Official Receipt",
                          value: "or",
                          icon: Wallet,
                        },
                        { label: "Sales Invoice", value: "si", icon: Package },
                      ]}
                      value={receiptDraft.document_type}
                      onChange={(v) =>
                        setReceiptDraft((d) => ({
                          ...d,
                          document_type: v as "or" | "si",
                          with_2307: v === "si" ? false : d.with_2307,
                        }))
                      }
                      disabled={addReceipt.isPending}
                    />
                    <div className="grid gap-2 sm:grid-cols-2">
                      <div className="space-y-1">
                        <Label className="text-xs">
                          {receiptDraft.document_type === "or"
                            ? "OR Number"
                            : "SI Number"}
                        </Label>
                        <Input
                          value={receiptDraft.receipt_number}
                          onChange={(e) =>
                            setReceiptDraft((d) => ({
                              ...d,
                              receipt_number: e.target.value,
                            }))
                          }
                          placeholder={
                            receiptDraft.document_type === "or"
                              ? "e.g. OR-0001"
                              : "e.g. SI-0001"
                          }
                          className="h-8 text-sm"
                          autoFocus
                        />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs">Book #</Label>
                        <Input
                          value={receiptDraft.receipt_book}
                          onChange={(e) =>
                            setReceiptDraft((d) => ({
                              ...d,
                              receipt_book: e.target.value,
                            }))
                          }
                          placeholder="e.g. 1"
                          className="h-8 text-sm"
                        />
                      </div>
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs">Amount (optional)</Label>
                      <Input
                        type="number"
                        value={receiptDraft.amount}
                        onChange={(e) =>
                          setReceiptDraft((d) => ({
                            ...d,
                            amount: e.target.value,
                          }))
                        }
                        placeholder="Leave blank to use total revenue"
                        className="h-8 text-sm"
                      />
                    </div>
                    {receiptDraft.document_type === "or" && (
                      <div className="flex items-center gap-2">
                        <Checkbox
                          id="new-receipt-2307"
                          checked={receiptDraft.with_2307}
                          onCheckedChange={(v) =>
                            setReceiptDraft((d) => ({
                              ...d,
                              with_2307: v === true,
                            }))
                          }
                          disabled={addReceipt.isPending}
                        />
                        <Label
                          htmlFor="new-receipt-2307"
                          className="cursor-pointer text-sm"
                        >
                          With BIR Form 2307
                        </Label>
                      </div>
                    )}
                    <div className="flex justify-end gap-1.5">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => {
                          setShowAddReceiptForm(false)
                          setReceiptDraft(emptyReceiptDraft)
                        }}
                      >
                        Cancel
                      </Button>
                      <Button
                        size="sm"
                        disabled={addReceipt.isPending}
                        onClick={() => {
                          addReceipt.mutate(
                            {
                              service: service.id,
                              document_type: receiptDraft.document_type,
                              receipt_number:
                                receiptDraft.receipt_number || null,
                              receipt_book: receiptDraft.receipt_book || null,
                              with_2307: receiptDraft.with_2307,
                              amount: receiptDraft.amount || null,
                            },
                            {
                              onSuccess: () => {
                                setShowAddReceiptForm(false)
                                setReceiptDraft(emptyReceiptDraft)
                                onRefresh?.()
                              },
                            },
                          )
                        }}
                      >
                        <Plus className="mr-1.5 h-3.5 w-3.5" />
                        Add
                      </Button>
                    </div>
                  </div>
                )}
              </div>
              {isAdmin && (
                <div className="space-y-1.5">
                  <p className="text-sm font-medium text-muted-foreground">
                    Transaction Date
                  </p>
                  <Popover
                    open={transactionDateOpen}
                    onOpenChange={setTransactionDateOpen}
                  >
                    <PopoverTrigger asChild>
                      <button
                        type="button"
                        className="flex w-full items-center gap-2 rounded-lg border border-dashed px-3 py-2 text-sm transition-colors hover:border-primary/50 hover:bg-muted/50 cursor-pointer group"
                      >
                        <CalendarIcon className="h-3.5 w-3.5 text-muted-foreground group-hover:text-primary shrink-0" />
                        {service.transaction_date ? (
                          <span className="font-medium">
                            {format(
                              new Date(service.transaction_date + "T12:00:00"),
                              "PPP",
                            )}
                          </span>
                        ) : (
                          <span className="text-muted-foreground">
                            Set transaction date (for backdating)
                          </span>
                        )}
                      </button>
                    </PopoverTrigger>
                    <PopoverContent
                      className="w-auto p-0"
                      align="start"
                    >
                      <CalendarWidget
                        mode="single"
                        selected={
                          service.transaction_date
                            ? new Date(service.transaction_date + "T12:00:00")
                            : undefined
                        }
                        onSelect={(date) => {
                          if (date) {
                            const yyyy = date.getFullYear()
                            const mm = String(date.getMonth() + 1).padStart(
                              2,
                              "0",
                            )
                            const dd = String(date.getDate()).padStart(2, "0")
                            const dateStr = `${yyyy}-${mm}-${dd}`
                            updateService.mutate(
                              {
                                id: service.id,
                                data: { transaction_date: dateStr },
                              },
                              {
                                onSuccess: () => {
                                  setTransactionDateOpen(false)
                                  onRefresh?.()
                                  toast.success("Transaction date updated.")
                                },
                              },
                            )
                          } else {
                            updateService.mutate(
                              {
                                id: service.id,
                                data: { transaction_date: null },
                              },
                              {
                                onSuccess: () => {
                                  setTransactionDateOpen(false)
                                  onRefresh?.()
                                  toast.success("Transaction date cleared.")
                                },
                              },
                            )
                          }
                        }}
                        className="rounded-lg border"
                        weekStartsOn={1}
                      />
                      {service.transaction_date && (
                        <div className="border-t p-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="w-full text-xs text-muted-foreground"
                            onClick={() => {
                              updateService.mutate(
                                {
                                  id: service.id,
                                  data: { transaction_date: null },
                                },
                                {
                                  onSuccess: () => {
                                    setTransactionDateOpen(false)
                                    onRefresh?.()
                                    toast.success("Transaction date cleared.")
                                  },
                                },
                              )
                            }}
                          >
                            Clear date
                          </Button>
                        </div>
                      )}
                    </PopoverContent>
                  </Popover>
                </div>
              )}
            </div>
          </div>
        </TabsContent>

        {/* Appliances/Units Tab */}
        <TabsContent
          value="appliances"
          className="space-y-4"
        >
          {/* View toggle + kanban board */}
          {canManage && service.appliances && service.appliances.length > 0 && (
            <div className="flex items-center justify-end gap-0.5">
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    aria-label="List view"
                    onClick={() => setApplianceView("list")}
                    variant={applianceView === "list" ? "default" : "ghost"}
                    size="sm"
                    className="h-7 w-7 p-0"
                  >
                    <List className="h-3.5 w-3.5" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>List view</TooltipContent>
              </Tooltip>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    aria-label="Kanban board view"
                    variant={applianceView === "kanban" ? "default" : "ghost"}
                    onClick={() => setApplianceView("kanban")}
                    size="sm"
                    className="h-7 w-7 p-0"
                  >
                    <Kanban className="h-3.5 w-3.5" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Kanban board</TooltipContent>
              </Tooltip>
            </div>
          )}

          {applianceView === "kanban" &&
            service.appliances &&
            service.appliances.length > 0 && (
              <ApplianceKanbanBoard
                appliances={service.appliances}
                onStatusChange={(appliance, newStatus) => {
                  updateAppliance.mutate(
                    {
                      id: appliance.id,
                      // PATCH only sends these fields; cast needed since mutation type expects full payload
                      data: {
                        status: newStatus,
                        service: service.id,
                      } as Parameters<typeof updateAppliance.mutate>[0]["data"],
                    },
                    {
                      onSuccess: () => {
                        onRefresh?.()
                      },
                    },
                  )
                }}
                isUpdating={updateAppliance.isPending}
              />
            )}

          {applianceView === "list" && (
            <ServiceApplianceManager
              serviceId={service.id}
              serviceType={service.service_type}
              appliances={service.appliances || []}
              installationUnits={service.installation_units || []}
              serviceTechnicians={
                service.technician_assignments
                  ?.filter((ta) => !ta.appliance)
                  .map((ta) => ta.technician) || []
              }
              onUpdate={onRefresh}
              disabled={isCompleted || !canManage}
              canManageParts={!isCompleted}
            />
          )}

          {/* Service-Level Parts Needed Notes & Confirmation */}
          <ServicePartsReview
            service={service}
            canManage={canManage}
            role={role}
            isCompleted={isCompleted}
            updateService={updateService}
            toggleServiceItemsChecked={toggleServiceItemsChecked}
            onRefresh={onRefresh}
          />

          {/* Service-Level Parts (chipping, pre-installation materials) */}
          <PartsManager
            entityType="service"
            entityId={service.id}
            disabled={isCompleted}
            onUpdate={onRefresh}
          />

          {!isCompleted &&
            (!service.appliances || service.appliances.length === 0) && (
              <div className="rounded-lg border border-dashed p-8 text-center">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-muted mx-auto mb-3">
                  <Wrench className="h-5 w-5 text-muted-foreground" />
                </div>
                <p className="text-sm font-medium mb-1">
                  {service.service_type === "installation"
                    ? "No units added yet"
                    : "No appliances added yet"}
                </p>
                <p className="text-xs text-muted-foreground max-w-xs mx-auto">
                  {service.service_type === "installation"
                    ? "Add aircon units to track installation and generate charges."
                    : "Add appliances to track repairs and generate charges when completing this service."}
                </p>
              </div>
            )}
        </TabsContent>

        {/* Payments Tab */}
        <TabsContent
          value="payments"
          className="space-y-3"
        >
          {/* Payment Summary Strip with progress bar */}
          {(() => {
            const totalAmount = parseFloat(service.total_revenue || "0")
            const totalPaid = parseFloat(service.total_paid || "0")
            const totalRefunded = parseFloat(service.total_refunded || "0")
            const netPaid = totalPaid - totalRefunded
            const balanceDue = parseFloat(service.balance_due || "0")
            const paidPercent =
              totalAmount > 0
                ? Math.min(Math.max((netPaid / totalAmount) * 100, 0), 100)
                : 0

            return (
              <div className="rounded-lg border bg-card px-4 py-3 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div>
                      <p className="text-xs text-muted-foreground">Total</p>
                      <p className="text-sm font-semibold">
                        {formatCurrency(totalAmount)}
                      </p>
                    </div>
                    <Separator
                      orientation="vertical"
                      className="h-8"
                    />
                    <div>
                      <p className="text-xs text-muted-foreground">Paid</p>
                      <p className="text-sm font-semibold text-success">
                        {formatCurrency(netPaid)}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-muted-foreground">Balance Due</p>
                    <p
                      className={`text-base font-bold ${balanceDue < 0 ? "text-orange-600" : balanceDue === 0 ? "text-success" : "text-destructive"}`}
                    >
                      {formatCurrency(balanceDue)}
                    </p>
                  </div>
                </div>
                {/* Progress bar */}
                <div className="h-1.5 w-full rounded-full bg-muted overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all ${
                      paidPercent >= 100
                        ? "bg-green-500"
                        : paidPercent > 0
                          ? "bg-primary"
                          : "bg-muted"
                    }`}
                    style={{ width: `${paidPercent}%` }}
                  />
                </div>
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span>{Math.round(paidPercent)}% paid</span>
                  <Badge
                    variant={getBadgeVariant(service.payment_status)}
                    className="text-xs h-4 px-1.5"
                  >
                    {paymentStatusLabels[service.payment_status] ||
                      service.payment_status}
                  </Badge>
                </div>
                {balanceDue < 0 && <OverPaymentWarning />}
              </div>
            )
          })()}

          {/* Action Buttons — always visible at top */}
          {canManage && (
            <div className="flex gap-2">
              <Button
                className="flex-1"
                variant="outline"
                size="sm"
                onClick={handleAddPayment}
              >
                <Wallet className="mr-1.5 h-3.5 w-3.5" />
                Record Payment
              </Button>
              {parseFloat(service.total_paid || "0") > 0 &&
                parseFloat(service.total_paid || "0") >
                  parseFloat(service.total_refunded || "0") &&
                service.status === "completed" && (
                  <Button
                    className="flex-1"
                    variant="warning"
                    size="sm"
                    onClick={() => {
                      setRefundDialogOpen(true)
                      if (parseFloat(service.balance_due || "0") < 0) {
                        setRefundAmount(
                          Math.abs(
                            parseFloat(service.balance_due || "0"),
                          ).toString(),
                        )
                        setRefundType("partial")
                      } else {
                        const maxRefund =
                          parseFloat(service.total_paid || "0") -
                          parseFloat(service.total_refunded || "0")
                        setRefundAmount(maxRefund.toString())
                        setRefundType("full")
                      }
                    }}
                  >
                    <RotateCcw className="mr-1.5 h-3.5 w-3.5" />
                    Process Refund
                  </Button>
                )}
            </div>
          )}

          {/* Info Alert */}
          {!isCompleted && (
            <Alert variant="info">
              <Info className="h-4 w-4" />
              <AlertDescription>
                You can record down payments or partial payments anytime before
                completing the service.
              </AlertDescription>
            </Alert>
          )}

          {/* Transaction History */}
          <div>
            <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground mb-2 flex items-center gap-1.5">
              <Wallet className="h-3.5 w-3.5" />
              Transaction History
            </p>
            {(() => {
              // Merge payments and refunds into a single sorted list
              const transactions: {
                type: "payment" | "refund"
                amount: number
                date: string
                method: string
                notes?: string
                chequeNumber?: string
                refundType?: string
              }[] = []

              if (service.payments) {
                for (const p of service.payments) {
                  transactions.push({
                    type: "payment",
                    amount: parseFloat(p.amount.toString()),
                    date: p.created_at,
                    method: p.payment_type,
                    notes: p.notes,
                    chequeNumber: p.cheque_number ?? undefined,
                  })
                }
              }

              if (service.refunds) {
                for (const r of service.refunds) {
                  transactions.push({
                    type: "refund",
                    amount: parseFloat(r.refund_amount),
                    date: r.refund_date,
                    method: r.refund_method_display || r.refund_method,
                    notes: r.reason,
                    refundType: r.refund_type_display || r.refund_type,
                  })
                }
              }

              // Sort newest first
              transactions.sort(
                (a, b) =>
                  new Date(b.date).getTime() - new Date(a.date).getTime(),
              )

              if (transactions.length === 0) {
                return (
                  <div className="py-6 text-center rounded-lg border border-dashed">
                    <Wallet className="mx-auto mb-1.5 h-6 w-6 text-muted-foreground/50" />
                    <p className="text-xs text-muted-foreground">
                      No transactions yet
                    </p>
                  </div>
                )
              }

              return (
                <div className="space-y-1.5">
                  {transactions.map((tx, index) => {
                    const isRefund = tx.type === "refund"
                    return (
                      <div
                        key={index}
                        className={`flex items-center gap-3 rounded-md border px-3 py-2 ${
                          isRefund
                            ? "border-red-200 dark:border-red-900 bg-red-50 dark:bg-red-950/30"
                            : "bg-card"
                        }`}
                      >
                        <div
                          className={`flex h-7 w-7 items-center justify-center rounded-full shrink-0 ${
                            isRefund
                              ? "bg-red-100 dark:bg-red-950"
                              : "bg-green-100 dark:bg-green-950"
                          }`}
                        >
                          {isRefund ? (
                            <RotateCcw className="h-3.5 w-3.5 text-destructive" />
                          ) : (
                            <Wallet className="h-3.5 w-3.5 text-success" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span
                              className={`text-sm font-semibold ${
                                isRefund ? "text-destructive" : ""
                              }`}
                            >
                              {isRefund ? "-" : "+"}
                              {formatCurrency(tx.amount)}
                            </span>
                            <Badge
                              variant="outline"
                              className={`text-[10px] h-4 px-1.5 capitalize ${
                                isRefund
                                  ? "border-red-300 text-destructive"
                                  : ""
                              }`}
                            >
                              {tx.method}
                            </Badge>
                            {tx.chequeNumber && (
                              <Badge
                                variant="secondary"
                                className="text-[10px] h-4 px-1.5"
                              >
                                #{tx.chequeNumber}
                              </Badge>
                            )}
                            {tx.refundType && (
                              <Badge
                                variant="secondary"
                                className="text-[10px] h-4 px-1.5 capitalize"
                              >
                                {tx.refundType}
                              </Badge>
                            )}
                          </div>
                          {tx.notes && (
                            <p className="text-xs text-muted-foreground truncate">
                              {tx.notes}
                            </p>
                          )}
                        </div>
                        <div className="text-right shrink-0">
                          <p className="text-xs text-muted-foreground">
                            {formatDate(new Date(tx.date), "MMM d, yyyy")}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {formatDate(new Date(tx.date), "h:mm a")}
                          </p>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )
            })()}
          </div>

          {/* Service Discount */}
          {service.status !== "completed" &&
            service.status !== "cancelled" &&
            canManage && (
              <div className="rounded-lg border bg-card px-4 py-3 space-y-3">
                <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                  Service Discount
                </p>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <Label className="text-xs">Amount (₱)</Label>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Input
                          type="number"
                          min="0"
                          step="1"
                          value={discountValue}
                          onChange={(e) => setDiscountValue(e.target.value)}
                          placeholder="0"
                        />
                      </TooltipTrigger>
                      <TooltipContent>
                        Enter discount in peso amount
                      </TooltipContent>
                    </Tooltip>
                  </div>

                  <div className="space-y-1">
                    <Label className="text-xs">Reason</Label>
                    <Input
                      placeholder="Senior Citizen, Loyalty, Promo, etc."
                      value={discountReason}
                      onChange={(e) => setDiscountReason(e.target.value)}
                    />
                  </div>
                </div>

                {calculateDiscount() > 0 && (
                  <div className="flex justify-between pt-2 border-t">
                    <span className="text-sm font-medium">
                      Discount Applied:
                    </span>
                    <span className="text-sm font-medium text-success">
                      -{formatCurrency(calculateDiscount())}
                    </span>
                  </div>
                )}

                <Button
                  onClick={handleApplyDiscount}
                  disabled={
                    updateService.isPending ||
                    !discountValue ||
                    parseFloat(discountValue) <= 0
                  }
                  className="w-full"
                  size="sm"
                >
                  {updateService.isPending ? "Applying..." : "Apply Discount"}
                </Button>
              </div>
            )}

          {/* Display Applied Discount */}
          {service.service_discount_amount &&
            parseFloat(service.service_discount_amount.toString()) > 0 && (
              <div className="rounded-lg border border-green-200 dark:border-green-900 bg-green-50/50 dark:bg-green-950/20 px-4 py-3 space-y-1.5">
                <div className="flex items-center justify-between">
                  <p className="text-xs font-medium uppercase tracking-wider text-success flex items-center gap-1.5">
                    Applied Discount
                    <Badge
                      variant="success"
                      className="text-[10px] h-4 px-1.5"
                    >
                      Active
                    </Badge>
                  </p>
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-bold text-success">
                      -
                      {formatCurrency(
                        parseFloat(service.service_discount_amount.toString()),
                      )}
                    </p>
                    {service.status !== "completed" &&
                      service.status !== "cancelled" &&
                      canManage && (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6 text-muted-foreground hover:text-destructive"
                          onClick={() => {
                            updateService.mutate(
                              {
                                id: service.id,
                                data: {
                                  service_discount_amount: 0,
                                  service_discount_percentage: 0,
                                  discount_reason: "",
                                },
                              },
                              {
                                onSuccess: () => {
                                  setDiscountValue("")
                                  setDiscountReason("")
                                  toast.success("Discount removed")
                                },
                                onSettled: () => {
                                  onRefresh?.()
                                },
                              },
                            )
                          }}
                          disabled={updateService.isPending}
                        >
                          <XIcon className="h-3.5 w-3.5" />
                        </Button>
                      )}
                  </div>
                </div>
                <div className="flex items-center gap-3 text-xs text-muted-foreground">
                  <span>
                    {formatCurrency(
                      parseFloat(service.service_discount_amount.toString()),
                    )}{" "}
                    off
                  </span>
                  {service.discount_reason && (
                    <>
                      <span>·</span>
                      <span>{service.discount_reason}</span>
                    </>
                  )}
                </div>
                {(service.discount_applied_by_name ||
                  service.discount_applied_at) && (
                  <p className="text-[11px] text-muted-foreground">
                    {service.discount_applied_by_name && (
                      <span>{service.discount_applied_by_name}</span>
                    )}
                    {service.discount_applied_by_name &&
                      service.discount_applied_at && <span> · </span>}
                    {service.discount_applied_at && (
                      <span>
                        {format(
                          new Date(service.discount_applied_at),
                          "MMMM d, yyyy h:mma",
                        )}
                      </span>
                    )}
                  </p>
                )}
              </div>
            )}

          {/* Payment Summary — removed, now in summary strip above */}

          {/* Refund Info Section (non-completed services only) */}
          {canManage &&
            parseFloat(service.total_paid || "0") > 0 &&
            parseFloat(service.total_paid || "0") >
              parseFloat(service.total_refunded || "0") &&
            service.status !== "completed" && (
              <div className="rounded-lg border bg-card px-4 py-3 space-y-3">
                <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                  Process Refund
                  {parseFloat(service.balance_due || "0") < 0 && (
                    <Badge
                      variant="warning"
                      className="text-[10px] h-4 px-1.5"
                    >
                      Action Required
                    </Badge>
                  )}
                </p>
                <Alert variant="warning">
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription className="space-y-2">
                    <p className="font-semibold">
                      Refunds require service completion
                    </p>
                    {parseFloat(service.balance_due || "0") < 0 ? (
                      <>
                        <p>
                          The customer has an overpayment of{" "}
                          <strong>
                            {formatCurrency(
                              Math.abs(parseFloat(service.balance_due || "0")),
                            )}
                          </strong>{" "}
                          after applying discounts.
                        </p>
                        <div className="mt-3 p-3 bg-muted rounded-md space-y-2 text-sm">
                          <p className="font-medium">
                            To refund the overpayment:
                          </p>
                          <ol className="list-decimal list-inside space-y-1 ml-2">
                            <li>
                              Complete the service using the &quot;Complete
                              Service&quot; button above
                            </li>
                            <li>
                              Return to the Payments tab and click &quot;Process
                              Refund&quot;
                            </li>
                            <li>
                              The refund amount will be pre-filled with the
                              overpayment amount
                            </li>
                          </ol>
                        </div>
                      </>
                    ) : (
                      <p>
                        Refunds can only be processed after completing the
                        service.
                      </p>
                    )}
                  </AlertDescription>
                </Alert>

                {parseFloat(service.balance_due || "0") < 0 && (
                  <div className="flex items-center justify-between p-3 bg-orange-50 dark:bg-orange-950/20 border border-orange-200 dark:border-orange-900 rounded-md">
                    <span className="text-sm font-medium">
                      Overpayment Amount:
                    </span>
                    <span className="text-lg font-bold text-orange-600">
                      {formatCurrency(
                        Math.abs(parseFloat(service.balance_due || "0")),
                      )}
                    </span>
                  </div>
                )}
              </div>
            )}
        </TabsContent>

        {/* Schedule Tab */}
        <TabsContent
          value="schedule"
          className="space-y-3"
        >
          {/* Vertical timeline */}
          <div className="relative ml-2">
            {/* Timeline line */}
            <div className="absolute left-[8px] top-2 bottom-2 w-px bg-border/50" />

            {/* Created */}
            <div className="flex gap-3 pb-3">
              <div className="relative flex h-[18px] w-[18px] shrink-0 items-center justify-center rounded-full border-2 border-primary bg-primary/10 z-10">
                <div className="h-1.5 w-1.5 rounded-full bg-primary" />
              </div>
              <div className="pt-px">
                <p className="text-sm font-semibold leading-none">
                  Service Created
                </p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {formatDate(
                    new Date(service.created_at),
                    "EEEE, MMMM d, yyyy 'at' h:mm a",
                  )}
                </p>
              </div>
            </div>

            {/* Received At (Carry-In) */}
            {service.received_at && (
              <div className="flex gap-3 pb-3">
                <div className="relative flex h-[18px] w-[18px] shrink-0 items-center justify-center rounded-full border-2 border-green-500 bg-green-50 dark:bg-green-950 z-10">
                  <CheckCircle className="h-2.5 w-2.5 text-success" />
                </div>
                <div className="pt-px">
                  <p className="text-sm font-semibold leading-none">
                    Received At Shop
                  </p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {formatDate(
                      new Date(service.received_at),
                      "EEEE, MMMM d, yyyy 'at' h:mm a",
                    )}
                  </p>
                </div>
              </div>
            )}

            {/* Pickup Date (Pull-Out) */}
            {service.service_mode === "pull_out" && service.pickup_date && (
              <div className="flex gap-3 pb-3">
                <div className="relative flex h-[18px] w-[18px] shrink-0 items-center justify-center rounded-full border-2 border-blue-500 bg-blue-50 dark:bg-blue-950 z-10">
                  <Truck className="h-2.5 w-2.5 text-blue-500" />
                </div>
                <div className="pt-px">
                  <p className="text-sm font-semibold leading-none text-blue-700 dark:text-blue-300">
                    Scheduled Pickup
                  </p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {formatDate(
                      new Date(service.pickup_date),
                      "EEEE, MMMM d, yyyy 'at' h:mm a",
                    )}
                  </p>
                </div>
              </div>
            )}

            {/* Delivery Date (Pull-Out) */}
            {service.service_mode === "pull_out" && service.delivery_date && (
              <div className="flex gap-3 pb-3">
                <div className="relative flex h-[18px] w-[18px] shrink-0 items-center justify-center rounded-full border-2 border-green-500 bg-green-50 dark:bg-green-950 z-10">
                  <Truck className="h-2.5 w-2.5 text-success" />
                </div>
                <div className="pt-px">
                  <p className="text-sm font-semibold leading-none text-success">
                    Scheduled Delivery
                  </p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {formatDate(
                      new Date(service.delivery_date),
                      "EEEE, MMMM d, yyyy 'at' h:mm a",
                    )}
                  </p>
                </div>
              </div>
            )}

            {/* Schedules for Home Services */}
            {service.service_mode === "home_service" &&
              schedules.length > 0 &&
              schedules.map((schedule) => (
                <div
                  key={schedule.id}
                  className="flex gap-3 pb-3"
                >
                  <div className="relative flex h-[18px] w-[18px] shrink-0 items-center justify-center rounded-full border-2 border-primary bg-primary/10 z-10">
                    <Calendar className="h-2.5 w-2.5 text-primary" />
                  </div>
                  <div className="pt-px">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-semibold leading-none">
                        {formatDate(
                          new Date(schedule.scheduled_date),
                          "EEEE, MMMM d, yyyy",
                        )}
                      </p>
                      <Badge
                        variant="outline"
                        className="text-[10px] h-4 px-1.5"
                      >
                        {schedule.status}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-1 text-xs text-muted-foreground mt-0.5">
                      <Clock className="h-2.5 w-2.5" />
                      <span>{formatTimeTo12Hour(schedule.scheduled_time)}</span>
                    </div>
                    {schedule.technicians &&
                      schedule.technicians.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-1">
                          {schedule.technicians.map((tech) => (
                            <Badge
                              key={tech.id}
                              variant="secondary"
                              className="text-[10px] h-4 px-1.5"
                            >
                              {tech.full_name}
                            </Badge>
                          ))}
                        </div>
                      )}
                    {schedule.address && (
                      <div className="flex items-start gap-1 text-xs text-muted-foreground mt-1">
                        <MapPin className="h-3 w-3 shrink-0 mt-0.5" />
                        <span>{schedule.address}</span>
                      </div>
                    )}
                  </div>
                </div>
              ))}

            {/* Completion marker */}
            {isCompleted && (
              <div className="flex gap-3">
                <div className="relative flex h-[18px] w-[18px] shrink-0 items-center justify-center rounded-full border-2 border-green-500 bg-green-500 z-10">
                  <CheckCircle className="h-2.5 w-2.5 text-white" />
                </div>
                <div className="pt-px">
                  <p className="text-sm font-semibold leading-none text-success">
                    Service Completed
                  </p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {service.updated_at
                      ? formatDate(
                          new Date(service.updated_at),
                          "EEEE, MMMM d, yyyy 'at' h:mm a",
                        )
                      : "Completed"}
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Set Appointment — home_service with no schedules */}
          {service.service_mode === "home_service" &&
            !schedulesLoading &&
            schedules.length === 0 &&
            !isCompleted && (
              <div className="rounded-lg border border-dashed border-amber-300 dark:border-amber-700 bg-amber-50/50 dark:bg-amber-950/20 p-4 space-y-3">
                <div className="text-center space-y-1">
                  <Calendar className="mx-auto h-5 w-5 text-amber-500" />
                  <p className="text-sm font-medium">
                    No appointment scheduled
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Set an appointment date when ready
                  </p>
                </div>
                {isSettingAppointment ? (
                  <div className="space-y-2">
                    <DateTimePicker
                      value={appointmentDate}
                      onChange={setAppointmentDate}
                      placeholder="Select appointment date and time"
                      disablePastDates={true}
                    />
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        className="flex-1"
                        onClick={handleSetAppointment}
                        disabled={!appointmentDate || updateService.isPending}
                      >
                        <Calendar className="mr-1.5 h-3.5 w-3.5" />
                        Confirm Appointment
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          setIsSettingAppointment(false)
                          setAppointmentDate(undefined)
                        }}
                      >
                        Cancel
                      </Button>
                    </div>
                  </div>
                ) : (
                  <Button
                    className="w-full border-dashed"
                    variant="outline"
                    size="sm"
                    onClick={() => setIsSettingAppointment(true)}
                  >
                    <Calendar className="mr-1.5 h-3.5 w-3.5" />
                    Set Appointment
                  </Button>
                )}
              </div>
            )}

          {/* Empty State */}
          {!service.pickup_date &&
            !service.delivery_date &&
            !service.received_at &&
            !isCompleted &&
            service.service_mode !== "home_service" &&
            (schedulesLoading || schedules.length === 0) && (
              <div className="py-6 text-center rounded-lg border border-dashed">
                <Calendar className="mx-auto mb-1.5 h-6 w-6 text-muted-foreground/50" />
                <p className="text-xs text-muted-foreground">
                  No additional schedule information
                </p>
              </div>
            )}

          {/* Schedule Delivery Button for Pull-Out Services */}
          {service.service_mode === "pull_out" &&
            service.pickup_date &&
            !service.delivery_date &&
            !isCompleted && (
              <Button
                className="w-full border-dashed"
                variant="outline"
                size="sm"
                onClick={() => setScheduleDeliveryDialogOpen(true)}
              >
                <Truck className="mr-1.5 h-3.5 w-3.5" />
                Schedule Delivery
              </Button>
            )}
        </TabsContent>
      </Tabs>

      {/* Complete Service Dialog */}
      <ConfirmDialog
        open={completeDialogOpen}
        onCancel={() => setCompleteDialogOpen(false)}
        title="Complete Service"
        description={
          hasUnfinishedAppliances
            ? `Warning: Some appliances are not finished yet. Please update their status before completing the service.`
            : service.has_pending_items
              ? `Warning: Items have not been confirmed for all appliances. Please ask the clerk to confirm parts/items used before completing.`
              : service.appliances && service.appliances.length > 0
                ? `Complete service #${service.id}? This will finalize stock consumption, create transactions, and mark the service as completed.`
                : `Complete service #${service.id}? Note: This service has no appliances/items. No sales transactions will be created.`
        }
        onConfirm={handleComplete}
        confirmText={
          hasUnfinishedAppliances || service.has_pending_items
            ? "Close"
            : "Complete Service"
        }
        variant={hasUnfinishedAppliances || service.has_pending_items ? "warning" : "success"}
        Icon={hasUnfinishedAppliances || service.has_pending_items ? AlertTriangle : CheckCircle}
      />

      {/* Reopen Service Dialog */}
      <Dialog
        open={reopenDialogOpen}
        onOpenChange={(open) => {
          setReopenDialogOpen(open)
          if (!open) setReopenReason("")
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reopen Service for Revision</DialogTitle>
            <DialogDescription>
              This will void the existing transactions, return consumed stock to
              inventory, and set the service back to &quot;In Progress&quot; so
              you can edit parts/items. Customer payments will NOT be affected.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2 py-2">
            <Label htmlFor="reopen_reason">Reason (optional)</Label>
            <Textarea
              id="reopen_reason"
              placeholder="e.g. Need to add missing parts"
              value={reopenReason}
              onChange={(e) => setReopenReason(e.target.value)}
            />
          </div>
          <div className="flex justify-end gap-2">
            <Button
              variant="outline"
              onClick={() => {
                setReopenDialogOpen(false)
                setReopenReason("")
              }}
            >
              Cancel
            </Button>
            <Button
              onClick={handleReopen}
              disabled={reopenService.isPending}
            >
              <RotateCcw className="mr-1 h-3.5 w-3.5" />
              {reopenService.isPending ? "Reopening..." : "Reopen Service"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Payment Recording Dialog */}
      <Dialog
        open={paymentDialogOpen}
        onOpenChange={setPaymentDialogOpen}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Record Payment</DialogTitle>
            <DialogDescription>
              Record a payment for this service. Service #{service.id}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="payment_type">Payment Type</Label>
              <Select
                value={paymentType}
                onValueChange={(value) => {
                  setPaymentType(value)
                  if (value !== "cheque") {
                    setSelectedCheque(null)
                  }
                }}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="cash">Cash</SelectItem>
                  <SelectItem value="gcash">GCash</SelectItem>
                  <SelectItem value="credit">Credit Card</SelectItem>
                  <SelectItem value="debit">Debit Card</SelectItem>
                  <SelectItem value="cheque">Cheque</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {paymentType === "cheque" && (
              <div className="space-y-2">
                <Label htmlFor="cheque">Select Cheque</Label>
                <ComboBox
                  options={chequeChoices}
                  value={selectedCheque}
                  onChange={(value) =>
                    setSelectedCheque(typeof value === "number" ? value : null)
                  }
                  placeholder="Select a cheque..."
                  className="w-full"
                />
                <p className="text-xs text-muted-foreground">
                  Only pending and deposited cheques are shown
                </p>
              </div>
            )}
            <div className="space-y-2">
              <Label htmlFor="amount">Amount (₱)</Label>
              <Input
                id="amount"
                type="number"
                step="1"
                value={paymentAmount}
                onChange={(e) => setPaymentAmount(e.target.value)}
                placeholder="0.00"
                disabled={paymentType === "cheque" && !!selectedCheque}
              />
              {paymentType === "cheque" && selectedCheque && (
                <p className="text-xs text-muted-foreground">
                  Amount is set to the selected cheque&apos;s value
                </p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="notes">Notes</Label>
              <Input
                id="notes"
                type="text"
                value={paymentNotes}
                onChange={(e) => setPaymentNotes(e.target.value)}
                placeholder="e.g., Partial payment, advance payment"
              />
            </div>
            <div className="rounded-md bg-muted p-3 space-y-1">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Total</span>
                <span className="font-medium">
                  {formatCurrency(parseFloat(service.total_revenue || "0"))}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Paid</span>
                <span className="font-medium text-success">
                  {formatCurrency(
                    parseFloat(service.total_paid || "0") -
                      parseFloat(service.total_refunded || "0"),
                  )}
                </span>
              </div>
              <Separator />
              <div className="flex justify-between text-sm font-medium">
                <span>Balance Due</span>
                <span
                  className={`${
                    parseFloat(service.balance_due || "0") <= 0
                      ? "text-success"
                      : "text-destructive"
                  }`}
                >
                  {formatCurrency(parseFloat(service.balance_due || "0"))}
                </span>
              </div>
            </div>
          </div>
          <div className="flex gap-2 justify-end">
            <Button
              variant="outline"
              onClick={() => setPaymentDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button
              onClick={handlePaymentSubmit}
              disabled={recordPayment.isPending}
            >
              {recordPayment.isPending ? "Recording..." : "Record Payment"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Cancel Service Dialog */}
      <Dialog
        open={cancelDialogOpen}
        onOpenChange={setCancelDialogOpen}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Cancel Service</DialogTitle>
            <DialogDescription>
              This will return all unused parts to stock and void sales
              transactions. This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label
                htmlFor="cancel_reason"
                required
              >
                Reason for Cancellation
              </Label>
              <Textarea
                id="cancel_reason"
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
                placeholder="Enter reason for cancellation..."
                rows={3}
              />
            </div>
          </div>
          <div className="flex gap-2 justify-end">
            <Button
              variant="outline"
              onClick={() => setCancelDialogOpen(false)}
            >
              Close
            </Button>
            <Button
              variant="destructive"
              onClick={handleCancelService}
              disabled={cancelService.isPending || !cancelReason.trim()}
            >
              {cancelService.isPending
                ? "Cancelling..."
                : "Confirm Cancellation"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Schedule Delivery Dialog */}
      <Dialog
        open={scheduleDeliveryDialogOpen}
        onOpenChange={setScheduleDeliveryDialogOpen}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Schedule Delivery</DialogTitle>
            <DialogDescription>
              Set the date and time for delivering the repaired appliance back
              to the customer.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="delivery-date">Delivery Date & Time</Label>
              <DateTimePicker
                value={deliveryDate}
                onChange={setDeliveryDate}
                placeholder="Select delivery date and time"
                disablePastDates={true}
              />
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <Button
              variant="outline"
              onClick={() => {
                setScheduleDeliveryDialogOpen(false)
                setDeliveryDate(undefined)
              }}
            >
              Cancel
            </Button>
            <Button
              onClick={handleScheduleDelivery}
              disabled={!deliveryDate || updateService.isPending}
            >
              Schedule Delivery
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Refund Service Dialog */}
      <Dialog
        open={refundDialogOpen}
        onOpenChange={setRefundDialogOpen}
      >
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Process Refund</DialogTitle>
            <DialogDescription>
              Parts are NOT returned to stock (already used). Maximum
              refundable:{" "}
              {formatCurrency(
                parseFloat(service.total_paid || "0") -
                  parseFloat(service.total_refunded || "0"),
              )}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            {service.status !== "completed" && (
              <Alert variant="warning">
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  Note: Service is not yet completed. Refunds are typically
                  processed after service completion.
                </AlertDescription>
              </Alert>
            )}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="refund_type">Refund Type</Label>
                <Select
                  value={refundType}
                  onValueChange={(value: "full" | "partial") => {
                    setRefundType(value)
                    // Auto-fill amount for full refund
                    if (value === "full") {
                      const maxRefundable =
                        parseFloat(service.total_paid || "0") -
                        parseFloat(service.total_refunded || "0")
                      setRefundAmount(maxRefundable.toString())
                    }
                  }}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="partial">Partial</SelectItem>
                    <SelectItem value="full">Full</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label
                  htmlFor="refund_amount"
                  required
                >
                  Amount (₱)
                </Label>
                <Input
                  id="refund_amount"
                  type="number"
                  min="0"
                  step="0.01"
                  max={
                    parseFloat(service.total_paid || "0") -
                    parseFloat(service.total_refunded || "0")
                  }
                  value={refundAmount}
                  onChange={(e) => setRefundAmount(e.target.value)}
                  disabled={refundType === "full"}
                  className={refundType === "full" ? "bg-muted" : ""}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label
                htmlFor="refund_method"
                required
              >
                Refund Method
              </Label>
              <Select
                value={refundMethod}
                onValueChange={(value: "cash" | "gcash" | "bank_transfer") =>
                  setRefundMethod(value)
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="cash">Cash</SelectItem>
                  <SelectItem value="gcash">GCash</SelectItem>
                  <SelectItem value="bank_transfer">Bank Transfer</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label
                htmlFor="refund_reason"
                required
              >
                Reason
              </Label>
              <Textarea
                id="refund_reason"
                value={refundReason}
                onChange={(e) => setRefundReason(e.target.value)}
                placeholder="e.g., Overpayment after discount, Customer dissatisfaction, Warranty issue..."
                rows={3}
              />
            </div>
          </div>
          <div className="flex gap-2 justify-end">
            <Button
              variant="outline"
              onClick={() => setRefundDialogOpen(false)}
            >
              Close
            </Button>
            <Button
              onClick={handleRefundService}
              disabled={
                refundService.isPending || !refundAmount || !refundReason.trim()
              }
            >
              {refundService.isPending ? "Processing..." : "Process Refund"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Hidden print content */}
      <div className="fixed left-[-9999px] top-0">
        <ServiceReceiptPrintContent
          ref={serviceReceiptRef}
          service={service}
          mode={receiptMode}
        />
      </div>

      {/* Print confirmation after print trigger */}
      <ConfirmDialog
        open={showServicePrintDialog}
        onConfirm={() => {
          confirmServicePrint()
        }}
        onCancel={() => {
          cancelServicePrint()
        }}
        title="Print Receipt?"
        description="Would you like to print this service receipt now?"
        Icon={Printer}
        confirmText="Print"
        cancelText="No, thanks"
        variant="info"
      />

      {/* Receipt Print Mode Selection Dialog */}
      <Dialog
        open={receiptPrintDialogOpen}
        onOpenChange={setReceiptPrintDialogOpen}
      >
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Print Service Receipt</DialogTitle>
            <DialogDescription>
              Choose how to print the receipt for Service #{service.id}. You can
              print a combined receipt or separate receipts for each stall.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3 py-4">
            <div className="space-y-2">
              <Label>Receipt Type</Label>
              <Select
                value={receiptMode}
                onValueChange={(v) => setReceiptMode(v as ServiceReceiptMode)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="combined">
                    Combined (Labor + Parts)
                  </SelectItem>
                  <SelectItem value="main_only">
                    Main Stall Only (Labor & Units)
                  </SelectItem>
                  <SelectItem value="sub_only">
                    Sub Stall Only (Parts & Accessories)
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Preview summary */}
            <div className="rounded-md bg-muted p-3 space-y-1.5 text-sm">
              {receiptMode === "combined" && (
                <>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">
                      Main Stall (Labor)
                    </span>
                    <span className="font-medium">
                      {formatCurrency(
                        parseFloat(service.main_stall_revenue || "0"),
                      )}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">
                      Sub Stall (Parts)
                    </span>
                    <span className="font-medium">
                      {formatCurrency(
                        parseFloat(service.sub_stall_revenue || "0"),
                      )}
                    </span>
                  </div>
                  <Separator className="my-1" />
                  <div className="flex justify-between font-semibold">
                    <span>Total Revenue</span>
                    <span>
                      {formatCurrency(parseFloat(service.total_revenue || "0"))}
                    </span>
                  </div>
                </>
              )}
              {receiptMode === "main_only" && (
                <div className="flex justify-between font-medium">
                  <span>Main Stall Revenue</span>
                  <span>
                    {formatCurrency(
                      parseFloat(service.main_stall_revenue || "0"),
                    )}
                  </span>
                </div>
              )}
              {receiptMode === "sub_only" && (
                <div className="flex justify-between font-medium">
                  <span>Sub Stall Revenue</span>
                  <span>
                    {formatCurrency(
                      parseFloat(service.sub_stall_revenue || "0"),
                    )}
                  </span>
                </div>
              )}
            </div>
          </div>
          <div className="flex gap-2 justify-end">
            <Button
              variant="outline"
              onClick={() => setReceiptPrintDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button
              onClick={() => {
                setReceiptPrintDialogOpen(false)
                setShowServicePrintDialog(true)
              }}
            >
              <Printer className="mr-2 h-4 w-4" />
              Print Receipt
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Re-Service / Back Job Dialog */}
      <Dialog
        open={reServiceDialogOpen}
        onOpenChange={(open) => {
          setReServiceDialogOpen(open)
          if (!open) setReServiceReason("")
        }}
      >
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Create Re-Service</DialogTitle>
            <DialogDescription>
              Create a back job / re-service for Service #{service.id}. The new
              service will be linked to this one with the same client,
              service type, and technicians.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <div className="space-y-2">
              <Label>Reason for Re-Service</Label>
              <Textarea
                placeholder="e.g. Unit still not cooling after initial repair..."
                value={reServiceReason}
                onChange={(e) => setReServiceReason(e.target.value)}
                rows={3}
              />
            </div>
          </div>
          <div className="flex gap-2 justify-end">
            <Button
              variant="outline"
              onClick={() => {
                setReServiceDialogOpen(false)
                setReServiceReason("")
              }}
            >
              Cancel
            </Button>
            <Button
              disabled={addService.isPending}
              onClick={() => {
                const payload: ServicePayload = {
                  client: service.client?.id ?? 0,
                  service_type: service.service_type as ServicePayload["service_type"],
                  service_mode: service.service_mode as ServicePayload["service_mode"],
                  override_address: service.override_address || undefined,
                  override_contact_person: service.override_contact_person || undefined,
                  override_contact_number: service.override_contact_number || undefined,
                  is_back_job: true,
                  back_job_parent: service.id,
                  back_job_reason: reServiceReason || undefined,
                  technician_assignments: service.technician_assignments?.map((ta) => ({
                    technician: ta.technician!,
                    assignment_type: ta.assignment_type as "repair" | "pickup" | "delivery",
                    appliance: null,
                  })),
                }
                addService.mutate(payload, {
                  onSuccess: () => {
                    setReServiceDialogOpen(false)
                    setReServiceReason("")
                    toast.success("Re-service created successfully")
                  },
                })
              }}
            >
              <Copy className="mr-2 h-4 w-4" />
              {addService.isPending ? "Creating..." : "Create Re-Service"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Mark Appliance as Claimed Dialog */}
      <Dialog
        open={claimingApplianceId !== null}
        onOpenChange={(open) => {
          if (!open) setClaimingApplianceId(null)
        }}
      >
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Mark Appliance as Claimed</DialogTitle>
            <DialogDescription>
              Confirm that the client has picked up or received this specific appliance from Service #{service.id}.
            </DialogDescription>
          </DialogHeader>
          <div className="flex gap-2 justify-end pt-2">
            <Button variant="outline" onClick={() => setClaimingApplianceId(null)}>
              Cancel
            </Button>
            <Button
              variant="success"
              disabled={markApplianceClaimed.isPending}
              onClick={() => {
                if (!claimingApplianceId) return
                markApplianceClaimed.mutate(
                  { id: claimingApplianceId, serviceId: service.id },
                  {
                    onSuccess: () => {
                      setClaimingApplianceId(null)
                      onRefresh?.()
                    },
                  },
                )
              }}
            >
              <Truck className="mr-2 h-4 w-4" />
              {markApplianceClaimed.isPending ? "Saving..." : "Confirm Claimed"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Forfeit Appliance Dialog */}
      <Dialog
        open={forfeitingApplianceId !== null}
        onOpenChange={(open) => {
          if (!open) {
            setForfeitingApplianceId(null)
            setForfeitingApplianceNotes("")
          }
        }}
      >
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Declare Appliance as Company Property</DialogTitle>
            <DialogDescription>
              This appliance will be forfeited under the 2-month unclaimed policy and recorded as a company asset.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <div className="space-y-2">
              <Label htmlFor="forfeit-appliance-notes">Notes (optional)</Label>
              <Textarea
                id="forfeit-appliance-notes"
                placeholder="e.g. Client unreachable after multiple follow-ups..."
                value={forfeitingApplianceNotes}
                onChange={(e) => setForfeitingApplianceNotes(e.target.value)}
                rows={3}
              />
            </div>
          </div>
          <div className="flex gap-2 justify-end">
            <Button
              variant="outline"
              onClick={() => {
                setForfeitingApplianceId(null)
                setForfeitingApplianceNotes("")
              }}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              disabled={markApplianceForfeited.isPending}
              onClick={() => {
                if (!forfeitingApplianceId) return
                markApplianceForfeited.mutate(
                  { id: forfeitingApplianceId, serviceId: service.id, forfeiture_notes: forfeitingApplianceNotes || undefined },
                  {
                    onSuccess: () => {
                      setForfeitingApplianceId(null)
                      setForfeitingApplianceNotes("")
                      onRefresh?.()
                    },
                  },
                )
              }}
            >
              <AlertTriangle className="mr-2 h-4 w-4" />
              {markApplianceForfeited.isPending ? "Processing..." : "Declare Forfeited"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Acquire Appliance Dialog */}
      <Dialog
        open={acquiringApplianceId !== null}
        onOpenChange={(open) => {
          if (!open) {
            setAcquiringApplianceId(null)
            setAcquiringAppliancePrice("")
            setAcquiringApplianceNotes("")
          }
        }}
      >
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Record Appliance Acquisition</DialogTitle>
            <DialogDescription>
              Client is selling this specific appliance to the company. It will be recorded as a company asset.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <div className="space-y-2">
              <Label htmlFor="acquiring-appliance-price">
                Acquisition Price (optional)
              </Label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">
                  ₱
                </span>
                <Input
                  id="acquiring-appliance-price"
                  type="number"
                  min="0"
                  step="0.01"
                  placeholder="0.00"
                  className="pl-7"
                  value={acquiringAppliancePrice}
                  onChange={(e) => setAcquiringAppliancePrice(e.target.value)}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="acquiring-appliance-notes">Notes (optional)</Label>
              <Textarea
                id="acquiring-appliance-notes"
                placeholder="e.g. Client sold unit as payment in lieu of repair fees..."
                value={acquiringApplianceNotes}
                onChange={(e) => setAcquiringApplianceNotes(e.target.value)}
                rows={3}
              />
            </div>
          </div>
          <div className="flex gap-2 justify-end">
            <Button
              variant="outline"
              onClick={() => {
                setAcquiringApplianceId(null)
                setAcquiringAppliancePrice("")
                setAcquiringApplianceNotes("")
              }}
            >
              Cancel
            </Button>
            <Button
              disabled={convertApplianceToAcquisition.isPending}
              onClick={() => {
                if (!acquiringApplianceId) return
                const price = acquiringAppliancePrice ? parseFloat(acquiringAppliancePrice) : null
                convertApplianceToAcquisition.mutate(
                  {
                    id: acquiringApplianceId,
                    serviceId: service.id,
                    acquisition_price: price,
                    notes: acquiringApplianceNotes || undefined,
                  },
                  {
                    onSuccess: () => {
                      setAcquiringApplianceId(null)
                      setAcquiringAppliancePrice("")
                      setAcquiringApplianceNotes("")
                      onRefresh?.()
                    },
                  },
                )
              }}
            >
              <Wallet className="mr-2 h-4 w-4" />
              {convertApplianceToAcquisition.isPending ? "Recording..." : "Record Acquisition"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}

// ─── Service-Level Parts Review Sub-Component ────────────────────────────────

interface ServicePartsReviewProps {
  service: Service
  canManage: boolean
  role: string | undefined
  isCompleted: boolean
  updateService: {
    mutateAsync: (args: {
      id: number
      data: Record<string, unknown>
    }) => Promise<unknown>
    isPending: boolean
  }
  toggleServiceItemsChecked: {
    mutateAsync: (id: number) => Promise<unknown>
    isPending: boolean
  }
  onRefresh?: () => void
}

function ServicePartsReview({
  service,
  canManage,
  role,
  isCompleted,
  updateService,
  toggleServiceItemsChecked,
  onRefresh,
}: ServicePartsReviewProps) {
  const [editingNotes, setEditingNotes] = useState(false)
  const [notesValue, setNotesValue] = useState(
    service.service_parts_needed_notes || "",
  )

  const { data: serviceItems = [] } = useServiceItems(service.id)
  const canConfirmItems = role === "clerk" || role === "admin"
  const hasPartsNeeded = !!service.service_parts_needed_notes

  // Sync local state when service data changes
  useEffect(() => {
    setNotesValue(service.service_parts_needed_notes || "")
  }, [service.service_parts_needed_notes])

  const handleSaveNotes = async () => {
    try {
      await updateService.mutateAsync({
        id: service.id,
        data: { service_parts_needed_notes: notesValue },
      })
      setEditingNotes(false)
      toast.success("Service parts needed notes updated")
      onRefresh?.()
    } catch {
      // handled by useApiMutation
    }
  }

  return (
    <div className="space-y-3">
      {/* Service Parts Needed Notes — managers can edit */}
      {(hasPartsNeeded || (canManage && !isCompleted)) && (
        <div className="rounded-lg border bg-card p-4 space-y-3">
          <div className="flex items-center justify-between">
            <p className="text-xs font-medium uppercase tracking-wide text-orange-600 dark:text-orange-400 flex items-center gap-1">
              <Package className="h-3 w-3" />
              Service-Level Parts Needed
            </p>
            {canManage && !isCompleted && !editingNotes && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setEditingNotes(true)}
                className="h-6 text-xs"
              >
                <Edit className="mr-1 h-3 w-3" />
                {hasPartsNeeded ? "Edit" : "Add Notes"}
              </Button>
            )}
          </div>

          {editingNotes ? (
            <div className="space-y-2">
              <Textarea
                value={notesValue}
                onChange={(e) => setNotesValue(e.target.value)}
                placeholder="Describe what service-level parts are needed (e.g., copper pipe, insulation tube for chipping)..."
                rows={3}
                className="text-sm"
              />
              <div className="flex gap-2 justify-end">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setNotesValue(service.service_parts_needed_notes || "")
                    setEditingNotes(false)
                  }}
                  className="h-7 text-xs"
                >
                  Cancel
                </Button>
                <Button
                  type="button"
                  size="sm"
                  disabled={updateService.isPending}
                  onClick={handleSaveNotes}
                  className="h-7 text-xs"
                >
                  Save Notes
                </Button>
              </div>
            </div>
          ) : hasPartsNeeded ? (
            <p className="text-sm leading-relaxed bg-orange-50 dark:bg-orange-950/20 p-2.5 rounded-md border border-orange-200/50 dark:border-orange-900/50">
              {service.service_parts_needed_notes}
            </p>
          ) : null}

          {/* Items Confirmed Toggle — only when service_parts_needed_notes exists */}
          {hasPartsNeeded && (
            <div className="flex items-center justify-between gap-3 rounded-lg border p-3">
              <div className="flex items-center gap-2 min-w-0">
                {service.service_items_checked ? (
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <CheckCircle className="h-4 w-4 text-success shrink-0" />
                    </TooltipTrigger>
                    <TooltipContent>
                      Service-level parts have been reviewed and confirmed by
                      clerk
                    </TooltipContent>
                  </Tooltip>
                ) : (
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Package className="h-4 w-4 text-orange-500 shrink-0" />
                    </TooltipTrigger>
                    <TooltipContent>
                      Clerk needs to review and confirm service-level parts
                    </TooltipContent>
                  </Tooltip>
                )}
                <div className="min-w-0">
                  <p className="text-sm font-medium">
                    {service.service_items_checked
                      ? "Service Items Confirmed"
                      : "Service Items Not Yet Confirmed"}
                  </p>
                  {service.service_items_checked &&
                    service.service_items_checked_by && (
                      <p className="text-xs text-muted-foreground">
                        by {service.service_items_checked_by_name || "Unknown"}{" "}
                        {service.service_items_checked_at &&
                          `· ${formatDate(new Date(service.service_items_checked_at), "MMM d, yyyy h:mm a")}`}
                      </p>
                    )}
                </div>
              </div>
              {canConfirmItems && (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      type="button"
                      variant={
                        service.service_items_checked ? "outline" : "default"
                      }
                      size="sm"
                      disabled={toggleServiceItemsChecked.isPending}
                      onClick={async () => {
                        try {
                          await toggleServiceItemsChecked.mutateAsync(
                            service.id,
                          )
                          toast.success(
                            service.service_items_checked
                              ? "Service items marked as not confirmed"
                              : "Service items confirmed successfully",
                          )
                          onRefresh?.()
                        } catch {
                          // handled by useApiMutation
                        }
                      }}
                      className="h-7 text-xs shrink-0"
                    >
                      {service.service_items_checked ? (
                        <>
                          <RotateCcw className="mr-1 h-3 w-3" />
                          Unconfirm
                        </>
                      ) : (
                        <>
                          <CheckCircle className="mr-1 h-3 w-3" />
                          Confirm Items
                        </>
                      )}
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    {service.service_items_checked
                      ? "Mark service items as needing re-review"
                      : serviceItems.length === 0
                        ? "Add parts first before confirming"
                        : "Confirm that all listed service-level parts are correct and complete"}
                  </TooltipContent>
                </Tooltip>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
