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
import { AddCashAdvanceDeductionForm } from "@/components/forms/AddCashAdvanceDeductionForm"
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

import { useCurrentUser } from "@/lib/hooks/useCurrentUser"
import { useRecomputeWeeklyPayroll } from "@/lib/mutations/payroll/usePayrollMutations"
import { useDeleteAdditionalEarning } from "@/lib/mutations/useAdditionalEarningMutations"
import { useDeleteManualDeduction } from "@/lib/mutations/useManualDeductionMutations"
import { usePayrollMutations } from "@/lib/mutations/usePayrollMutations"
import { useEmployee } from "@/lib/queries/useEmployees"
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
  const { data: employeeData } = useEmployee(
    payroll?.employee?.toString() ?? "",
  )
  const { isAdmin, canManage } = useCurrentUser()
  const { updateStatus } = usePayrollMutations()
  const recomputePayroll = useRecomputeWeeklyPayroll(payrollId)
  const deleteManualDeduction = useDeleteManualDeduction(payrollId)

  const [isProcessing, setIsProcessing] = useState(false)
  const [manualDeductionDialogOpen, setManualDeductionDialogOpen] =
    useState(false)
  const [cashAdvanceDialogOpen, setCashAdvanceDialogOpen] = useState(false)
  const [additionalEarningDialogOpen, setAdditionalEarningDialogOpen] =
    useState(false)
  const [deleteDeductionId, setDeleteDeductionId] = useState<number | null>(
    null,
  )
  const [deleteEarningId, setDeleteEarningId] = useState<number | null>(null)
  const deleteAdditionalEarning = useDeleteAdditionalEarning(payrollId)

  if (isLoading) {
    return (
      <div
        className={cn(
          "mx-auto flex items-center justify-center py-12",
          className,
        )}
      >
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (!payroll) {
    return (
      <div
        className={cn(
          "mx-auto flex items-center justify-center py-12",
          className,
        )}
      >
        <p className="text-muted-foreground">Payroll slip not found</p>
      </div>
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
  const holidayHours =
    (holidayPayRegular + holidayPaySpecial) / toNumber(payroll.hourly_rate)

  // Employee info
  const employeeName =
    payroll.employee_name || payroll.employee_detail?.full_name || "N/A"
  const employeeRole = payroll.employee_detail?.role || "N/A"
  const employeeDailyRate = toNumber(payroll.employee_detail?.daily_rate) || 0
  const employeeHourlyRate = toNumber(payroll.employee_detail?.hourly_rate) || 0

  // Permission checks
  const canDelete = isAdmin && payroll.status === "draft"

  return (
    <div className={cn("mx-auto w-full space-y-4", className)}>
      {/* Header Section */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <h2 className="text-lg sm:text-xl font-bold">Payroll Slip</h2>
            <StatusBadge status={payroll.status} />
          </div>
          <p className="text-sm text-muted-foreground">
            {format(weekStartDate, "MMM dd")} -{" "}
            {format(weekEndDate, "MMM dd, yyyy")}
          </p>
        </div>
        <PayrollActions
          status={payroll.status}
          isAdmin={isAdmin}
          isProcessing={isProcessing}
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
          onRecompute={async () => {
            setIsProcessing(true)
            await recomputePayroll.mutateAsync({})
            setIsProcessing(false)
          }}
          onAddEarning={() => setAdditionalEarningDialogOpen(true)}
          onAddDeduction={() => setManualDeductionDialogOpen(true)}
          onAddCashAdvance={() => setCashAdvanceDialogOpen(true)}
        />
      </div>

      {/* Employee & Company Info */}
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

      {/* Net Pay Summary */}
      <div className="rounded-xl bg-linear-to-r from-green-500 to-emerald-600 dark:from-green-600 dark:to-emerald-700 p-5 text-white shadow-md print:bg-white print:border-2 print:border-green-600 print:text-green-600">
        <div className="text-center space-y-1">
          <p className="text-sm font-medium opacity-90 print:opacity-100">
            Net Pay
          </p>
          <p className="text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight">
            ₱ {formatCurrency(netPay)}
          </p>
        </div>
      </div>

      {/* Notes */}
      {payroll.notes && (
        <div className="rounded-lg border bg-muted/30 p-3">
          <div className="flex items-center gap-2 mb-1.5">
            <FileText className="h-3.5 w-3.5 text-muted-foreground" />
            <h3 className="text-sm font-semibold">Notes</h3>
          </div>
          <p className="text-xs sm:text-sm text-muted-foreground whitespace-pre-wrap">
            {payroll.notes}
          </p>
        </div>
      )}

      {/* Footer */}
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

      {/* Cash Advance Deduction Dialog */}
      <AddCashAdvanceDeductionForm
        open={cashAdvanceDialogOpen}
        onOpenChange={setCashAdvanceDialogOpen}
        employeeId={payroll.employee}
        employeeName={employeeName}
        cashBanBalance={Number(employeeData?.cash_ban_balance || 0)}
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
    </div>
  )
}
