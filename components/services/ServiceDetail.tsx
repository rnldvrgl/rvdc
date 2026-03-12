"use client"

import { ComboBox } from "@/components/custom/inputs/ComboBox"
import { DateTimePicker } from "@/components/custom/inputs/DateTimePicker"
import { ConfirmDialog } from "@/components/custom/shared/ConfirmDialog"
import {
  ServiceReceiptPrintContent,
  type ServiceReceiptMode,
} from "@/components/custom/shared/ServiceReceiptPrintContent"
import ServiceApplianceManager from "@/components/forms/ServiceApplianceManager"
import ServicePartsManager from "@/components/forms/ServicePartsManager"
import ApplianceKanbanBoard from "@/components/services/ApplianceKanbanBoard"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
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
import { Service } from "@/lib/constants/interface"
import { useCurrentUser } from "@/lib/hooks/useCurrentUser"
import { usePrint } from "@/lib/hooks/usePrint"
import { useServiceApplianceMutations } from "@/lib/mutations/services/useServiceApplianceMutations"
import { useServiceMutations } from "@/lib/mutations/services/useServiceMutations"
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
import {
  AlertTriangle,
  Calendar,
  CheckCircle,
  Clock,
  Edit,
  Info,
  Kanban,
  List,
  MapPin,
  Package,
  Phone,
  Printer,
  RotateCcw,
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
  const { canManage } = useCurrentUser()
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
  const [discountType, setDiscountType] = useState<
    "none" | "percentage" | "fixed"
  >("none")
  const [discountValue, setDiscountValue] = useState("")
  const [discountReason, setDiscountReason] = useState("")
  const [scheduleDeliveryDialogOpen, setScheduleDeliveryDialogOpen] =
    useState(false)
  const [deliveryDate, setDeliveryDate] = useState<Date | undefined>()
  const [applianceView, setApplianceView] = useState<"list" | "kanban">("list")
  const [receiptPrintDialogOpen, setReceiptPrintDialogOpen] = useState(false)
  const [receiptMode, setReceiptMode] = useState<ServiceReceiptMode>("combined")
  const {
    completeService,
    recordPayment,
    cancelService,
    refundService,
    updateService,
    reopenService,
  } = useServiceMutations()
  const { updateAppliance } = useServiceApplianceMutations()

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

  const canComplete =
    service.status === "pending" || service.status === "in_progress"
  const isCompleted = service.status === "completed"
  const isCarryIn = service.service_mode === "carry_in"

  // Initialize discount form with existing values
  useEffect(() => {
    const discountAmount = parseFloat(service.service_discount_amount || "0")
    const discountPercentage = parseFloat(
      service.service_discount_percentage || "0",
    )

    if (discountPercentage > 0) {
      setDiscountType("percentage")
      setDiscountValue(service.service_discount_percentage || "")
    } else if (discountAmount > 0) {
      setDiscountType("fixed")
      setDiscountValue(service.service_discount_amount || "")
    } else {
      setDiscountType("none")
      setDiscountValue("")
    }

    setDiscountReason(service.discount_reason || "")
  }, [
    service.id,
    service.service_discount_amount,
    service.service_discount_percentage,
    service.discount_reason,
  ])

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
    if (discountType === "none" || !discountValue) return 0
    const value = parseFloat(discountValue)
    if (isNaN(value)) return 0

    if (discountType === "percentage") {
      return (parseFloat(service.total_revenue || "0") * value) / 100
    }
    return value
  }

  // Check if all appliances are ready for completion
  const hasUnfinishedAppliances = service.appliances?.some(
    (appliance) =>
      appliance.status !== "completed" &&
      appliance.status !== "ready_for_pickup" &&
      appliance.status !== "delivered" &&
      appliance.status !== "installed",
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
    // Allow removing discount by selecting "none"
    if (discountType === "none") {
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
            setDiscountType("none")
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

    if (!discountValue || parseFloat(discountValue) <= 0) {
      toast.error("Please enter a valid discount value")
      return
    }

    // Validate percentage discount
    if (discountType === "percentage") {
      const percentage = parseFloat(discountValue)
      if (percentage > 100) {
        toast.error("Percentage discount cannot exceed 100%")
        return
      }
    }

    updateService.mutate(
      {
        id: service.id,
        data: {
          service_discount_amount:
            discountType === "fixed"
              ? Math.round(parseFloat(discountValue) * 100) / 100
              : 0,
          service_discount_percentage:
            discountType === "percentage"
              ? Math.round(parseFloat(discountValue) * 100) / 100
              : 0,
          discount_reason: discountReason,
        },
      },
      {
        onSuccess: () => {
          setDiscountType("none")
          setDiscountValue("")
          setDiscountReason("")
        },
        onSettled: () => {
          // Call onRefresh after query invalidation completes
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
                <Button
                  variant="outline"
                  size="sm"
                  className="h-7 px-2.5 text-xs"
                  onClick={() => setReopenDialogOpen(true)}
                >
                  <RotateCcw className="mr-1 h-3.5 w-3.5" />
                  Reopen
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                Reopen service to add/remove parts, then re-complete
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
          className="space-y-1"
        >
          {/* Client & Service Info — compact horizontal sections */}
          <div className="rounded-lg border bg-card">
            {/* Client row */}
            <div className="px-4 py-3">
              <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground mb-1.5 flex items-center gap-1.5">
                <User className="h-3.5 w-3.5" />
                Client
              </p>
              <div className="space-y-1">
                <p className="text-sm font-semibold">
                  {service.client?.full_name || "N/A"}
                </p>
                {service.client?.contact_number && (
                  <p className="flex items-center gap-1.5 text-sm text-muted-foreground">
                    <Phone className="h-3.5 w-3.5 shrink-0" />
                    {service.client.contact_number}
                  </p>
                )}
                {service.client?.address && (
                  <p className="flex items-start gap-1.5 text-sm text-muted-foreground">
                    <MapPin className="h-3.5 w-3.5 shrink-0 mt-0.5" />
                    {service.client.address}
                  </p>
                )}
              </div>
            </div>

            <Separator />

            {/* Service info row */}
            <div className="px-4 py-3">
              <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground mb-1.5 flex items-center gap-1.5">
                <Wrench className="h-3.5 w-3.5" />
                Service Details
              </p>
              <div className="flex flex-wrap items-center gap-2">
                <Badge
                  variant={getBadgeVariant(service.status)}
                  className="text-xs"
                >
                  {getServiceStatusLabel(service.status)}
                </Badge>
                <Badge
                  variant="outline"
                  className={`text-xs ${getServiceTypeBadgeClass(service.service_type)}`}
                >
                  {getServiceTypeLabel(service.service_type)}
                </Badge>
                <Badge
                  variant="secondary"
                  className="text-xs"
                >
                  {getServiceModeLabel(service.service_mode)}
                </Badge>
                {service.stall && (
                  <Badge
                    variant="outline"
                    className="text-xs"
                  >
                    {typeof service.stall === "object" &&
                    "name" in service.stall
                      ? (service.stall as { name: string }).name
                      : `Stall #${service.stall}`}
                  </Badge>
                )}
              </div>
              {/* Conditional date details */}
              {(service.service_mode === "pull_out" ||
                service.service_mode === "home_service") && (
                <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-2 text-xs text-muted-foreground">
                  {service.service_mode === "pull_out" &&
                    service.pickup_date && (
                      <span className="flex items-center gap-1">
                        <Truck className="h-3 w-3" />
                        Pickup:{" "}
                        {formatDate(new Date(service.pickup_date), "PPp")}
                      </span>
                    )}
                  {service.service_mode === "pull_out" &&
                    service.delivery_date && (
                      <span className="flex items-center gap-1">
                        <Truck className="h-3 w-3" />
                        Delivery:{" "}
                        {formatDate(new Date(service.delivery_date), "PPp")}
                      </span>
                    )}
                  {service.service_mode === "home_service" &&
                    schedules.length > 0 &&
                    schedules[0].scheduled_date && (
                      <span className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        Scheduled:{" "}
                        {formatDate(
                          new Date(schedules[0].scheduled_date),
                          "PPp",
                        )}
                      </span>
                    )}
                </div>
              )}
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
                    ((appliance.labor_discount_amount &&
                      parseFloat(appliance.labor_discount_amount) > 0) ||
                      (appliance.labor_discount_percentage &&
                        parseFloat(appliance.labor_discount_percentage) > 0)) &&
                    !appliance.labor_is_free

                  const partsCost = parseFloat(
                    appliance.total_parts_cost || "0",
                  )
                  const partsOriginalCost = appliance.items_used
                    ? appliance.items_used.reduce(
                        (sum, part) =>
                          sum + parseFloat(part.item_price) * part.quantity,
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
                                    className="text-green-600 border-green-600 text-xs px-1.5 py-0"
                                  >
                                    {appliance.labor_discount_percentage &&
                                    parseFloat(
                                      appliance.labor_discount_percentage,
                                    ) > 0
                                      ? `${appliance.labor_discount_percentage}%`
                                      : `₱${appliance.labor_discount_amount}`}
                                  </Badge>
                                </div>
                              )}
                              <span className="font-medium">
                                {formatCurrency(discountedLaborFee)}
                              </span>
                            </div>
                          )}
                        </div>
                        {appliance.items_used &&
                          appliance.items_used.length > 0 && (
                            <>
                              <div className="flex justify-between items-center">
                                <span className="text-muted-foreground">
                                  Parts ({appliance.items_used.length} items)
                                </span>
                                <div className="flex flex-col items-end gap-0.5">
                                  {hasPartsDiscount && (
                                    <div className="flex items-center gap-1.5">
                                      <span className="text-xs line-through text-muted-foreground">
                                        {formatCurrency(partsOriginalCost)}
                                      </span>
                                      <Badge
                                        variant="outline"
                                        className="text-green-600 border-green-600 text-xs px-1.5 py-0"
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
                                    (part.discount_amount &&
                                      parseFloat(part.discount_amount) > 0) ||
                                    (part.discount_percentage &&
                                      parseFloat(part.discount_percentage) > 0)

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
                                              className="text-green-600 border-green-600 text-xs px-1 py-0"
                                            >
                                              {part.discount_percentage &&
                                              parseFloat(
                                                part.discount_percentage,
                                              ) > 0
                                                ? `${part.discount_percentage}%`
                                                : `₱${part.discount_amount}`}
                                            </Badge>
                                          )
                                        )}
                                      </div>
                                      <div className="flex flex-col items-end">
                                        {!part.is_free && partHasDiscount && (
                                          <span className="text-xs line-through">
                                            {formatCurrency(
                                              parseFloat(part.item_price) *
                                                part.quantity,
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
              {((service.service_discount_amount &&
                parseFloat(service.service_discount_amount) > 0) ||
                (service.service_discount_percentage &&
                  parseFloat(service.service_discount_percentage) > 0)) && (
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
                        className="text-green-600 border-green-600"
                      >
                        {service.service_discount_percentage &&
                        parseFloat(service.service_discount_percentage) > 0
                          ? `${service.service_discount_percentage}% off`
                          : `₱${service.service_discount_amount} off`}
                      </Badge>
                      <p className="text-green-600 font-medium">
                        -
                        {(() => {
                          const discountAmount = parseFloat(
                            service.service_discount_amount || "0",
                          )
                          const discountPercentage = parseFloat(
                            service.service_discount_percentage || "0",
                          )

                          // If percentage discount, calculate from subtotal
                          if (discountPercentage > 0 && discountAmount === 0) {
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
                                // Per-appliance unit price
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

                            const calculatedDiscount =
                              (appliancesSubtotal * discountPercentage) / 100
                            return formatCurrency(calculatedDiscount)
                          }

                          return formatCurrency(discountAmount)
                        })()}
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
                  <p className="font-medium text-green-600">
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
                        className={`font-medium ${balanceDue < 0 ? "text-orange-600" : "text-red-600"}`}
                      >
                        {formatCurrency(balanceDue)}
                      </p>
                    </div>
                    {balanceDue < 0 && <OverPaymentWarning />}
                  </>
                )
              })()}
            </div>
          </div>

          {/* Description & Notes */}
          {(service.description || service.remarks || service.notes) && (
            <div className="rounded-lg border bg-card px-4 py-3">
              <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground mb-2">
                Additional Information
              </p>
              <div className="space-y-2">
                {service.description && (
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">
                      Description
                    </p>
                    <p className="text-sm mt-0.5">{service.description}</p>
                  </div>
                )}
                {service.remarks && (
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">
                      Remarks
                    </p>
                    <p className="text-sm mt-0.5">{service.remarks}</p>
                  </div>
                )}
                {service.notes && (
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">
                      Internal Notes
                    </p>
                    <p className="text-sm mt-0.5">{service.notes}</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Technicians */}
          {service.technician_assignments &&
            service.technician_assignments.length > 0 && (
              <div className="rounded-lg border bg-card px-4 py-3">
                <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground mb-2 flex items-center gap-1.5">
                  <User className="h-3.5 w-3.5" />
                  Assigned Technicians
                </p>
                <div className="flex flex-wrap gap-2">
                  {service.technician_assignments.map((assignment, index) => (
                    <div
                      key={index}
                      className="flex items-center gap-2 rounded-md border bg-muted/30 px-2.5 py-1.5"
                    >
                      <div className="flex h-6 w-6 items-center justify-center rounded-full bg-primary/10">
                        <User className="h-3 w-3 text-primary" />
                      </div>
                      <div>
                        <p className="text-sm font-medium leading-none">
                          {assignment.technician_name ||
                            `Technician #${assignment.technician}`}
                        </p>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {assignment.assignment_type
                            .replace("_", " ")
                            .replace(/\b\w/g, (l) => l.toUpperCase())}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

          {/* Service Location Details - Only show if NOT carry-in */}
          {!isCarryIn &&
            (service.override_address ||
              service.override_contact_person ||
              service.override_contact_number) && (
              <div className="rounded-lg border bg-card px-4 py-3">
                <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground mb-2 flex items-center gap-1.5">
                  <MapPin className="h-3.5 w-3.5" />
                  Service Location
                </p>
                <div className="space-y-1">
                  {service.override_contact_person && (
                    <p className="flex items-center gap-1.5 text-sm font-semibold">
                      <User className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                      {service.override_contact_person}
                    </p>
                  )}
                  {service.override_contact_number && (
                    <p className="flex items-center gap-1.5 text-sm text-muted-foreground">
                      <Phone className="h-3.5 w-3.5 shrink-0" />
                      {service.override_contact_number}
                    </p>
                  )}
                  {service.override_address && (
                    <p className="flex items-start gap-1.5 text-sm text-muted-foreground">
                      <MapPin className="h-3.5 w-3.5 shrink-0 mt-0.5" />
                      {service.override_address}
                    </p>
                  )}
                </div>
              </div>
            )}
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

          {/* Service-Level Parts (chipping, pre-installation materials) */}
          <ServicePartsManager
            serviceId={service.id}
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
                      <p className="text-sm font-semibold text-green-600">
                        {formatCurrency(netPaid)}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-muted-foreground">Balance Due</p>
                    <p
                      className={`text-base font-bold ${balanceDue < 0 ? "text-orange-600" : balanceDue === 0 ? "text-green-600" : "text-red-600"}`}
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
                            <RotateCcw className="h-3.5 w-3.5 text-red-600" />
                          ) : (
                            <Wallet className="h-3.5 w-3.5 text-green-600" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span
                              className={`text-sm font-semibold ${
                                isRefund ? "text-red-600" : ""
                              }`}
                            >
                              {isRefund ? "-" : "+"}
                              {formatCurrency(tx.amount)}
                            </span>
                            <Badge
                              variant="outline"
                              className={`text-[10px] h-4 px-1.5 capitalize ${
                                isRefund ? "border-red-300 text-red-600" : ""
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
                    <Label className="text-xs">Discount Type</Label>
                    <Select
                      value={discountType}
                      onValueChange={(value: "none" | "percentage" | "fixed") =>
                        setDiscountType(value)
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">No Discount</SelectItem>
                        <SelectItem value="percentage">
                          Percentage (%)
                        </SelectItem>
                        <SelectItem value="fixed">Fixed Amount (₱)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-1">
                    <Label className="text-xs">Amount / Percentage</Label>
                    <Input
                      type="number"
                      min="0"
                      max={discountType === "percentage" ? "100" : undefined}
                      step={discountType === "percentage" ? "1" : "0.01"}
                      value={discountValue}
                      onChange={(e) => setDiscountValue(e.target.value)}
                      disabled={discountType === "none"}
                      placeholder={
                        discountType === "percentage" ? "0-100" : "0.00"
                      }
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <Label className="text-xs">Reason</Label>
                  <Input
                    placeholder="Senior Citizen, Loyalty, Promo, etc."
                    value={discountReason}
                    onChange={(e) => setDiscountReason(e.target.value)}
                    disabled={discountType === "none"}
                  />
                </div>

                {calculateDiscount() > 0 && (
                  <div className="flex justify-between pt-2 border-t">
                    <span className="text-sm font-medium">
                      Discount Applied:
                    </span>
                    <span className="text-sm font-medium text-green-600">
                      -{formatCurrency(calculateDiscount())}
                    </span>
                  </div>
                )}

                <Button
                  onClick={handleApplyDiscount}
                  disabled={updateService.isPending}
                  className="w-full"
                  size="sm"
                >
                  {updateService.isPending
                    ? "Applying..."
                    : discountType === "none"
                      ? "Remove Discount"
                      : "Apply Discount"}
                </Button>
              </div>
            )}

          {/* Display Applied Discount */}
          {((service.service_discount_amount &&
            parseFloat(service.service_discount_amount.toString()) > 0) ||
            (service.service_discount_percentage &&
              parseFloat(service.service_discount_percentage.toString()) >
                0)) && (
            <div className="rounded-lg border border-green-200 dark:border-green-900 bg-green-50/50 dark:bg-green-950/20 px-4 py-3 space-y-1.5">
              <div className="flex items-center justify-between">
                <p className="text-xs font-medium uppercase tracking-wider text-green-700 dark:text-green-400 flex items-center gap-1.5">
                  Applied Discount
                  <Badge
                    variant="success"
                    className="text-[10px] h-4 px-1.5"
                  >
                    Active
                  </Badge>
                </p>
                <p className="text-sm font-bold text-green-600">
                  -
                  {formatCurrency(
                    service.service_discount_amount &&
                      parseFloat(service.service_discount_amount.toString()) > 0
                      ? parseFloat(service.service_discount_amount.toString())
                      : (parseFloat(service.total_revenue || "0") *
                          parseFloat(
                            (
                              service.service_discount_percentage || 0
                            ).toString(),
                          )) /
                          100,
                  )}
                </p>
              </div>
              <div className="flex items-center gap-3 text-xs text-muted-foreground">
                <span>
                  {service.service_discount_percentage &&
                  parseFloat(service.service_discount_percentage.toString()) > 0
                    ? `${service.service_discount_percentage}%`
                    : `Fixed: ${formatCurrency(parseFloat((service.service_discount_amount || 0).toString()))}`}
                </span>
                {service.discount_reason && (
                  <>
                    <span>·</span>
                    <span>{service.discount_reason}</span>
                  </>
                )}
              </div>
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
                  <CheckCircle className="h-2.5 w-2.5 text-green-500" />
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
                  <Truck className="h-2.5 w-2.5 text-green-500" />
                </div>
                <div className="pt-px">
                  <p className="text-sm font-semibold leading-none text-green-700 dark:text-green-300">
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
                  <p className="text-sm font-semibold leading-none text-green-600">
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

          {/* Empty State */}
          {!service.pickup_date &&
            !service.delivery_date &&
            !service.received_at &&
            !isCompleted &&
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
            : service.appliances && service.appliances.length > 0
              ? `Complete service #${service.id}? This will finalize stock consumption, create transactions, and mark the service as completed.`
              : `Complete service #${service.id}? Note: This service has no appliances/items. No sales transactions will be created.`
        }
        onConfirm={handleComplete}
        confirmText={hasUnfinishedAppliances ? "Close" : "Complete Service"}
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
                <span className="font-medium text-green-600">
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
                      ? "text-green-600"
                      : "text-red-600"
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
      <div className="hidden">
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
    </div>
  )
}
