"use client"

import { ConfirmDialog } from "@/components/custom/shared/ConfirmDialog"
import ServiceApplianceManager from "@/components/forms/ServiceApplianceManager"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
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
import { Service } from "@/lib/constants/interface"
import { useServiceMutations } from "@/lib/mutations/services/useServiceMutations"
import { useSchedulesByService } from "@/lib/queries/useSchedules"
import { formatCurrency, getBadgeVariant } from "@/lib/utils/helpers"
import { formatDate } from "@/lib/utils/helpers/date"
import {
  Calendar,
  CheckCircle,
  Clock,
  Edit,
  Info,
  MapPin,
  Package,
  Phone,
  Truck,
  User,
  Wallet,
  Wrench,
} from "lucide-react"
import { useState } from "react"
import { toast } from "sonner"

interface ServiceDetailProps {
  service: Service
  onEdit?: () => void
  onRefresh?: () => void
}

const serviceTypeLabels: Record<string, string> = {
  repair: "Repair",
  inspection: "Inspection",
  cleaning: "Cleaning",
  motor_rewind: "Motor Rewind",
  installation: "Installation",
}

const serviceModeLabels: Record<string, string> = {
  home_service: "Home Service",
  carry_in: "Carry In",
  pull_out: "Pull-Out",
}

const serviceStatusLabels: Record<string, string> = {
  pending: "Pending",
  in_progress: "In Progress",
  completed: "Completed",
  cancelled: "Cancelled",
}

const paymentStatusLabels: Record<string, string> = {
  pending: "Pending",
  unpaid: "Unpaid",
  partial: "Partially Paid",
  paid: "Paid",
}

export default function ServiceDetail({
  service,
  onEdit,
  onRefresh,
}: ServiceDetailProps) {
  const [completeDialogOpen, setCompleteDialogOpen] = useState(false)
  const [paymentDialogOpen, setPaymentDialogOpen] = useState(false)
  const [paymentAmount, setPaymentAmount] = useState("")
  const [paymentType, setPaymentType] = useState("cash")
  const [paymentNotes, setPaymentNotes] = useState("")
  const { completeService, recordPayment } = useServiceMutations()
  const { data: schedules = [], isLoading: schedulesLoading } =
    useSchedulesByService(service.id)

  const canComplete =
    service.status === "pending" || service.status === "in_progress"
  const isCompleted = service.status === "completed"
  const isCarryIn = service.service_mode === "carry_in"

  // Check if all appliances are ready for completion
  const hasUnfinishedAppliances = service.appliances?.some(
    (appliance) =>
      appliance.status !== "completed" &&
      appliance.status !== "ready_for_pickup" &&
      appliance.status !== "delivered",
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
        if (data?.receipt) {
          toast.info("Receipt created successfully.")
        } else {
          toast.warning(
            data?.message || "Service completed but no receipt was created.",
          )
        }
        setCompleteDialogOpen(false)
        onRefresh?.()
      },
    })
  }

  const handleAddPayment = () => {
    setPaymentAmount(service.balance_due || service.total_revenue || "0")
    setPaymentType("cash")
    setPaymentNotes("")
    setPaymentDialogOpen(true)
  }

  const handlePaymentSubmit = () => {
    if (!paymentAmount || parseFloat(paymentAmount) <= 0) {
      toast.error("Please enter a valid payment amount")
      return
    }

    recordPayment.mutate(
      {
        id: service.id,
        data: {
          payment_type: paymentType,
          amount: paymentAmount,
          notes: paymentNotes || undefined,
        },
      },
      {
        onSuccess: () => {
          toast.success("Payment recorded successfully!")
          setPaymentDialogOpen(false)
          setPaymentAmount("")
          setPaymentType("cash")
          setPaymentNotes("")
          onRefresh?.()
        },
        onError: () => {
          toast.error("Failed to record payment")
        },
      },
    )
  }

  return (
    <div className="space-y-4">
      {/* Action Buttons */}
      <div className="flex justify-end gap-2">
        {!isCompleted && onEdit && (
          <Button
            variant="outline"
            size="sm"
            onClick={onEdit}
          >
            <Edit className="mr-2 h-4 w-4" />
            Edit
          </Button>
        )}
        {canComplete && (
          <Button
            size="sm"
            variant="success"
            onClick={() => setCompleteDialogOpen(true)}
          >
            <CheckCircle className="mr-2 h-4 w-4" />
            Complete Service
          </Button>
        )}
      </div>

      {/* Status Badges */}
      <div className="flex flex-wrap gap-2">
        <Badge variant={getBadgeVariant(service.status)}>
          {serviceStatusLabels[service.status] || service.status}
        </Badge>
        <Badge
          variant={
            ({
              repair: "warning",
              inspection: "default",
              cleaning: "success",
              motor_rewind: "destructive",
              installation: "default",
            }[service.service_type] || "outline") as
              | "success"
              | "default"
              | "destructive"
              | "outline"
              | "secondary"
              | "warning"
          }
        >
          {serviceTypeLabels[service.service_type] || service.service_type}
        </Badge>
        <Badge
          variant={
            ({
              home_service: "default",
              carry_in: "secondary",
              pull_out: "outline",
            }[service.service_mode] || "secondary") as
              | "success"
              | "default"
              | "destructive"
              | "outline"
              | "secondary"
              | "warning"
          }
        >
          {serviceModeLabels[service.service_mode] || service.service_mode}
        </Badge>
        <Badge variant={getBadgeVariant(service.payment_status)}>
          {paymentStatusLabels[service.payment_status] ||
            service.payment_status}
        </Badge>
      </div>

      {/* Tabs */}
      <Tabs
        defaultValue="overview"
        className="w-full"
      >
        <TabsList className="grid w-full space-x-2 grid-cols-4 h-auto">
          <TabsTrigger
            value="overview"
            className="text-xs sm:text-sm"
          >
            Overview
          </TabsTrigger>
          <TabsTrigger
            value="appliances"
            className="text-xs sm:text-sm"
          >
            <span className="hidden sm:inline">Appliances</span>
            <span className="inline sm:hidden">Items</span>
            {service.appliances && service.appliances.length > 0 && (
              <span className="ml-1 sm:ml-2 rounded-full bg-primary px-1.5 sm:px-2 py-0.5 text-xs text-primary-foreground">
                {service.appliances.length}
              </span>
            )}
          </TabsTrigger>
          <TabsTrigger
            value="payments"
            className="text-xs sm:text-sm"
          >
            Payments
          </TabsTrigger>
          <TabsTrigger
            value="schedule"
            className="text-xs sm:text-sm"
          >
            Schedule
          </TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent
          value="overview"
          className="space-y-4"
        >
          <div className="grid gap-4 ">
            {/* Client Information */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center text-base">
                  <User className="mr-2 h-4 w-4" />
                  Client Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">
                    Name
                  </p>
                  <p className="text-sm">
                    {service.client?.full_name || "N/A"}
                  </p>
                </div>
                {service.client?.contact_number && (
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">
                      Contact
                    </p>
                    <p className="flex items-center text-sm">
                      <Phone className="mr-2 h-3 w-3" />
                      {service.client.contact_number}
                    </p>
                  </div>
                )}
                {service.client?.address && (
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">
                      Address
                    </p>
                    <p className="flex items-start text-sm">
                      <MapPin className="mr-2 mt-0.5 h-3 w-3 shrink-0" />
                      {service.client.address}
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Service Information */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center text-base">
                  <Wrench className="mr-2 h-4 w-4" />
                  Service Details
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="flex justify-between">
                  <p className="text-sm font-medium text-muted-foreground">
                    Type
                  </p>
                  <p className="text-sm">
                    {serviceTypeLabels[service.service_type] ||
                      service.service_type}
                  </p>
                </div>
                <div className="flex justify-between">
                  <p className="text-sm font-medium text-muted-foreground">
                    Mode
                  </p>
                  <p className="text-sm">
                    {serviceModeLabels[service.service_mode] ||
                      service.service_mode}
                  </p>
                </div>
                <div className="flex justify-between">
                  <p className="text-sm font-medium text-muted-foreground">
                    Status
                  </p>
                  <Badge variant={getBadgeVariant(service.status)}>
                    {serviceStatusLabels[service.status] || service.status}
                  </Badge>
                </div>
              </CardContent>
            </Card>

            {/* Appliances Breakdown */}
            {service.appliances && service.appliances.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center text-base">
                    <Package className="mr-2 h-4 w-4" />
                    Appliances & Charges
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {service.appliances.map((appliance) => {
                    const laborFee = parseFloat(appliance.labor_fee || "0")
                    const partsCost = parseFloat(
                      appliance.total_parts_cost || "0",
                    )
                    const applianceTotal = laborFee + partsCost

                    return (
                      <div
                        key={appliance.id}
                        className="rounded-lg border p-3 space-y-2"
                      >
                        <div className="flex items-start justify-between">
                          <div>
                            <p className="font-medium text-sm">
                              {appliance.appliance_type?.name ||
                                "Unknown Appliance"}
                            </p>
                            {(appliance.brand || appliance.model) && (
                              <p className="text-xs text-muted-foreground">
                                {[appliance.brand, appliance.model]
                                  .filter(Boolean)
                                  .join(" ")}
                              </p>
                            )}
                          </div>
                          <Badge variant={getBadgeVariant(appliance.status)}>
                            {appliance.status}
                          </Badge>
                        </div>

                        <Separator />

                        <div className="space-y-1 text-sm">
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">
                              Labor Fee
                            </span>
                            <span>{formatCurrency(laborFee)}</span>
                          </div>
                          {appliance.items_used &&
                            appliance.items_used.length > 0 && (
                              <>
                                <div className="flex justify-between">
                                  <span className="text-muted-foreground">
                                    Parts ({appliance.items_used.length} items)
                                  </span>
                                  <span>{formatCurrency(partsCost)}</span>
                                </div>
                                {/* Show parts details */}
                                <div className="ml-4 mt-1 space-y-1 text-xs">
                                  {appliance.items_used.map((part) => (
                                    <div
                                      key={part.id}
                                      className="flex justify-between text-muted-foreground"
                                    >
                                      <span>
                                        • {part.item_name} (x{part.quantity})
                                      </span>
                                      <span>
                                        {formatCurrency(part.line_total)}
                                      </span>
                                    </div>
                                  ))}
                                </div>
                              </>
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
                </CardContent>
              </Card>
            )}

            {/* Financial Summary */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center text-base">
                  <Wallet className="mr-2 h-4 w-4" />
                  Financial Summary
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
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
                    {formatCurrency(
                      parseFloat(service.sub_stall_revenue || "0"),
                    )}
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
                      {formatCurrency(parseFloat(service.total_paid))}
                    </p>
                  </div>
                )}
                {service.balance_due && parseFloat(service.balance_due) > 0 && (
                  <div className="flex items-center justify-between text-sm">
                    <p className="text-muted-foreground">Balance Due</p>
                    <p className="font-medium text-red-600">
                      {formatCurrency(parseFloat(service.balance_due))}
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Description & Notes */}
          {(service.description || service.remarks || service.notes) && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">
                  Additional Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {service.description && (
                  <div>
                    <p className="mb-1 text-sm font-medium text-muted-foreground">
                      Description
                    </p>
                    <p className="text-sm">{service.description}</p>
                  </div>
                )}
                {service.remarks && (
                  <div>
                    <p className="mb-1 text-sm font-medium text-muted-foreground">
                      Remarks
                    </p>
                    <p className="text-sm">{service.remarks}</p>
                  </div>
                )}
                {service.notes && (
                  <div>
                    <p className="mb-1 text-sm font-medium text-muted-foreground">
                      Internal Notes
                    </p>
                    <p className="text-sm">{service.notes}</p>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Technicians */}
          {service.technician_assignments &&
            service.technician_assignments.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">
                    Assigned Technicians
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {service.technician_assignments.map((assignment, index) => (
                      <div
                        key={index}
                        className="flex items-center gap-3 rounded-md border p-2"
                      >
                        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10">
                          <User className="h-4 w-4 text-primary" />
                        </div>
                        <div className="flex-1">
                          <p className="text-sm font-medium">
                            {assignment.technician_name ||
                              `Technician #${assignment.technician}`}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {assignment.assignment_type
                              .replace("_", " ")
                              .replace(/\b\w/g, (l) => l.toUpperCase())}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

          {/* Service Location Details - Only show if NOT carry-in */}
          {!isCarryIn &&
            (service.override_address ||
              service.override_contact_person ||
              service.override_contact_number) && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Service Location</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  {service.override_contact_person && (
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">
                        Contact Person
                      </p>
                      <p className="text-sm">
                        {service.override_contact_person}
                      </p>
                    </div>
                  )}
                  {service.override_contact_number && (
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">
                        Contact Number
                      </p>
                      <p className="flex items-center text-sm">
                        <Phone className="mr-2 h-3 w-3" />
                        {service.override_contact_number}
                      </p>
                    </div>
                  )}
                  {service.override_address && (
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">
                        Service Address
                      </p>
                      <p className="flex items-start text-sm">
                        <MapPin className="mr-2 mt-0.5 h-3 w-3 shrink-0" />
                        {service.override_address}
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}
        </TabsContent>

        {/* Appliances Tab */}
        <TabsContent
          value="appliances"
          className="space-y-4"
        >
          <ServiceApplianceManager
            serviceId={service.id}
            appliances={service.appliances || []}
            onUpdate={onRefresh}
            disabled={isCompleted}
          />

          {!isCompleted &&
            (!service.appliances || service.appliances.length === 0) && (
              <Card className="border-dashed">
                <CardContent className="p-6 text-center">
                  <Wrench className="mx-auto mb-2 h-8 w-8 text-muted-foreground" />
                  <p className="text-sm text-muted-foreground">
                    No appliances added yet. Add appliances to generate sales
                    when completing this service.
                  </p>
                </CardContent>
              </Card>
            )}
        </TabsContent>

        {/* Payments Tab */}
        <TabsContent
          value="payments"
          className="space-y-4"
        >
          {/* Info Alert */}
          {!isCompleted && (
            <Alert variant="info">
              <Info className="h-4 w-4" />
              <AlertDescription>
                You can record down payments or partial payments anytime before
                completing the service. All payments will be tracked and
                properly recorded when the service is completed.
              </AlertDescription>
            </Alert>
          )}

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Payment History</CardTitle>
            </CardHeader>
            <CardContent>
              {service.payments && service.payments.length > 0 ? (
                <div className="space-y-2">
                  {service.payments.map((payment, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between rounded-md border p-2"
                    >
                      <div>
                        <p className="text-sm font-medium">
                          {formatCurrency(
                            parseFloat(payment.amount.toString()),
                          )}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {payment.payment_type}
                        </p>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {formatDate(
                          new Date(payment.created_at),
                          "EEEE, MMMM d, yyyy",
                        )}
                      </p>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="py-8 text-center">
                  <Wallet className="mx-auto mb-2 h-8 w-8 text-muted-foreground" />
                  <p className="text-sm text-muted-foreground">
                    No payments recorded yet
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Payment Summary Card */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Payment Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <p className="text-muted-foreground">Total Amount</p>
                <p className="font-medium">
                  {formatCurrency(parseFloat(service.total_revenue || "0"))}
                </p>
              </div>
              <div className="flex items-center justify-between text-sm">
                <p className="text-muted-foreground">Total Paid</p>
                <p className="font-medium text-green-600">
                  {formatCurrency(parseFloat(service.total_paid || "0"))}
                </p>
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium">Balance Due</p>
                <p className="text-lg font-bold text-red-600">
                  {formatCurrency(parseFloat(service.balance_due || "0"))}
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Add Payment Button */}
          {/* {!isCompleted && ( */}
          <Button
            className="w-full"
            variant="outline"
            onClick={handleAddPayment}
          >
            <Wallet className="mr-2 h-4 w-4" />
            Record Payment
          </Button>
          {/* )} */}
        </TabsContent>

        {/* Schedule Tab */}
        <TabsContent
          value="schedule"
          className="space-y-4"
        >
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Schedule & Timeline</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {/* Created */}
              <div className="flex items-start gap-3 rounded-md border p-3">
                <Calendar className="mt-1 h-5 w-5 text-primary" />
                <div className="flex-1">
                  <p className="text-sm font-medium">Service Created</p>
                  <p className="text-xs text-muted-foreground">
                    {formatDate(
                      new Date(service.created_at),
                      "EEEE, MMMM d, yyyy",
                    )}
                  </p>
                </div>
              </div>

              {/* Received At (Carry-In) */}
              {service.received_at && (
                <div className="flex items-start gap-3 rounded-md border p-3">
                  <CheckCircle className="mt-1 h-5 w-5 text-green-600" />
                  <div className="flex-1">
                    <p className="text-sm font-medium">Received At Shop</p>
                    <p className="text-xs text-muted-foreground">
                      {formatDate(
                        new Date(service.received_at),
                        "EEEE, MMMM d, yyyy",
                      )}
                    </p>
                  </div>
                </div>
              )}

              {/* Pickup Date (Pull-Out) */}
              {service.pickup_date && (
                <div className="flex items-start gap-3 rounded-md border p-3">
                  <Truck className="mt-1 h-5 w-5 text-primary" />
                  <div className="flex-1">
                    <p className="text-sm font-medium">Pickup Scheduled</p>
                    <p className="text-xs text-muted-foreground">
                      {formatDate(
                        new Date(service.pickup_date),
                        "EEEE, MMMM d, yyyy",
                      )}
                    </p>
                  </div>
                </div>
              )}

              {/* Delivery Date (Pull-Out) */}
              {service.delivery_date && (
                <div className="flex items-start gap-3 rounded-md border p-3">
                  <Package className="mt-1 h-5 w-5 text-primary" />
                  <div className="flex-1">
                    <p className="text-xs sm:text-sm font-medium">
                      Delivery Scheduled
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {formatDate(
                        new Date(service.delivery_date),
                        "EEEE, MMMM d, yyyy",
                      )}
                    </p>
                  </div>
                </div>
              )}

              {/* Schedules for Home Services */}
              {service.service_mode === "home_service" &&
                schedules.length > 0 && (
                  <div className="space-y-3 mt-4 pt-4 border-t">
                    <h5 className="font-medium text-sm">
                      Scheduled Appointments
                    </h5>
                    {schedules.map((schedule) => (
                      <div
                        key={schedule.id}
                        className="flex items-start gap-3 rounded-md border p-3 bg-muted/30"
                      >
                        <Calendar className="mt-1 h-5 w-5 text-primary shrink-0" />
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <p className="text-sm font-medium">
                              {formatDate(
                                new Date(schedule.scheduled_date),
                                "EEEE, MMMM d, yyyy",
                              )}
                            </p>
                            <Badge
                              variant="outline"
                              className="text-xs"
                            >
                              {schedule.status}
                            </Badge>
                          </div>
                          <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
                            <Clock className="h-3 w-3" />
                            <span>{schedule.scheduled_time}</span>
                            <span>({schedule.estimated_duration} mins)</span>
                          </div>
                          {schedule.technicians &&
                            schedule.technicians.length > 0 && (
                              <div className="mt-2">
                                <p className="text-xs font-medium mb-1">
                                  Assigned Technicians:
                                </p>
                                <div className="flex flex-wrap gap-1">
                                  {schedule.technicians.map((tech) => (
                                    <Badge
                                      key={tech.id}
                                      variant="secondary"
                                      className="text-xs"
                                    >
                                      {tech.full_name}
                                    </Badge>
                                  ))}
                                </div>
                              </div>
                            )}
                          {schedule.address && (
                            <div className="flex items-start gap-2 mt-2">
                              <MapPin className="mt-0.5 h-3 w-3 text-muted-foreground shrink-0" />
                              <p className="text-xs text-muted-foreground">
                                {schedule.address}
                              </p>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}

              {/* Empty State */}
              {!service.pickup_date &&
                !service.delivery_date &&
                !service.received_at &&
                (schedulesLoading || schedules.length === 0) && (
                  <div className="py-8 text-center">
                    <Calendar className="mx-auto mb-2 h-8 w-8 text-muted-foreground" />
                    <p className="text-sm text-muted-foreground">
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
                    className="w-full"
                    variant="outline"
                  >
                    <Truck className="mr-2 h-4 w-4" />
                    Schedule Delivery
                  </Button>
                )}
            </CardContent>
          </Card>
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
                onValueChange={setPaymentType}
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
            <div className="space-y-2">
              <Label htmlFor="amount">Amount (₱)</Label>
              <Input
                id="amount"
                type="number"
                step="0.01"
                value={paymentAmount}
                onChange={(e) => setPaymentAmount(e.target.value)}
                placeholder="0.00"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="notes">Notes (Optional)</Label>
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
                <span className="text-muted-foreground">Total Amount</span>
                <span className="font-medium">
                  {formatCurrency(parseFloat(service.total_revenue || "0"))}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Balance Due</span>
                <span className="font-medium text-red-600">
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
    </div>
  )
}
