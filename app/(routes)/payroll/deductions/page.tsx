"use client"

import { ArchiveToggle } from "@/components/custom/shared/ArchiveToggle"
import PageHeader from "@/components/custom/shared/PageHeader"
import { Wrapper } from "@/components/custom/shared/Wrapper"
import { AddCompanyDeductionForm } from "@/components/forms/AddCompanyDeductionForm"
import { AddManualDeductionForm } from "@/components/forms/AddManualDeductionForm"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useArchive } from "@/lib/hooks/useArchive"
import useSearchParameters from "@/lib/hooks/useSearchParameters"
import {
  useDeleteManualDeduction,
  useToggleDeduction,
} from "@/lib/mutations/useManualDeductionMutations"
import {
  useCompanyDeductions,
  useManualDeductions,
} from "@/lib/queries/useManualDeductions"
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
  Trash2,
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
    deduction.deduction_type === "recurring_all" || !!deduction.end_date
  const isApplied = !!deduction.applied_date

  return (
    <div
      className={cn(
        "group flex items-center gap-4 px-4 py-3 rounded-lg border transition-colors hover:bg-muted/50",
        !deduction.is_active && "opacity-60",
      )}
    >
      {/* Icon */}
      <div
        className={cn(
          "flex-shrink-0 flex items-center justify-center h-9 w-9 rounded-lg",
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
        <div className="flex items-center gap-2">
          <span className="font-medium text-sm truncate">{deduction.name}</span>
          {showType && (
            <Badge
              variant="outline"
              className="text-[10px] px-1.5 py-0"
            >
              {isRecurring ? "Recurring" : "One-time"}
            </Badge>
          )}
          {!deduction.is_active && (
            <Badge
              variant="secondary"
              className="text-[10px] px-1.5 py-0"
            >
              Inactive
            </Badge>
          )}
        </div>
        <div className="flex items-center gap-2 text-xs text-muted-foreground mt-0.5">
          {showEmployee && (
            <>
              <span>
                {deduction.employee_detail?.full_name ||
                  `Employee #${deduction.employee}`}
              </span>
              <span>·</span>
            </>
          )}
          {deduction.effective_date && (
            <span className="flex items-center gap-1">
              <CalendarRange className="h-3 w-3" />
              {format(new Date(deduction.effective_date), "MMM dd, yyyy")}
              {deduction.end_date
                ? ` — ${format(new Date(deduction.end_date), "MMM dd, yyyy")}`
                : isRecurring
                  ? " — Ongoing"
                  : ""}
            </span>
          )}
          {isApplied && (
            <>
              <span>·</span>
              <span>
                Applied{" "}
                {format(new Date(deduction.applied_date!), "MMM dd, yyyy")}
              </span>
            </>
          )}
          {deduction.description && (
            <>
              <span>·</span>
              <span className="truncate">{deduction.description}</span>
            </>
          )}
        </div>
      </div>

      {/* Amount */}
      <div className="flex-shrink-0 text-right">
        <span className="font-semibold text-sm">
          ₱{Number(deduction.amount).toFixed(2)}
        </span>
        <p className="text-[10px] text-muted-foreground">per payroll</p>
      </div>

      {/* Actions */}
      <div className="flex-shrink-0 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7"
          onClick={() => onToggle(deduction)}
          disabled={isApplied}
          title={deduction.is_active ? "Deactivate" : "Activate"}
        >
          {deduction.is_active ? (
            <Pause className="h-3.5 w-3.5" />
          ) : (
            <Play className="h-3.5 w-3.5" />
          )}
        </Button>
        {onEdit && (
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7"
            onClick={() => onEdit(deduction)}
            disabled={isApplied}
            title="Edit"
          >
            <Edit className="h-3.5 w-3.5" />
          </Button>
        )}
        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7 text-muted-foreground hover:text-destructive"
          onClick={() => onArchive(deduction.id)}
          title="Archive"
        >
          <Archive className="h-3.5 w-3.5" />
        </Button>
      </div>
    </div>
  )
}

function ArchivedRow({
  deduction,
  onRestore,
  onDelete,
  restorePending,
  deletePending,
}: {
  deduction: ManualDeduction
  onRestore: (id: number) => void
  onDelete: (id: number) => void
  restorePending: boolean
  deletePending: boolean
}) {
  return (
    <div className="flex items-center gap-4 px-4 py-3 rounded-lg border opacity-60">
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="font-medium text-sm">{deduction.name}</span>
          <Badge
            variant="secondary"
            className="text-[10px] px-1.5 py-0"
          >
            {deduction.deduction_type_display || deduction.deduction_type}
          </Badge>
        </div>
        {deduction.description && (
          <p className="text-xs text-muted-foreground mt-0.5 truncate">
            {deduction.description}
          </p>
        )}
      </div>
      <span className="text-sm font-medium flex-shrink-0">
        ₱{Number(deduction.amount).toFixed(2)}
      </span>
      <div className="flex items-center gap-1 flex-shrink-0">
        <Button
          variant="outline"
          size="sm"
          className="h-7 text-xs"
          onClick={() => onRestore(deduction.id)}
          disabled={restorePending}
        >
          <RotateCcw className="h-3 w-3 mr-1" />
          Restore
        </Button>
        <Button
          variant="destructive"
          size="sm"
          className="h-7 text-xs"
          onClick={() => {
            if (confirm(`Permanently delete "${deduction.name}"?`)) {
              onDelete(deduction.id)
            }
          }}
          disabled={deletePending}
        >
          <Trash2 className="h-3 w-3 mr-1" />
          Delete
        </Button>
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
    <div className="flex items-center gap-2 px-1">
      <Icon className="h-4 w-4 text-muted-foreground" />
      <span className="text-sm font-medium text-muted-foreground">{label}</span>
      <Badge
        variant="secondary"
        className="text-[10px] px-1.5 py-0"
      >
        {count}
      </Badge>
    </div>
  )
}

function EmptyState({ message }: { message: string }) {
  return (
    <div className="flex items-center justify-center py-8 text-sm text-muted-foreground">
      {message}
    </div>
  )
}

export default function CompanyDeductionsPage() {
  const searchParams = useSearchParameters()
  const [isArchived, setIsArchived] = useState(false)
  const [isAddOpen, setIsAddOpen] = useState(false)
  const [editingDeduction, setEditingDeduction] =
    useState<ManualDeduction | null>(null)
  const [editingEmployeeDeduction, setEditingEmployeeDeduction] =
    useState<ManualDeduction | null>(null)
  const [activeTab, setActiveTab] = useState("company")

  const { data: deductions, isLoading } = useCompanyDeductions()
  const { data: employeeDeductionsData, isLoading: employeeLoading } =
    useManualDeductions({
      deduction_type: "per_employee",
      page_size: 100,
    })
  const toggleMutation = useToggleDeduction()
  const deleteMutation = useDeleteManualDeduction()

  const { archivedQuery, restoreItem, hardDeleteItem } =
    useArchive<ManualDeduction>(
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
        `Deduction ${deduction.is_active ? "deactivated" : "activated"}`,
      )
    } catch {
      toast.error("Failed to update deduction")
    }
  }

  const handleArchive = async (id: number) => {
    if (
      !confirm(
        "Are you sure you want to archive this deduction? You can restore it from the Archived tab.",
      )
    )
      return

    try {
      await deleteMutation.mutateAsync(id)
      toast.success("Deduction archived")
    } catch {
      toast.error("Failed to archive deduction")
    }
  }

  const recurringDeductions =
    deductions?.filter((d) => d.deduction_type === "recurring_all") || []
  const onetimeDeductions =
    deductions?.filter((d) => d.deduction_type === "onetime_all") || []
  const employeeDeductions = employeeDeductionsData?.results || []

  return (
    <Wrapper>
      <PageHeader
        title="Deductions"
        description="Manage company-wide and per-employee deductions"
        breadcrumbs={["Payroll", "Deductions"]}
        actionButton={
          !isArchived &&
          activeTab === "company" && (
            <Button onClick={() => setIsAddOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Add Deduction
            </Button>
          )
        }
      />

      <Tabs
        value={activeTab}
        onValueChange={setActiveTab}
      >
        <TabsList>
          <TabsTrigger value="company">Company-Wide</TabsTrigger>
          <TabsTrigger value="employee">Per Employee</TabsTrigger>
        </TabsList>

        <TabsContent
          value="company"
          className="space-y-6"
        >
          <ArchiveToggle
            isArchived={isArchived}
            onToggle={setIsArchived}
            archivedCount={archivedQuery.data?.count}
          />

          {!isArchived && (
            <>
              {/* Recurring Deductions */}
              <div className="space-y-3">
                <SectionLabel
                  icon={Repeat}
                  label="Recurring"
                  count={recurringDeductions.length}
                />
                <Card>
                  <CardContent className="p-2">
                    {isLoading ? (
                      <EmptyState message="Loading..." />
                    ) : recurringDeductions.length === 0 ? (
                      <EmptyState message="No recurring deductions" />
                    ) : (
                      <div className="space-y-1">
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
                  label="One-Time"
                  count={onetimeDeductions.length}
                />
                <Card>
                  <CardContent className="p-2">
                    {isLoading ? (
                      <EmptyState message="Loading..." />
                    ) : onetimeDeductions.length === 0 ? (
                      <EmptyState message="No one-time deductions" />
                    ) : (
                      <div className="space-y-1">
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
            </>
          )}

          {/* Archived */}
          {isArchived && (
            <Card>
              <CardContent className="p-2">
                {archivedQuery.isLoading ? (
                  <EmptyState message="Loading..." />
                ) : !archivedQuery.data?.results?.length ? (
                  <EmptyState message="No archived deductions" />
                ) : (
                  <div className="space-y-1">
                    {archivedQuery.data.results.map((d: ManualDeduction) => (
                      <ArchivedRow
                        key={d.id}
                        deduction={d}
                        onRestore={(id) => restoreItem.mutate(id)}
                        onDelete={(id) => hardDeleteItem.mutate(id)}
                        restorePending={restoreItem.isPending}
                        deletePending={hardDeleteItem.isPending}
                      />
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent
          value="employee"
          className="space-y-4"
        >
          <p className="text-sm text-muted-foreground px-1">
            Custom deductions assigned to individual employees. Added from each
            employee&apos;s payroll slip.
          </p>

          <Card>
            <CardContent className="p-2">
              {employeeLoading ? (
                <EmptyState message="Loading..." />
              ) : employeeDeductions.length === 0 ? (
                <EmptyState message="No per-employee deductions yet. Add them from an employee's payroll slip." />
              ) : (
                <div className="space-y-1">
                  {employeeDeductions.map((d) => (
                    <DeductionRow
                      key={d.id}
                      deduction={d}
                      onToggle={handleToggle}
                      onEdit={(d) => setEditingEmployeeDeduction(d)}
                      onArchive={handleArchive}
                      showEmployee
                      showType
                    />
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

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
      </Tabs>
    </Wrapper>
  )
}
