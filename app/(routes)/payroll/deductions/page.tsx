"use client"

import PageHeader from "@/components/custom/shared/PageHeader"
import { Wrapper } from "@/components/custom/shared/Wrapper"
import { AddCompanyDeductionForm } from "@/components/forms/AddCompanyDeductionForm"
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
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { useArchive } from "@/lib/hooks/useArchive"
import useSearchParameters from "@/lib/hooks/useSearchParameters"
import {
  useDeleteManualDeduction,
  useToggleDeduction,
} from "@/lib/mutations/useManualDeductionMutations"
import { useManualDeductions } from "@/lib/queries/useManualDeductions"
import { ManualDeduction } from "@/lib/schemas/manualDeductionSchema"
import { cn } from "@/lib/utils/helpers"
import { format } from "date-fns"
import {
  Archive,
  CalendarRange,
  Edit,
  Pause,
  Play,
  Plus,
  Repeat,
  RotateCcw,
  Zap,
} from "lucide-react"
import { useState } from "react"
import { toast } from "sonner"

function DeductionRow({
  deduction,
  onToggle,
  onEdit,
  onArchive,
  showEmployee,
  showType,
}: {
  deduction: ManualDeduction
  onToggle: (d: ManualDeduction) => void
  onEdit?: (d: ManualDeduction) => void
  onArchive: (id: number) => void
  showEmployee?: boolean
  showType?: boolean
}) {
  const isRecurring =
    deduction.deduction_type === "recurring_all" || deduction.is_recurring
  const isApplied = !isRecurring && !!deduction.applied_date

  return (
    <div
      className={cn(
        "flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4 px-3 sm:px-4 py-3 rounded-lg border transition-colors hover:bg-muted/50",
        !deduction.is_active && "opacity-50 bg-muted/30 border-dashed",
      )}
    >
      {/* Icon & Info - Mobile: Row, Desktop: Row */}
      <div className="flex items-start gap-3 flex-1 min-w-0">
        {/* Icon */}
        <div
          className={cn(
            "shrink-0 flex items-center justify-center h-10 w-10 rounded-lg",
            isRecurring
              ? "bg-blue-100 text-blue-600 dark:bg-blue-950 dark:text-blue-400"
              : "bg-amber-100 text-amber-600 dark:bg-amber-950 dark:text-amber-400",
          )}
        >
          {isRecurring ? (
            <Repeat className="h-4 w-4" />
          ) : (
            <Zap className="h-4 w-4" />
          )}
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
            <span className="font-semibold text-sm sm:text-base">
              {deduction.name}
            </span>
            {showType && (
              <Badge
                variant="outline"
                className="text-[10px] px-1.5 py-0.5"
              >
                {isRecurring ? "Recurring" : "One-time"}
              </Badge>
            )}
            {!deduction.is_active && (
              <Badge
                variant="secondary"
                className="text-[10px] px-1.5 py-0.5"
              >
                Inactive
              </Badge>
            )}
            {isApplied && (
              <Badge
                variant="success"
                className="text-[10px] px-1.5 py-0.5"
              >
                Applied
              </Badge>
            )}
          </div>
          <div className="flex flex-wrap items-center gap-1.5 text-xs text-muted-foreground mt-1">
            {showEmployee && (
              <>
                <span className="font-medium">
                  {deduction.employee_detail?.full_name ||
                    `Employee #${deduction.employee}`}
                </span>
                <span className="hidden sm:inline">·</span>
              </>
            )}
            {deduction.effective_date && (
              <span className="flex items-center gap-1">
                <CalendarRange className="h-3 w-3 shrink-0" />
                <span className="truncate">
                  {format(new Date(deduction.effective_date), "MMM dd, yyyy")}
                  {deduction.end_date
                    ? ` — ${format(new Date(deduction.end_date), "MMM dd, yyyy")}`
                    : isRecurring
                      ? " — Ongoing"
                      : ""}
                </span>
              </span>
            )}
            {deduction.description && (
              <>
                <span className="hidden sm:inline">·</span>
                <span className="line-clamp-1 sm:truncate">
                  {deduction.description}
                </span>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Amount & Actions Row */}
      <div className="flex items-center justify-between sm:justify-end gap-3 pl-12 sm:pl-0">
        {/* Amount */}
        <div className="text-left sm:text-right">
          <span className="font-bold text-base sm:text-lg text-foreground">
            ₱
            {Number(deduction.amount).toLocaleString(undefined, {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            })}
          </span>
          <p className="text-[10px] text-muted-foreground">per payroll</p>
        </div>

        {/* Actions */}
        <div className="shrink-0 flex items-center gap-1">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={() => onToggle(deduction)}
                disabled={isApplied}
              >
                {deduction.is_active ? (
                  <Pause className="h-4 w-4" />
                ) : (
                  <Play className="h-4 w-4" />
                )}
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p className="max-w-xs">
                {deduction.is_active
                  ? "Pause: Temporarily disable this deduction. It will stay in the list but won't be applied to payroll."
                  : "Resume: Reactivate this deduction. It will be applied to future payroll calculations."}
              </p>
            </TooltipContent>
          </Tooltip>
          {onEdit && (
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => onEdit(deduction)}
                  disabled={isApplied}
                >
                  <Edit className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Edit deduction details</p>
              </TooltipContent>
            </Tooltip>
          )}
          <AlertDialog>
            <Tooltip>
              <TooltipTrigger asChild>
                <AlertDialogTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-muted-foreground hover:text-destructive transition-colors"
                  >
                    <Archive className="h-4 w-4" />
                  </Button>
                </AlertDialogTrigger>
              </TooltipTrigger>
              <TooltipContent>
                <p className="max-w-xs">
                  Archive: Move to archived tab. Can be restored later if
                  needed.
                </p>
              </TooltipContent>
            </Tooltip>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Archive Deduction?</AlertDialogTitle>
                <AlertDialogDescription>
                  Are you sure you want to archive &quot;{deduction.name}&quot;?
                  This will move it to the archived tab. You can restore it
                  later if needed.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={() => onArchive(deduction.id)}>
                  Archive
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </div>
    </div>
  )
}

function ArchivedRow({
  deduction,
  onRestore,
  restorePending,
}: {
  deduction: ManualDeduction
  onRestore: (id: number) => void
  restorePending: boolean
}) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center gap-3 px-3 sm:px-4 py-3 rounded-lg border bg-muted/30">
      <div className="flex-1 min-w-0">
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="font-semibold text-sm">{deduction.name}</span>
          <Badge
            variant="secondary"
            className="text-[10px] px-1.5 py-0.5"
          >
            {deduction.deduction_type_display || deduction.deduction_type}
          </Badge>
          <Badge
            variant="outline"
            className="text-[10px] px-1.5 py-0.5"
          >
            Archived
          </Badge>
        </div>
        {deduction.description && (
          <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
            {deduction.description}
          </p>
        )}
        {deduction.employee_detail && (
          <p className="text-xs text-muted-foreground mt-0.5">
            Employee: {deduction.employee_detail.full_name}
          </p>
        )}
      </div>
      <div className="flex items-center justify-between sm:justify-end gap-3">
        <span className="text-base font-bold shrink-0">
          ₱
          {Number(deduction.amount).toLocaleString(undefined, {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
          })}
        </span>
        <div className="flex items-center gap-2 shrink-0">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                className="h-8 text-xs"
                onClick={() => onRestore(deduction.id)}
                disabled={restorePending}
              >
                <RotateCcw className="h-3.5 w-3.5 mr-1.5" />
                Restore
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Restore this deduction to the active list</p>
            </TooltipContent>
          </Tooltip>
        </div>
      </div>
    </div>
  )
}

function SectionLabel({
  icon: Icon,
  label,
  count,
}: {
  icon: React.ComponentType<{ className?: string }>
  label: string
  count: number
}) {
  return (
    <div className="flex items-center gap-2.5 px-1">
      <div className="flex items-center justify-center h-8 w-8 rounded-md bg-primary/10">
        <Icon className="h-4 w-4 text-primary" />
      </div>
      <span className="text-sm font-semibold">{label}</span>
      <Badge
        variant="secondary"
        className="text-xs px-2 py-0.5 font-medium"
      >
        {count}
      </Badge>
    </div>
  )
}

function EmptyState({ message }: { message: string }) {
  return (
    <div className="flex items-center justify-center py-12 text-sm text-muted-foreground">
      {message}
    </div>
  )
}

export default function CompanyDeductionsPage() {
  const searchParams = useSearchParameters()
  const [showInactive, setShowInactive] = useState(true)
  const [isAddOpen, setIsAddOpen] = useState(false)
  const [editingDeduction, setEditingDeduction] =
    useState<ManualDeduction | null>(null)
  const [editingEmployeeDeduction, setEditingEmployeeDeduction] =
    useState<ManualDeduction | null>(null)
  const [activeTab, setActiveTab] = useState("company")

  const isArchived = activeTab === "archived"

  // Fetch all company-wide deductions (no is_active filter - we filter on frontend)
  const { data: companyDeductionsData, isLoading } = useManualDeductions({
    page_size: 1000, // Get all deductions
  })

  const { data: employeeDeductionsData, isLoading: employeeLoading } =
    useManualDeductions({
      deduction_type: "per_employee",
      page_size: 100,
    })
  const toggleMutation = useToggleDeduction()
  const deleteMutation = useDeleteManualDeduction()

  const { archivedQuery, restoreItem } = useArchive<ManualDeduction>(
    "/payroll/manual-deductions/",
    "manual-deductions",
    searchParams,
    isArchived,
  )

  const handleToggle = async (deduction: ManualDeduction) => {
    try {
      await toggleMutation.mutateAsync({
        id: deduction.id,
        is_active: !deduction.is_active,
      })
      toast.success(
        deduction.is_active
          ? `"${deduction.name}" paused - won't be applied to payroll`
          : `"${deduction.name}" activated - will be applied to payroll`,
      )
    } catch {
      toast.error("Failed to update deduction")
    }
  }

  const handleArchive = async (id: number) => {
    try {
      await deleteMutation.mutateAsync(id)
      toast.success("Deduction deleted successfully")
    } catch {
      toast.error("Failed to delete deduction")
    }
  }

  const recurringDeductions =
    companyDeductionsData?.results?.filter((d) => {
      if (d.deduction_type !== "recurring_all") return false
      if (!showInactive && !d.is_active) return false
      return true
    }) || []
  const onetimeDeductions =
    companyDeductionsData?.results?.filter((d) => {
      if (d.deduction_type !== "onetime_all") return false
      if (!showInactive && !d.is_active) return false
      return true
    }) || []
  const employeeDeductions =
    employeeDeductionsData?.results?.filter((d) => {
      if (!showInactive && !d.is_active) return false
      return true
    }) || []

  // Split employee deductions by type (using is_recurring field)
  const employeeRecurringDeductions = employeeDeductions.filter(
    (d) => d.is_recurring,
  )
  const employeeOnetimeDeductions = employeeDeductions.filter(
    (d) => !d.is_recurring,
  )

  return (
    <Wrapper>
      <PageHeader
        title="Deductions"
        description="Manage company-wide and per-employee deductions"
        breadcrumbs={["Payroll", "Deductions"]}
        actionButton={
          activeTab === "company" && (
            <Button
              onClick={() => setIsAddOpen(true)}
              className="w-full sm:w-auto"
            >
              <Plus className="h-4 w-4 mr-2" />
              <span className="hidden sm:inline">Add Deduction</span>
              <span className="sm:hidden">Add</span>
            </Button>
          )
        }
      />

      <Tabs
        value={activeTab}
        onValueChange={setActiveTab}
        className="space-y-4"
      >
        <TabsList className="grid w-full sm:w-auto sm:inline-grid grid-cols-3">
          <TabsTrigger value="company">Company-Wide</TabsTrigger>
          <TabsTrigger value="employee">Per Employee</TabsTrigger>
          <TabsTrigger value="archived">
            Archived
            {archivedQuery.data?.count ? (
              <Badge
                variant="secondary"
                className="ml-1.5 text-[10px] px-1.5 py-0"
              >
                {archivedQuery.data.count}
              </Badge>
            ) : null}
          </TabsTrigger>
        </TabsList>

        <TabsContent
          value="company"
          className="space-y-6"
        >
          <div className="flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between">
            <div className="flex items-center gap-2">
              <label className="text-sm text-muted-foreground flex items-center gap-2 cursor-pointer hover:text-foreground transition-colors">
                <input
                  type="checkbox"
                  checked={showInactive}
                  onChange={(e) => setShowInactive(e.target.checked)}
                  className="rounded border-gray-300 cursor-pointer"
                />
                Show inactive deductions
              </label>
            </div>
          </div>

          {!showInactive && (
            <div className="rounded-lg border border-blue-200 bg-blue-50 dark:bg-blue-950/20 dark:border-blue-900 p-3">
              <p className="text-xs text-blue-800 dark:text-blue-300">
                <strong>💡 Tip:</strong> Inactive (paused) deductions are
                hidden. They remain in the system but won&apos;t be applied to
                payroll. Check the box above to view them, or{" "}
                <strong>Archive</strong> them to move to the archived tab.
              </p>
            </div>
          )}

          {/* Recurring Deductions */}
          <div className="space-y-3">
            <SectionLabel
              icon={Repeat}
              label="Recurring Deductions"
              count={recurringDeductions.length}
            />
            <Card>
              <CardContent className="p-3">
                {isLoading ? (
                  <EmptyState message="Loading..." />
                ) : recurringDeductions.length === 0 ? (
                  <EmptyState message="No recurring deductions configured yet" />
                ) : (
                  <div className="space-y-2">
                    {recurringDeductions.map((d) => (
                      <DeductionRow
                        key={d.id}
                        deduction={d}
                        onToggle={handleToggle}
                        onEdit={(d) => setEditingDeduction(d)}
                        onArchive={handleArchive}
                      />
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* One-Time Deductions */}
          <div className="space-y-3">
            <SectionLabel
              icon={Zap}
              label="One-Time Deductions"
              count={onetimeDeductions.length}
            />
            <Card>
              <CardContent className="p-3">
                {isLoading ? (
                  <EmptyState message="Loading..." />
                ) : onetimeDeductions.length === 0 ? (
                  <EmptyState message="No one-time deductions configured yet" />
                ) : (
                  <div className="space-y-2">
                    {onetimeDeductions.map((d) => (
                      <DeductionRow
                        key={d.id}
                        deduction={d}
                        onToggle={handleToggle}
                        onEdit={(d) => setEditingDeduction(d)}
                        onArchive={handleArchive}
                      />
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          <AddCompanyDeductionForm
            open={isAddOpen || !!editingDeduction}
            onOpenChange={(open: boolean) => {
              setIsAddOpen(open)
              if (!open) setEditingDeduction(null)
            }}
            deduction={editingDeduction}
          />
        </TabsContent>

        <TabsContent
          value="employee"
          className="space-y-6"
        >
          <div className="flex flex-col gap-3">
            <div className="rounded-lg border bg-muted/50 p-4">
              <p className="text-sm text-muted-foreground">
                Custom deductions assigned to individual employees. These can be
                added from each employee&apos;s payroll slip and are specific to
                that employee only.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <label className="text-sm text-muted-foreground flex items-center gap-2 cursor-pointer hover:text-foreground transition-colors">
                <input
                  type="checkbox"
                  checked={showInactive}
                  onChange={(e) => setShowInactive(e.target.checked)}
                  className="rounded border-gray-300 cursor-pointer"
                />
                Show inactive deductions
              </label>
            </div>
          </div>

          {!showInactive && (
            <div className="rounded-lg border border-blue-200 bg-blue-50 dark:bg-blue-950/20 dark:border-blue-900 p-3">
              <p className="text-xs text-blue-800 dark:text-blue-300">
                <strong>💡 Tip:</strong> Inactive (paused) deductions are
                hidden. They remain in the system but won&apos;t be applied to
                payroll. Check the box above to view them, or{" "}
                <strong>Archive</strong> them to move to the archived tab.
              </p>
            </div>
          )}

          {/* Recurring Employee Deductions */}
          <div className="space-y-3">
            <SectionLabel
              icon={Repeat}
              label="Recurring Deductions"
              count={employeeRecurringDeductions.length}
            />
            <Card>
              <CardContent className="p-3">
                {employeeLoading ? (
                  <EmptyState message="Loading..." />
                ) : employeeRecurringDeductions.length === 0 ? (
                  <EmptyState message="No recurring employee deductions yet" />
                ) : (
                  <div className="space-y-2">
                    {employeeRecurringDeductions.map((d) => (
                      <DeductionRow
                        key={d.id}
                        deduction={d}
                        onToggle={handleToggle}
                        onEdit={(d) => setEditingEmployeeDeduction(d)}
                        onArchive={handleArchive}
                        showEmployee
                      />
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* One-Time Employee Deductions */}
          <div className="space-y-3">
            <SectionLabel
              icon={Zap}
              label="One-Time Deductions"
              count={employeeOnetimeDeductions.length}
            />
            <Card>
              <CardContent className="p-3">
                {employeeLoading ? (
                  <EmptyState message="Loading..." />
                ) : employeeOnetimeDeductions.length === 0 ? (
                  <EmptyState message="No one-time employee deductions yet" />
                ) : (
                  <div className="space-y-2">
                    {employeeOnetimeDeductions.map((d) => (
                      <DeductionRow
                        key={d.id}
                        deduction={d}
                        onToggle={handleToggle}
                        onEdit={(d) => setEditingEmployeeDeduction(d)}
                        onArchive={handleArchive}
                        showEmployee
                      />
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {editingEmployeeDeduction?.employee && editingEmployeeDeduction && (
            <AddManualDeductionForm
              open={!!editingEmployeeDeduction}
              onOpenChange={(open) => {
                if (!open) setEditingEmployeeDeduction(null)
              }}
              employeeId={editingEmployeeDeduction.employee}
              employeeName={
                editingEmployeeDeduction.employee_detail?.full_name ||
                `Employee #${editingEmployeeDeduction.employee}`
              }
              deduction={editingEmployeeDeduction}
            />
          )}
        </TabsContent>

        <TabsContent
          value="archived"
          className="space-y-4"
        >
          <div className="rounded-lg border bg-muted/50 p-4">
            <p className="text-sm text-muted-foreground">
              Archived deductions from both company-wide and per-employee
              categories. These won&apos;t be applied to payroll but can be
              restored if needed.
            </p>
          </div>

          <Card>
            <CardContent className="p-3">
              {archivedQuery.isLoading ? (
                <EmptyState message="Loading..." />
              ) : !archivedQuery.data?.results?.length ? (
                <EmptyState message="No archived deductions found" />
              ) : (
                <div className="space-y-2">
                  {archivedQuery.data.results.map((d: ManualDeduction) => (
                    <ArchivedRow
                      key={d.id}
                      deduction={d}
                      onRestore={(id) => restoreItem.mutate(id)}
                      restorePending={restoreItem.isPending}
                    />
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </Wrapper>
  )
}
