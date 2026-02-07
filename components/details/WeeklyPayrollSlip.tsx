"use client"

import { DeveloperCredit } from "@/components/custom/shared/DeveloperCredit"
import { AddAdditionalEarningForm } from "@/components/forms/AddAdditionalEarningForm"
import { AddManualDeductionForm } from "@/components/forms/AddManualDeductionForm"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Separator } from "@/components/ui/separator"
import { Textarea } from "@/components/ui/textarea"
import { SHOP_INFO } from "@/lib/constants/meta"
import { PayrollStatus } from "@/lib/constants/types"
import { useCurrentUser } from "@/lib/hooks/useCurrentUser"
import { useRecomputeWeeklyPayroll } from "@/lib/mutations/payroll/usePayrollMutations"
import { useDeleteAdditionalEarning } from "@/lib/mutations/useAdditionalEarningMutations"
import { useDeleteManualDeduction } from "@/lib/mutations/useManualDeductionMutations"
import { usePayrollMutations } from "@/lib/mutations/usePayrollMutations"
import { useWeeklyPayroll } from "@/lib/queries/usePayroll"
import { cn } from "@/lib/utils/helpers"
import { format } from "date-fns"
import {
  AlertCircle,
  Banknote,
  Building,
  CheckCircle,
  Clock,
  FileText,
  Loader2,
  LucideIcon,
  Minus,
  PhilippinePesoIcon,
  Plus,
  RefreshCw,
  User,
  X,
} from "lucide-react"
import { useState } from "react"

interface WeeklyPayrollSlipProps {
  className?: string
  payrollId: number
}

const CATEGORY_COLOR_MAP: Record<string, string> = {
  late_penalty:
    "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300 border-red-300 dark:border-red-600",
  government:
    "bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-300 border-orange-300 dark:border-orange-600",
  manual:
    "bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300 border-green-300 dark:border-green-600",
  other:
    "bg-gray-100 text-gray-700 dark:bg-gray-900/40 dark:text-gray-300 border-gray-300 dark:border-gray-600",
}

const getCategoryBadgeColor = (category?: string): string => {
  if (!category) return CATEGORY_COLOR_MAP.other
  const key = category.toLowerCase()
  return (
    Object.entries(CATEGORY_COLOR_MAP).find(([k]) => key === k)?.[1] ||
    CATEGORY_COLOR_MAP.other
  )
}

const STATUS_CONFIG: Record<
  PayrollStatus,
  { color: string; icon: LucideIcon; label: string }
> = {
  draft: {
    color:
      "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300 border-gray-300 dark:border-gray-600",
    icon: FileText,
    label: "Draft",
  },
  approved: {
    color:
      "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300 border-green-300 dark:border-green-600",
    icon: CheckCircle,
    label: "Approved",
  },
  paid: {
    color:
      "bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300 border-blue-300 dark:border-blue-600",
    icon: Banknote,
    label: "Paid",
  },
  received: {
    color:
      "bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300 border-purple-300 dark:border-purple-600",
    icon: CheckCircle,
    label: "Received",
  },
  cancelled: {
    color:
      "bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300 border-red-300 dark:border-red-600",
    icon: AlertCircle,
    label: "Cancelled",
  },
}

export function WeeklyPayrollSlip({
  className,
  payrollId,
}: WeeklyPayrollSlipProps) {
  const { data: payroll, isLoading } = useWeeklyPayroll(payrollId)
  const { userProfile, isAdmin, canManage } = useCurrentUser()
  const { updateStatus, markAsReceived, disputePayroll } = usePayrollMutations()
  const recomputePayroll = useRecomputeWeeklyPayroll(payrollId)
  const deleteManualDeduction = useDeleteManualDeduction(payrollId)

  const [disputeDialogOpen, setDisputeDialogOpen] = useState(false)
  const [disputeReason, setDisputeReason] = useState("")
  const [isProcessing, setIsProcessing] = useState(false)
  const [manualDeductionDialogOpen, setManualDeductionDialogOpen] =
    useState(false)
  const [additionalEarningDialogOpen, setAdditionalEarningDialogOpen] =
    useState(false)
  const [deleteDeductionId, setDeleteDeductionId] = useState<number | null>(
    null,
  )
  const [deleteEarningId, setDeleteEarningId] = useState<number | null>(null)
  const deleteAdditionalEarning = useDeleteAdditionalEarning(payrollId)

  if (isLoading) {
    return (
      <Card className={cn("mx-auto", className)}>
        <CardContent className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    )
  }

  if (!payroll) {
    return (
      <Card className={cn("mx-auto", className)}>
        <CardContent className="flex items-center justify-center py-12">
          <p className="text-muted-foreground">Payroll slip not found</p>
        </CardContent>
      </Card>
    )
  }

  const statusConfig = STATUS_CONFIG[payroll.status]
  const StatusIcon = statusConfig.icon
  const weekStartDate = new Date(payroll.week_start)
  const weekEndDate = new Date(payroll.week_end || payroll.week_start)

  // Convert string values to numbers for display
  const toNumber = (value: string | number | undefined) =>
    typeof value === "string" ? parseFloat(value) || 0 : value || 0

  const regularHours = toNumber(payroll.regular_hours)
  const approvedOtHours = toNumber(payroll.approved_ot_hours)
  const nightDiffHours = toNumber(payroll.night_diff_hours)
  const holidayPayRegular = toNumber(payroll.holiday_pay_regular || 0)
  const holidayPaySpecial = toNumber(payroll.holiday_pay_special || 0)
  const holidayPayTotal = toNumber(payroll.holiday_pay_total || 0)

  const grossPay = toNumber(payroll.gross_pay)
  const nightDiffPay = toNumber(payroll.night_diff_pay)
  const approvedOtPay = toNumber(payroll.approved_ot_pay)
  const allowances = toNumber(payroll.allowances)
  const additionalEarnings = toNumber(payroll.additional_earnings_total)

  // gross_pay already includes additional_earnings_total from backend
  const totalEarnings = grossPay
  const totalDeductions = toNumber(payroll.total_deductions)
  const netPay = toNumber(payroll.net_pay)

  // Get employee info from backend
  const employeeName =
    payroll.employee_name || payroll.employee_detail?.full_name || "N/A"
  const employeeRole = payroll.employee_detail?.role || "N/A"
  const employeeDailyRate = toNumber(payroll.employee_detail?.daily_rate) || 0
  const employeeHourlyRate = toNumber(payroll.employee_detail?.hourly_rate) || 0

  return (
    <Card className={cn("mx-auto w-full shadow-lg", className)}>
      <CardHeader className="space-y-3">
        {/* Title and Badge Row */}
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <CardTitle className="text-lg sm:text-xl font-bold print:text-xl">
              Payroll Slip
            </CardTitle>
            <CardDescription className="text-xs mt-1 print:text-xs">
              {format(weekStartDate, "MMM dd")} -{" "}
              {format(weekEndDate, "MMM dd, yyyy")}
            </CardDescription>
          </div>
          <Badge className={cn("gap-1.5 shrink-0", statusConfig.color)}>
            <StatusIcon className="h-3 w-3" />
            <span className="text-xs">{statusConfig.label}</span>
          </Badge>
        </div>

        {/* Action Buttons */}
        {isAdmin && (
          <div className="grid md:grid-cols-4 gap-3 print:hidden">
            {payroll.status === "draft" && (
              <>
                <Button
                  size="sm"
                  variant="success"
                  onClick={() => setAdditionalEarningDialogOpen(true)}
                  disabled={isProcessing}
                >
                  <Plus className="h-3.5 w-3.5 mr-1.5" />
                  Add Earning
                </Button>
                <Button
                  size="sm"
                  variant="warning"
                  onClick={() => setManualDeductionDialogOpen(true)}
                  disabled={isProcessing}
                >
                  <PhilippinePesoIcon className="h-3.5 w-3.5 mr-1.5" />
                  Add Deduction
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={async () => {
                    setIsProcessing(true)
                    await recomputePayroll.mutateAsync({})
                    setIsProcessing(false)
                  }}
                  disabled={isProcessing || recomputePayroll.isPending}
                >
                  <RefreshCw className="h-3.5 w-3.5 mr-1.5" />
                  Recompute
                </Button>

                <Button
                  size="sm"
                  variant="success"
                  onClick={async () => {
                    setIsProcessing(true)
                    await updateStatus.mutateAsync({
                      id: payrollId,
                      status: "approved",
                    })
                    setIsProcessing(false)
                  }}
                  disabled={isProcessing || updateStatus.isPending}
                >
                  <CheckCircle className="h-3.5 w-3.5 mr-1.5" />
                  Approve
                </Button>
              </>
            )}
            {payroll.status === "approved" && (
              <Button
                size="sm"
                variant="success"
                className="col-span-full"
                onClick={async () => {
                  setIsProcessing(true)
                  await updateStatus.mutateAsync({
                    id: payrollId,
                    status: "paid",
                  })
                  setIsProcessing(false)
                }}
                disabled={isProcessing || updateStatus.isPending}
              >
                <Banknote className="h-3.5 w-3.5 mr-1.5" />
                Mark as Paid
              </Button>
            )}
          </div>
        )}

        {!isAdmin &&
          userProfile?.id === payroll.employee &&
          payroll.status === "paid" &&
          !payroll.disputed && (
            <div className="grid md:grid-cols-2 gap-2 print:hidden">
              <Button
                size="sm"
                variant="success"
                onClick={async () => {
                  setIsProcessing(true)
                  await markAsReceived.mutateAsync({
                    id: payrollId,
                  })
                  setIsProcessing(false)
                }}
                disabled={isProcessing || markAsReceived.isPending}
              >
                <CheckCircle className="h-3.5 w-3.5 mr-1.5" />
                Mark Received
              </Button>
              <Button
                size="sm"
                variant="destructive"
                onClick={() => setDisputeDialogOpen(true)}
                disabled={isProcessing}
              >
                <AlertCircle className="h-3.5 w-3.5 mr-1.5" />
                Dispute
              </Button>
            </div>
          )}
      </CardHeader>

      <CardContent className="space-y-3">
        {/* Company & Employee Info - Compact Cards */}
        <div className="grid md:grid-cols-2 gap-3">
          <div className="rounded-lg border bg-card p-3">
            <div className="flex items-center gap-2 mb-2">
              <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                <Building className="h-4 w-4 text-primary" />
              </div>
              <h3 className="text-sm sm:text-base font-semibold">Company</h3>
            </div>
            <div className="space-y-0.5 text-xs sm:text-sm text-muted-foreground">
              <p className="font-medium text-foreground">{SHOP_INFO.name}</p>
              <p>{SHOP_INFO.address}</p>
              <p>{SHOP_INFO.contactEmail}</p>
            </div>
          </div>

          <div className="rounded-lg border bg-card p-3">
            <div className="flex items-center gap-2 mb-2">
              <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                <User className="h-4 w-4 text-primary" />
              </div>
              <h3 className="text-sm sm:text-base font-semibold">Employee</h3>
            </div>
            <div className="space-y-0.5 text-xs sm:text-sm">
              <div className="flex justify-between gap-2">
                <span className="text-muted-foreground">Name:</span>
                <span className="font-medium text-right truncate">
                  {employeeName}
                </span>
              </div>
              <div className="flex justify-between gap-2">
                <span className="text-muted-foreground">Position:</span>
                <span className="text-right capitalize truncate">
                  {employeeRole}
                </span>
              </div>
              <div className="flex justify-between gap-2">
                <span className="text-muted-foreground">Daily:</span>
                <span className="font-medium">
                  ₱{employeeDailyRate.toLocaleString()}
                </span>
              </div>
              <div className="flex justify-between gap-2">
                <span className="text-muted-foreground">Hourly:</span>
                <span className="font-medium">
                  ₱{employeeHourlyRate.toLocaleString()}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Time Summary - Compact Grid */}
        <div className="rounded-lg border p-3">
          <div className="flex items-center gap-2 mb-2.5">
            <Clock className="h-4 w-4 text-primary" />
            <h3 className="text-sm sm:text-base font-semibold">Time Summary</h3>
          </div>
          <div className="grid sm:grid-cols-2 md:grid-cols-4 gap-2">
            <div className="text-center p-2 rounded-md bg-white/80 dark:bg-gray-900/40 border">
              <p className="text-lg font-bold text-blue-600 dark:text-blue-400">
                {regularHours.toFixed(1)}
              </p>
              <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
                Regular
              </p>
            </div>
            <div className="text-center p-2 rounded-md bg-white/80 dark:bg-gray-900/40 border">
              <p className="text-lg font-bold text-orange-600 dark:text-orange-400">
                {approvedOtHours.toFixed(1)}
              </p>
              <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
                Approved OT
              </p>
            </div>
            <div className="text-center p-2 rounded-md bg-white/80 dark:bg-gray-900/40 border">
              <p className="text-lg font-bold text-green-600 dark:text-green-400">
                {(
                  (holidayPayRegular + holidayPaySpecial) /
                  toNumber(payroll.hourly_rate)
                ).toFixed(1)}
              </p>
              <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
                Holiday
              </p>
            </div>
            <div className="text-center p-2 rounded-md bg-white/80 dark:bg-gray-900/40 border">
              <p className="text-lg font-bold text-purple-600 dark:text-purple-400">
                {nightDiffHours.toFixed(1)}
              </p>
              <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
                Night Diff
              </p>
            </div>
          </div>
        </div>

        {/* Earnings and Deductions - Side by Side */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
          {/* Earnings */}
          <div className="rounded-lg border border-green-200/60 dark:border-green-900/40 bg-linear-to-br from-green-50/30 to-emerald-50/30 dark:from-green-950/10 dark:to-emerald-950/10 p-3 flex flex-col">
            <div className="flex items-center gap-2 mb-2.5">
              <Plus className="h-4 w-4 text-green-600 dark:text-green-400" />
              <h3 className="text-sm sm:text-base font-semibold text-green-700 dark:text-green-400">
                Earnings
              </h3>
            </div>
            <div className="space-y-1.5">
              {/* Basic Pay - Regular hours only */}
              <div className="flex justify-between text-xs sm:text-sm">
                <span className="text-muted-foreground">Basic Pay</span>
                <span className="font-medium">
                  ₱
                  {(
                    grossPay -
                    nightDiffPay -
                    approvedOtPay -
                    holidayPayTotal -
                    allowances -
                    additionalEarnings
                  ).toLocaleString(undefined, {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}
                </span>
              </div>

              {/* Approved Overtime - Show only if > 0 */}
              {approvedOtPay > 0 && (
                <div className="flex justify-between text-xs sm:text-sm">
                  <span className="text-muted-foreground">Overtime</span>
                  <span className="font-medium">
                    ₱
                    {approvedOtPay.toLocaleString(undefined, {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}
                  </span>
                </div>
              )}

              {/* Holiday Pay */}
              {holidayPayTotal > 0 && (
                <div className="flex justify-between text-xs sm:text-sm">
                  <span className="text-muted-foreground">Holiday</span>
                  <span className="font-medium">
                    ₱
                    {holidayPayTotal.toLocaleString(undefined, {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}
                  </span>
                </div>
              )}

              {/* Night Differential */}
              {nightDiffPay > 0 && (
                <div className="flex justify-between text-xs sm:text-sm">
                  <span className="text-muted-foreground">Night Diff</span>
                  <span className="font-medium">
                    ₱
                    {nightDiffPay.toLocaleString(undefined, {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}
                  </span>
                </div>
              )}

              {/* Allowances */}
              {allowances > 0 && (
                <div className="flex justify-between text-xs sm:text-sm">
                  <span className="text-muted-foreground">Allowances</span>
                  <span className="font-medium">
                    ₱
                    {allowances.toLocaleString(undefined, {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}
                  </span>
                </div>
              )}

              {/* Additional Earnings - Show each with details if available */}
              {additionalEarnings > 0 && (
                <>
                  {payroll.additional_earnings_details &&
                  payroll.additional_earnings_details.length > 0 ? (
                    payroll.additional_earnings_details.map((earning) => {
                      const earningAmount = toNumber(earning.amount)
                      const canDelete = isAdmin && payroll.status === "draft"

                      return (
                        <div
                          key={earning.id}
                          className="flex justify-between items-start text-xs sm:text-sm gap-2 group"
                        >
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-1.5">
                              {canManage && (
                                <Badge
                                  variant="outline"
                                  className="text-xs px-1.5 py-0 capitalize"
                                >
                                  {earning.category}
                                </Badge>
                              )}
                              <span className="text-muted-foreground truncate">
                                {earning.description ||
                                  earning.reference ||
                                  "Additional Earning"}
                              </span>
                            </div>
                            {earning.description && earning.reference && (
                              <p className="text-[10px] text-muted-foreground/70 mt-0.5">
                                Ref: {earning.reference}
                              </p>
                            )}
                          </div>
                          <div className="flex items-center gap-2 shrink-0">
                            <span className="font-medium">
                              ₱
                              {earningAmount.toLocaleString(undefined, {
                                minimumFractionDigits: 2,
                                maximumFractionDigits: 2,
                              })}
                            </span>
                            {canDelete && (
                              <Button
                                variant="destructive"
                                size="sm"
                                className="h-6 w-6 p-0 print:hidden opacity-0 group-hover:opacity-100 transition-opacity"
                                onClick={() => setDeleteEarningId(earning.id)}
                              >
                                <X className="size-3" />
                              </Button>
                            )}
                          </div>
                        </div>
                      )
                    })
                  ) : (
                    <div className="flex justify-between text-xs sm:text-sm">
                      <span className="text-muted-foreground">Other</span>
                      <span className="font-medium">
                        ₱
                        {additionalEarnings.toLocaleString(undefined, {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        })}
                      </span>
                    </div>
                  )}
                </>
              )}
            </div>
            <Separator className="my-2 mt-auto" />
            <div className="flex justify-between font-semibold text-green-700 dark:text-green-400 text-sm">
              <span>Total</span>
              <span>
                ₱
                {totalEarnings.toLocaleString(undefined, {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}
              </span>
            </div>
          </div>

          {/* Deductions - Use structured items if available, fallback to JSON */}
          <div className="rounded-lg border border-red-200/60 dark:border-red-900/40 bg-linear-to-br from-red-50/30 to-rose-50/30 dark:from-red-950/10 dark:to-rose-950/10 p-3 flex flex-col">
            <div className="flex items-center gap-2 mb-2.5">
              <Minus className="h-4 w-4 text-red-600 dark:text-red-400" />
              <h3 className="text-sm sm:text-base font-semibold text-red-700 dark:text-red-400">
                Deductions
              </h3>
            </div>
            {totalDeductions > 0 ? (
              <div className="space-y-1.5">
                {/* Use deductions JSON with metadata */}
                {Object.entries(payroll.deductions || {})
                  .sort(([keyA], [keyB]) => {
                    const catA =
                      payroll.deduction_metadata?.[keyA]?.category ?? ""
                    const catB =
                      payroll.deduction_metadata?.[keyB]?.category ?? ""

                    return catA.localeCompare(catB)
                  })
                  .map(([key, value]) => {
                    const amount = toNumber(value)
                    if (amount <= 0) return null

                    const metadata = payroll.deduction_metadata?.[key]
                    const isManualDeduction =
                      metadata?.source_type === "ManualDeduction" &&
                      metadata?.source_id
                    const canDelete =
                      isAdmin && payroll.status === "draft" && isManualDeduction

                    const label = key
                      .split("_")
                      .map(
                        (word) => word.charAt(0).toUpperCase() + word.slice(1),
                      )
                      .join(" ")
                      .replace("_", " ")

                    return (
                      <div
                        key={key}
                        className="flex justify-between items-center text-xs sm:text-sm group"
                      >
                        <span
                          className={cn(
                            "text-muted-foreground flex items-center gap-1.5",
                            label === "Sss" && "uppercase",
                          )}
                        >
                          {metadata?.category && canManage && (
                            <Badge
                              className={cn(
                                "text-xs sm:text-sm px-1.5 py-0 border",
                                getCategoryBadgeColor(metadata.category),
                              )}
                            >
                              {metadata.category.replace(/_/g, " ")}
                            </Badge>
                          )}
                          {label}
                        </span>
                        <div className="flex items-center gap-2">
                          <span className="font-medium">
                            ₱
                            {amount.toLocaleString(undefined, {
                              minimumFractionDigits: 2,
                              maximumFractionDigits: 2,
                            })}
                          </span>
                          {canDelete && (
                            <Button
                              variant="destructive"
                              size="sm"
                              className="h-6 w-6 p-0 print:hidden"
                              onClick={() =>
                                setDeleteDeductionId(metadata.source_id!)
                              }
                            >
                              <X className="size-3" />
                            </Button>
                          )}
                        </div>
                      </div>
                    )
                  })}
              </div>
            ) : (
              <div className="flex items-center justify-center grow">
                <p className="text-xs text-muted-foreground ">No deductions</p>
              </div>
            )}
            {totalDeductions > 0 && (
              <>
                <Separator className="my-2" />
                <div className="flex justify-between font-semibold text-red-700 dark:text-red-400 text-xs sm:text-sm">
                  <span>Total Deductions</span>
                  <span>
                    ₱
                    {totalDeductions.toLocaleString(undefined, {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}
                  </span>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Net Pay Summary - Prominent but Compact */}
        <div className="rounded-lg bg-linear-to-r from-green-500 to-emerald-600 dark:from-green-600 dark:to-emerald-700 p-4 text-white shadow-md print:bg-white print:border-2 print:border-green-600 print:text-green-600">
          <div className="text-center space-y-1">
            <p className="text-xs sm:text-sm font-medium opacity-90 print:opacity-100">
              Net Pay
            </p>
            <p className="text-2xl sm:text-3xl md:text-4xl font-bold tracking-tight">
              ₱ {""}
              {netPay.toLocaleString(undefined, {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })}
            </p>
          </div>
        </div>

        {/* Dispute Info */}
        {payroll.disputed && (
          <div className="rounded-lg border border-amber-300 dark:border-amber-800 bg-amber-50 dark:bg-amber-950/20 p-3">
            <div className="flex items-start gap-2 mb-2">
              <AlertCircle className="h-4 w-4 text-amber-600 dark:text-amber-400 mt-0.5 shrink-0" />
              <div className="flex-1 min-w-0">
                <h3 className="text-sm sm:text-base font-semibold text-amber-900 dark:text-amber-400 mb-1">
                  Disputed Payroll
                </h3>
                {payroll.disputed_reason && (
                  <p className="text-xs text-amber-800 dark:text-amber-300">
                    {payroll.disputed_reason}
                  </p>
                )}
                {payroll.disputed_at && (
                  <p className="text-xs text-amber-700 dark:text-amber-400 mt-1">
                    {format(
                      new Date(payroll.disputed_at),
                      "MMM dd, yyyy 'at' h:mm a",
                    )}
                  </p>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Notes */}
        {payroll.notes && (
          <div className="rounded-lg border bg-muted/30 p-3">
            <div className="flex items-center gap-2 mb-1.5">
              <FileText className="h-3.5 w-3.5 text-muted-foreground" />
              <h3 className="text-sm sm:text-base font-semibold">Notes</h3>
            </div>
            <p className="text-xs sm:text-sm text-muted-foreground whitespace-pre-wrap">
              {payroll.notes}
            </p>
          </div>
        )}

        {/* Footer - Minimal */}
        <div className="text-center text-[10px] text-muted-foreground space-y-0.5 pt-2 border-t">
          <p>Computer-generated payroll slip</p>
          <p>
            Generated{" "}
            {format(new Date(payroll.created_at), "MMM dd, yyyy 'at' h:mm a")}
          </p>
          <p>
            If you have questions about this payroll slip, please contact admin.
          </p>
        </div>

        {/* Developer Credit */}
        <DeveloperCredit
          variant="default"
          size="sm"
        />
      </CardContent>

      {/* Dispute Dialog */}
      <Dialog
        open={disputeDialogOpen}
        onOpenChange={setDisputeDialogOpen}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Dispute Payroll</DialogTitle>
            <DialogDescription>
              Provide a reason for disputing this payroll. The admin will be
              notified.
            </DialogDescription>
          </DialogHeader>
          <Textarea
            placeholder="Enter your reason..."
            value={disputeReason}
            onChange={(e) => setDisputeReason(e.target.value)}
            rows={4}
            className="resize-none"
          />
          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              variant="outline"
              onClick={() => {
                setDisputeDialogOpen(false)
                setDisputeReason("")
              }}
              disabled={isProcessing}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={async () => {
                if (!disputeReason.trim()) return
                setIsProcessing(true)
                await disputePayroll.mutateAsync({
                  id: payrollId,
                  reason: disputeReason,
                })
                setIsProcessing(false)
                setDisputeDialogOpen(false)
                setDisputeReason("")
              }}
              disabled={
                !disputeReason.trim() ||
                isProcessing ||
                disputePayroll.isPending
              }
            >
              <AlertCircle className="h-4 w-4 mr-2" />
              Submit
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Additional Earning Dialog */}
      <AddAdditionalEarningForm
        open={additionalEarningDialogOpen}
        onOpenChange={setAdditionalEarningDialogOpen}
        employeeId={payroll.employee}
        employeeName={employeeName}
        weekStart={payroll.week_start}
        weekEnd={payroll.week_end}
        payrollId={payroll.id}
      />

      {/* Manual Deduction Dialog */}
      <AddManualDeductionForm
        open={manualDeductionDialogOpen}
        onOpenChange={setManualDeductionDialogOpen}
        employeeId={payroll.employee}
        employeeName={employeeName}
        weekStart={payroll.week_start}
        weekEnd={payroll.week_end}
        payrollId={payroll.id}
      />

      {/* Delete Deduction Confirmation Dialog */}
      <AlertDialog
        open={deleteDeductionId !== null}
        onOpenChange={(open: boolean) => {
          if (!open) setDeleteDeductionId(null)
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-destructive" />
              Delete Manual Deduction?
            </AlertDialogTitle>
            <AlertDialogDescription className="space-y-3">
              <div className="font-semibold text-foreground">
                ⚠️ Warning: This will permanently delete this deduction.
              </div>
              <div className="space-y-2 text-sm">
                <div>
                  <span className="font-bold">For one-time deductions:</span>{" "}
                  Only removes from this payroll.
                </div>
                <div>
                  <span className="font-bold">For recurring deductions:</span>{" "}
                  Removes from ALL current and future payrolls where this
                  deduction was configured.
                </div>
              </div>
              <div className="text-xs text-muted-foreground italic">
                Note: Soft delete preserves audit trail. The deduction record
                remains in the database for reporting purposes.
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setDeleteDeductionId(null)}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={async () => {
                if (deleteDeductionId) {
                  await deleteManualDeduction.mutateAsync(deleteDeductionId)
                  setDeleteDeductionId(null)
                }
              }}
            >
              {deleteManualDeduction.isPending && (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              )}
              Delete Anyway
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete Earning Confirmation Dialog */}
      <AlertDialog
        open={deleteEarningId !== null}
        onOpenChange={(open: boolean) => {
          if (!open) setDeleteEarningId(null)
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-destructive" />
              Delete Additional Earning?
            </AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently remove this earning from the payroll. The
              earning record will be soft-deleted for audit purposes.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setDeleteEarningId(null)}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={async () => {
                if (deleteEarningId) {
                  await deleteAdditionalEarning.mutateAsync(deleteEarningId)
                  setDeleteEarningId(null)
                }
              }}
            >
              {deleteAdditionalEarning.isPending && (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              )}
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Card>
  )
}
