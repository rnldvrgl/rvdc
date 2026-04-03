"use client"

import { ErrorState } from "@/components/custom/ErrorState"
import EntitySheet from "@/components/custom/shared/EntitySheet"
import PageHeader from "@/components/custom/shared/PageHeader"
import { Wrapper } from "@/components/custom/shared/Wrapper"
import { DataTable } from "@/components/custom/table/DataTable"
import { Detail } from "@/components/details/Detail"
import { AddManualDeductionForm } from "@/components/forms/AddManualDeductionForm"
import { CashAdvanceForm } from "@/components/forms/CashAdvanceForm"
import { EmployeeBenefitOverrideForm } from "@/components/forms/EmployeeBenefitOverrideForm"
import EmployeeForm from "@/components/forms/EmployeeForm"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { CashAdvanceMovement } from "@/lib/constants/interface"
import { Employee } from "@/lib/constants/types"
import { useCurrentUser } from "@/lib/hooks/useCurrentUser"
import { useEntitySheet } from "@/lib/hooks/useEntitySheet"
import { useCashAdvanceMutations } from "@/lib/mutations/useCashAdvanceMutations"
import { useEmployeeBenefitOverrideMutations } from "@/lib/mutations/useEmployeeBenefitOverrideMutations"
import {
  useDeleteManualDeduction,
  useToggleDeduction,
} from "@/lib/mutations/useManualDeductionMutations"
import { useCashAdvanceMovements } from "@/lib/queries/useCashAdvances"
import { useEmployeeBenefitOverrides } from "@/lib/queries/useEmployeeBenefitOverrides"
import { useEmployee } from "@/lib/queries/useEmployees"
import { useEmployeeDeductions } from "@/lib/queries/useManualDeductions"
import { EmployeeBenefitOverride } from "@/lib/schemas/employeeBenefitOverrideSchema"
import { ManualDeduction } from "@/lib/schemas/manualDeductionSchema"
import { formatDate } from "@/lib/utils/helpers/date"
import { format } from "date-fns"
import {
  ArrowLeft,
  BadgeDollarSign,
  Calendar,
  History,
  Home,
  IdCard,
  KeyRound,
  Mail,
  MapPin,
  Pause,
  Pencil,
  Phone,
  Play,
  Plus,
  Store,
  Trash2,
  User,
  Wallet,
} from "lucide-react"
import { useParams, useRouter } from "next/navigation"
import { useState } from "react"
import { getCashAdvanceColumns } from "./cashAdvanceColumns"

const EmployeePage = () => {
  const params = useParams()
  const router = useRouter()
  const { isAdmin, canManage: canManageCashAdvance } = useCurrentUser()
  const {
    data: employee,
    isLoading,
    error,
    refetch,
  } = useEmployee(`${params.id}`)

  const { data: benefitOverridesData } = useEmployeeBenefitOverrides({
    employee: Number(params.id),
  })

  const benefitOverrides = benefitOverridesData?.results || []

  const { data: cashAdvancesData, isLoading: isLoadingCashAdvances } =
    useCashAdvanceMovements({
      employee: Number(params.id),
      ordering: "-created_at",
    })

  const cashAdvances = cashAdvancesData?.results || []

  const { deleteOverride } = useEmployeeBenefitOverrideMutations()
  const { deleteMovement } = useCashAdvanceMutations()
  const toggleDeduction = useToggleDeduction()
  const deleteDeduction = useDeleteManualDeduction()

  const { data: employeeDeductions = [] } = useEmployeeDeductions(
    Number(params.id),
  )

  const [benefitOverrideOpen, setBenefitOverrideOpen] = useState(false)
  const [selectedOverride, setSelectedOverride] =
    useState<EmployeeBenefitOverride | null>(null)
  const [showCashAdvanceForm, setShowCashAdvanceForm] = useState(false)
  const [deductionFormOpen, setDeductionFormOpen] = useState(false)
  const [selectedDeduction, setSelectedDeduction] =
    useState<ManualDeduction | null>(null)

  const {
    entityState: { open },
    openEntity,
    closeEntity,
  } = useEntitySheet<Employee>()

  if (isLoading) {
    return (
      <div className="h-full py-8 px-4">
        <div className="max-w-5xl mx-auto space-y-8">
          {/* PROFILE HEADER SKELETON */}
          <Card className="shadow-md">
            <CardHeader className="flex flex-row items-center gap-6">
              <Skeleton className="h-24 w-24 rounded-full" />
              <div className="space-y-2 flex-1">
                <Skeleton className="h-6 w-48" />
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-5 w-20" />
              </div>
            </CardHeader>
          </Card>

          {/* CONTACT & EMPLOYMENT SKELETON */}
          <div className="grid md:grid-cols-2 gap-6">
            {[...Array(2)].map((_, i) => (
              <Card key={i}>
                <CardHeader>
                  <Skeleton className="h-6 w-48" />
                </CardHeader>
                <CardContent className="space-y-4">
                  {[...Array(4)].map((__, j) => (
                    <div
                      key={j}
                      className="space-y-1"
                    >
                      <Skeleton className="h-3 w-24" />
                      <Skeleton className="h-4 w-full" />
                    </div>
                  ))}
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
    )
  }

  if (error || !employee) {
    return (
      <ErrorState
        title="Failed to load employee details"
        description="There was a problem fetching the employee data. Please try again later or Contact support."
        retry={refetch}
      />
    )
  }

  return (
    <Wrapper>
      <PageHeader
        icon={User}
        title="Employee Details"
        description="View and manage employee profile information and employment details."
        breadcrumbs={["Dashboard", "Employees", "Details"]}
        actionButton={
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 w-full sm:w-auto">
            <Button
              variant="outline"
              onClick={() => router.push("/employees")}
              className="w-full sm:w-auto"
            >
              <ArrowLeft className="size-4 mr-2" />
              <span className="hidden sm:inline">Back to Employees</span>
              <span className="sm:hidden">Back</span>
            </Button>
            <Button
              onClick={() => openEntity(employee)}
              className="w-full sm:w-auto"
            >
              <Pencil className="size-4 mr-2" />
              Edit
            </Button>
          </div>
        }
      />

      <div className="mx-auto space-y-6">
        {/* PROFILE HEADER */}
        <Card className="shadow-md">
          <CardHeader className="flex flex-col sm:flex-row items-center sm:items-start gap-4 sm:gap-6">
            <Avatar className="size-20 sm:size-24 border-2 border-primary shrink-0 text-2xl sm:text-3xl">
              <AvatarImage
                src={employee.profile_image}
                alt={`${employee.first_name} ${employee.last_name}`}
              />
              <AvatarFallback className="bg-primary/20 text-primary font-bold">
                {employee.first_name?.[0]}
                {employee.last_name?.[0]}
              </AvatarFallback>
            </Avatar>
            <div className="space-y-2 text-center sm:text-left flex-1">
              <h1 className="text-xl sm:text-2xl font-bold wrap-break-word">
                {employee.first_name} {employee.last_name}
              </h1>
              <p className="text-sm sm:text-base text-muted-foreground capitalize">
                {employee.role}
              </p>
              <Badge variant={employee.is_active ? "default" : "outline"}>
                {employee.is_active ? "Active" : "Inactive"}
              </Badge>
            </div>
          </CardHeader>
        </Card>

        {/* CONTACT & EMPLOYMENT */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
          <Card>
            <CardHeader className="pb-3">
              <h2 className="text-base sm:text-lg font-semibold">
                Contact & Address
              </h2>
            </CardHeader>
            <CardContent className="space-y-3">
              <Detail
                icon={<KeyRound className="size-4" />}
                label="Username"
                value={employee.username || "-"}
              />
              <Detail
                icon={<Phone className="size-4" />}
                label="Contact Number"
                value={employee.contact_number}
              />
              <Detail
                icon={<Mail className="size-4" />}
                label="Email"
                value={employee.email || "-"}
              />
              <Detail
                icon={<Home className="size-4" />}
                label="Address"
                value={employee.address}
              />
              <Detail
                icon={<MapPin className="size-4" />}
                label="Barangay"
                value={employee.barangay}
              />
              <Detail
                icon={<MapPin className="size-4" />}
                label="City"
                value={employee.city}
              />
              <Detail
                icon={<MapPin className="size-4" />}
                label="Province"
                value={employee.province}
              />
              {(employee.role === "manager" || employee.role === "clerk") && (
                <Detail
                  icon={<Store className="size-4" />}
                  label="Assigned Stall"
                  value={employee.assigned_stall?.name || "No stall assigned"}
                />
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <h2 className="text-base sm:text-lg font-semibold">
                Employment & Other Info
              </h2>
            </CardHeader>
            <CardContent className="space-y-3">
              <Detail
                icon={<Wallet className="size-4" />}
                label="Basic Salary"
                value={`₱${Number(employee.basic_salary).toLocaleString()}`}
              />
              <Detail
                icon={<BadgeDollarSign className="size-4" />}
                label="Cash Ban Balance"
                value={`₱${Number(employee.cash_ban_balance || 0).toLocaleString()}`}
                className={
                  Number(employee.cash_ban_balance || 0) > 0
                    ? "text-success"
                    : "text-muted-foreground"
                }
              />
              <Detail
                icon={<IdCard className="size-4" />}
                label="Philhealth #"
                value={employee.philhealth_number || "-"}
              />
              <Detail
                icon={<IdCard className="size-4" />}
                label="SSS #"
                value={employee.sss_number || "-"}
              />
              <Detail
                icon={<Calendar className="size-4" />}
                label="Birthday"
                value={
                  employee.birthday
                    ? formatDate(employee.birthday, "MMMM d, yyyy")
                    : "-"
                }
              />
            </CardContent>
          </Card>

          {/* CASH ADVANCE SECTION */}
          <Card className="col-span-full">
            <CardHeader className="flex flex-col sm:flex-row sm:items-center justify-between space-y-2 sm:space-y-0 pb-4">
              <div className="flex-1">
                <h2 className="text-base sm:text-lg font-semibold flex items-center gap-2">
                  <Wallet className="h-4 w-4 sm:h-5 sm:w-5" />
                  Cash Ban
                </h2>
                <p className="text-sm mt-1">
                  <span className="text-muted-foreground">
                    Available Balance:{" "}
                  </span>
                  <span
                    className={
                      Number(employee.cash_ban_balance || 0) > 0
                        ? "text-success font-semibold"
                        : "text-muted-foreground font-semibold"
                    }
                  >
                    ₱{Number(employee.cash_ban_balance || 0).toLocaleString()}
                  </span>
                </p>
              </div>
              {canManageCashAdvance && (
                <Button
                  size="sm"
                  onClick={() => setShowCashAdvanceForm(!showCashAdvanceForm)}
                  variant={showCashAdvanceForm ? "outline" : "default"}
                  className="w-full sm:w-auto"
                >
                  {showCashAdvanceForm ? (
                    "Hide Form"
                  ) : (
                    <>
                      <Plus className="h-4 w-4 mr-2" />
                      Record Movement
                    </>
                  )}
                </Button>
              )}
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Cash Advance Form */}
              {canManageCashAdvance && showCashAdvanceForm && (
                <div className="border rounded-lg p-4 bg-muted/50">
                  <CashAdvanceForm
                    employee={employee}
                    onSuccess={() => setShowCashAdvanceForm(false)}
                  />
                </div>
              )}

              {/* Cash Advance History */}
              <div>
                <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
                  <History className="h-4 w-4" />
                  Transaction History
                </h3>
                {cashAdvances.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    No cash ban movements recorded yet.
                  </p>
                ) : (
                  <DataTable
                    isLoading={isLoadingCashAdvances}
                    columns={getCashAdvanceColumns({
                      onDelete: (movement: CashAdvanceMovement) => {
                        if (
                          confirm(
                            `Delete this ${movement.movement_type} movement of ₱${Number(movement.amount).toLocaleString()}? The balance will be reversed.`,
                          )
                        ) {
                          deleteMovement.mutate(movement.id)
                        }
                      },
                      canManage: canManageCashAdvance,
                    })}
                    data={
                      cashAdvancesData || {
                        count: 0,
                        next: null,
                        previous: null,
                        results: [],
                      }
                    }
                  />
                )}
              </div>
            </CardContent>
          </Card>

          {/* MANUAL DEDUCTIONS SECTION */}
          <Card className="col-span-full">
            <CardHeader className="flex flex-col sm:flex-row sm:items-center justify-between space-y-2 sm:space-y-0">
              <div className="flex-1">
                <h2 className="text-base sm:text-lg font-semibold flex items-center gap-2">
                  <BadgeDollarSign className="h-4 w-4 sm:h-5 sm:w-5" />
                  Manual Deductions
                </h2>
                <p className="text-xs sm:text-sm text-muted-foreground">
                  Per-employee deductions applied to payroll
                </p>
              </div>
              <Button
                size="sm"
                onClick={() => {
                  setSelectedDeduction(null)
                  setDeductionFormOpen(true)
                }}
                className="w-full sm:w-auto"
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Deduction
              </Button>
            </CardHeader>
            <CardContent>
              {employeeDeductions.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">
                  No manual deductions for this employee.
                </p>
              ) : (
                <div className="space-y-3">
                  {employeeDeductions.map((ded) => (
                    <div
                      key={ded.id}
                      className="flex flex-col sm:flex-row sm:items-center justify-between p-4 border rounded-md gap-3"
                    >
                      <div className="flex items-start gap-3 flex-1">
                        <BadgeDollarSign className="h-5 w-5 text-muted-foreground mt-0.5 shrink-0" />
                        <div className="flex-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <p className="font-medium">{ded.name}</p>
                            <Badge
                              variant={
                                ded.is_recurring ? "default" : "secondary"
                              }
                              className="text-xs"
                            >
                              {ded.is_recurring ? "Recurring" : "One-Time"}
                            </Badge>
                            {!ded.is_active && (
                              <Badge
                                variant="outline"
                                className="text-xs"
                              >
                                Paused
                              </Badge>
                            )}
                          </div>
                          <div className="text-sm text-muted-foreground mt-1 space-y-1">
                            <p>
                              ₱{Number(ded.amount).toLocaleString()} / payroll
                            </p>
                            {ded.effective_date && (
                              <p className="text-xs">
                                {format(
                                  new Date(ded.effective_date),
                                  "MMM d, yyyy",
                                )}
                                {ded.end_date
                                  ? ` - ${format(new Date(ded.end_date), "MMM d, yyyy")}`
                                  : ded.is_recurring
                                    ? " - Ongoing"
                                    : ""}
                              </p>
                            )}
                            {ded.description && (
                              <p className="text-xs italic">
                                {ded.description}
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="flex gap-2 sm:flex-col sm:self-start">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() =>
                            toggleDeduction.mutate({
                              id: ded.id,
                              is_active: !ded.is_active,
                            })
                          }
                          title={ded.is_active ? "Pause" : "Resume"}
                          className="flex-1 sm:flex-none"
                        >
                          {ded.is_active ? (
                            <Pause className="h-4 w-4" />
                          ) : (
                            <Play className="h-4 w-4" />
                          )}
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setSelectedDeduction(ded)
                            setDeductionFormOpen(true)
                          }}
                          className="flex-1 sm:flex-none"
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            if (
                              confirm(
                                `Archive deduction "${ded.name}"? It will be removed from future payrolls.`,
                              )
                            ) {
                              deleteDeduction.mutate(ded.id)
                            }
                          }}
                          className="flex-1 sm:flex-none"
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Government Benefit Overrides */}
          {isAdmin && (
            <Card className="col-span-full">
              <CardHeader className="flex flex-col sm:flex-row sm:items-center justify-between space-y-2 sm:space-y-0">
                <div className="flex-1">
                  <h2 className="text-base sm:text-lg font-semibold">
                    Government Benefit Overrides
                  </h2>
                  <p className="text-xs sm:text-sm text-muted-foreground">
                    Custom government benefit amounts — overrides standard rates for this employee
                  </p>
                </div>
                <Button
                  size="sm"
                  onClick={() => {
                    setSelectedOverride(null)
                    setBenefitOverrideOpen(true)
                  }}
                  className="w-full sm:w-auto"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add Override
                </Button>
              </CardHeader>
              <CardContent>
                {benefitOverrides.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    No benefit overrides configured. Standard rates apply.
                  </p>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {(["sss", "philhealth", "pagibig", "bir_tax"] as const).map((type) => {
                      const typeOverrides = benefitOverrides
                        .filter((o) => o.benefit_type === type)
                        .sort((a, b) => new Date(b.effective_start).getTime() - new Date(a.effective_start).getTime())

                      if (typeOverrides.length === 0) return null

                      const meta: Record<string, { icon: string; label: string }> = {
                        sss: { icon: "🏦", label: "SSS" },
                        philhealth: { icon: "🏥", label: "PhilHealth" },
                        pagibig: { icon: "🏠", label: "Pag-IBIG" },
                        bir_tax: { icon: "📊", label: "BIR Tax" },
                      }

                      return (
                        <div key={type} className="rounded-lg border p-3 space-y-2">
                          <div className="flex items-center gap-2 mb-2">
                            <span className="text-lg">{meta[type].icon}</span>
                            <span className="text-sm font-semibold">{meta[type].label}</span>
                            <Badge variant="outline" className="text-[10px] px-1.5 py-0">
                              {typeOverrides.length} {typeOverrides.length === 1 ? "entry" : "entries"}
                            </Badge>
                          </div>
                          <div className="space-y-2">
                            {typeOverrides.map((override, idx) => (
                              <div
                                key={override.id}
                                className={`relative rounded-md border p-2.5 text-sm ${
                                  !override.is_active ? "opacity-50" : idx === 0 ? "border-primary/30 bg-primary/5" : ""
                                }`}
                              >
                                <div className="flex items-center justify-between mb-1">
                                  <div className="flex items-center gap-1.5">
                                    {idx === 0 && override.is_active && (
                                      <Badge variant="default" className="text-[9px] px-1 py-0">Current</Badge>
                                    )}
                                    {!override.is_active && (
                                      <Badge variant="secondary" className="text-[9px] px-1 py-0">Inactive</Badge>
                                    )}
                                    {idx > 0 && override.is_active && (
                                      <Badge variant="outline" className="text-[9px] px-1 py-0">
                                        <History className="h-2.5 w-2.5 mr-0.5" />
                                        Historical
                                      </Badge>
                                    )}
                                  </div>
                                  <div className="flex gap-0.5">
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      className="h-6 w-6 p-0"
                                      onClick={() => {
                                        setSelectedOverride(override)
                                        setBenefitOverrideOpen(true)
                                      }}
                                    >
                                      <Pencil className="h-3 w-3" />
                                    </Button>
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      className="h-6 w-6 p-0"
                                      onClick={() => {
                                        if (confirm(`Delete this ${meta[type].label} override?`)) {
                                          deleteOverride.mutate(override.id)
                                        }
                                      }}
                                    >
                                      <Trash2 className="h-3 w-3 text-destructive" />
                                    </Button>
                                  </div>
                                </div>
                                <div className="grid grid-cols-2 gap-2">
                                  <div>
                                    <p className="text-[10px] text-muted-foreground">Employee</p>
                                    <p className="text-xs font-medium">
                                      ₱{Number(override.employee_share_amount).toLocaleString()}/wk
                                    </p>
                                  </div>
                                  {override.employer_share_amount != null && (
                                    <div>
                                      <p className="text-[10px] text-muted-foreground">Employer</p>
                                      <p className="text-xs font-medium">
                                        ₱{Number(override.employer_share_amount).toLocaleString()}/wk
                                      </p>
                                    </div>
                                  )}
                                </div>
                                <p className="text-[10px] text-muted-foreground mt-1">
                                  {format(new Date(override.effective_start), "MMM d, yyyy")}
                                  {override.effective_end
                                    ? ` — ${format(new Date(override.effective_end), "MMM d, yyyy")}`
                                    : " — present"}
                                </p>
                                {override.notes && (
                                  <p className="text-[10px] italic text-muted-foreground">{override.notes}</p>
                                )}
                              </div>
                            ))}
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* EDIT SHEET */}
      <EntitySheet<Employee>
        open={open}
        onClose={closeEntity}
        entity={employee}
        title="Edit Employee"
        description="Update the employee details below."
        renderForm={({ forceClose, entity }) => (
          <EmployeeForm
            onClose={forceClose}
            employee={entity}
          />
        )}
      />

      {/* BENEFIT OVERRIDE DIALOG */}
      <EmployeeBenefitOverrideForm
        open={benefitOverrideOpen}
        onOpenChange={setBenefitOverrideOpen}
        override={selectedOverride}
        preselectedEmployee={employee.id}
      />

      {/* MANUAL DEDUCTION DIALOG */}
      <AddManualDeductionForm
        open={deductionFormOpen}
        onOpenChange={setDeductionFormOpen}
        employeeId={employee.id}
        employeeName={`${employee.first_name} ${employee.last_name}`}
        deduction={selectedDeduction}
      />
    </Wrapper>
  )
}

export default EmployeePage
