"use client"

import { DeveloperCredit } from "@/components/custom/shared/DeveloperCredit"
import { DeductionsSection } from "@/components/details/payroll/DeductionsSection"
import { EarningsSection } from "@/components/details/payroll/EarningsSection"
import { PayrollActions } from "@/components/details/payroll/PayrollActions"
import {
  CompanyInfoCard,
  EmployeeInfoCard,
} from "@/components/details/payroll/PayrollInfoCards"
import { StatusBadge } from "@/components/details/payroll/StatusBadge"
import { TimeSummary } from "@/components/details/payroll/TimeSummary"
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
import { Textarea } from "@/components/ui/textarea"
import { useCurrentUser } from "@/lib/hooks/useCurrentUser"
import { useRecomputeWeeklyPayroll } from "@/lib/mutations/payroll/usePayrollMutations"
import { useDeleteAdditionalEarning } from "@/lib/mutations/useAdditionalEarningMutations"
import { useDeleteManualDeduction } from "@/lib/mutations/useManualDeductionMutations"
import { usePayrollMutations } from "@/lib/mutations/usePayrollMutations"
import { useWeeklyPayroll } from "@/lib/queries/usePayroll"
import { formatCurrency, toNumber } from "@/lib/utils/currency"
import { cn } from "@/lib/utils/helpers"
import { format } from "date-fns"
import { AlertCircle, FileText, Loader2 } from "lucide-react"
import { useState } from "react"

interface WeeklyPayrollSlipProps {
  className?: string
  payrollId: number
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

  const weekStartDate = new Date(payroll.week_start)
  const weekEndDate = new Date(payroll.week_end || payroll.week_start)

  // Convert values
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
  const totalEarnings = grossPay
  const totalDeductions = toNumber(payroll.total_deductions)
  const netPay = toNumber(payroll.net_pay)

  // Calculate basic pay (gross - other components)
  const basicPay =
    grossPay -
    nightDiffPay -
    approvedOtPay -
    holidayPayTotal -
    allowances -
    additionalEarnings

  // Calculate holiday hours
  const holidayHours = (holidayPayRegular + holidayPaySpecial) / toNumber(payroll.hourly_rate)

  // Employee info
  const employeeName =
    payroll.employee_name || payroll.employee_detail?.full_name || "N/A"
  const employeeRole = payroll.employee_detail?.role || "N/A"
  const employeeDailyRate = toNumber(payroll.employee_detail?.daily_rate) || 0
  const employeeHourlyRate = toNumber(payroll.employee_detail?.hourly_rate) || 0

  // Permission checks
  const canDelete = isAdmin && payroll.status === "draft"
  const isEmployee = userProfile?.id === payroll.employee

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
          <StatusBadge status={payroll.status} />
        </div>

        {/* Action Buttons */}
        <PayrollActions
          status={payroll.status}
          isAdmin={isAdmin}
          isEmployee={isEmployee}
          isProcessing={isProcessing}
          disputed={payroll.disputed || false}
          onApprove={async () => {
            setIsProcessing(true)
            await updateStatus.mutateAsync({
              id: payrollId,
              status: "approved",
            })
            setIsProcessing(false)
          }}
          onMarkPaid={async () => {
            setIsProcessing(true)
            await updateStatus.mutateAsync({
              id: payrollId,
              status: "paid",
            })
            setIsProcessing(false)
          }}
          onMarkReceived={async () => {
            setIsProcessing(true)
            await markAsReceived.mutateAsync({
              id: payrollId,
            })
            setIsProcessing(false)
          }}
          onDispute={() => setDisputeDialogOpen(true)}
          onRecompute={async () => {
            setIsProcessing(true)
            await recomputePayroll.mutateAsync({})
            setIsProcessing(false)
          }}
          onAddEarning={() => setAdditionalEarningDialogOpen(true)}
          onAddDeduction={() => setManualDeductionDialogOpen(true)}
        />
      </CardHeader>

      <CardContent className="space-y-3">
        {/* Company & Employee Info */}
        <div className="grid md:grid-cols-2 gap-3">
          <CompanyInfoCard />
          <EmployeeInfoCard
            name={employeeName}
            role={employeeRole}
            dailyRate={employeeDailyRate}
            hourlyRate={employeeHourlyRate}
          />
        </div>

        {/* Time Summary */}
        <TimeSummary
          regularHours={regularHours}
          approvedOtHours={approvedOtHours}
          holidayHours={holidayHours}
          nightDiffHours={nightDiffHours}
        />

        {/* Earnings and Deductions */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
          <EarningsSection
            basicPay={basicPay}
            approvedOtPay={approvedOtPay}
            holidayPayTotal={holidayPayTotal}
            nightDiffPay={nightDiffPay}
            allowances={allowances}
            additionalEarnings={additionalEarnings}
            additionalEarningsDetails={payroll.additional_earnings_details}
            totalEarnings={totalEarnings}
            canDelete={canDelete}
            canManage={canManage}
            onDeleteEarning={setDeleteEarningId}
          />

          <DeductionsSection
            deductions={payroll.deductions || {}}
            deductionMetadata={payroll.deduction_metadata}
            totalDeductions={totalDeductions}
            canDelete={canDelete}
            canManage={canManage}
            onDeleteDeduction={setDeleteDeductionId}
          />
        </div>

        {/* Net Pay Summary - Prominent but Compact */}
        <div className="rounded-lg bg-linear-to-r from-green-500 to-emerald-600 dark:from-green-600 dark:to-emerald-700 p-4 text-white shadow-md print:bg-white print:border-2 print:border-green-600 print:text-green-600">
          <div className="text-center space-y-1">
            <p className="text-xs sm:text-sm font-medium opacity-90 print:opacity-100">
              Net Pay
            </p>
            <p className="text-2xl sm:text-3xl md:text-4xl font-bold tracking-tight">
              ₱ {formatCurrency(netPay)}
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
