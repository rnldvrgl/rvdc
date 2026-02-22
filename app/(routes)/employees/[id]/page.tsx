"use client"

import { ErrorState } from "@/components/custom/ErrorState"
import EntitySheet from "@/components/custom/shared/EntitySheet"
import PageHeader from "@/components/custom/shared/PageHeader"
import { Wrapper } from "@/components/custom/shared/Wrapper"
import { DataTable } from "@/components/custom/table/DataTable"
import { Detail } from "@/components/details/Detail"
import { CashAdvanceForm } from "@/components/forms/CashAdvanceForm"
import { EmployeeBenefitOverrideForm } from "@/components/forms/EmployeeBenefitOverrideForm"
import EmployeeForm from "@/components/forms/EmployeeForm"
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
import { useCashAdvanceMovements } from "@/lib/queries/useCashAdvances"
import { useEmployeeBenefitOverrides } from "@/lib/queries/useEmployeeBenefitOverrides"
import { useEmployee } from "@/lib/queries/useEmployees"
import { EmployeeBenefitOverride } from "@/lib/schemas/employeeBenefitOverrideSchema"
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
  Pencil,
  Phone,
  Plus,
  Store,
  Trash2,
  User,
  Wallet,
} from "lucide-react"
import Image from "next/image"
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

  const [benefitOverrideOpen, setBenefitOverrideOpen] = useState(false)
  const [selectedOverride, setSelectedOverride] =
    useState<EmployeeBenefitOverride | null>(null)
  const [showCashAdvanceForm, setShowCashAdvanceForm] = useState(false)

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
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              onClick={() => router.push("/employees")}
            >
              <ArrowLeft className="size-4 mr-2" />
              Back to Employees
            </Button>
            <Button onClick={() => openEntity(employee)}>
              <Pencil className="size-4 mr-2" />
              Edit Employee
            </Button>
          </div>
        }
      />

      <div className="mx-auto space-y-8">
        {/* PROFILE HEADER */}
        <Card className="shadow-md">
          <CardHeader className="flex flex-row items-center gap-6">
            {employee.profile_image ? (
              <div className="w-24 h-24 rounded-full overflow-hidden border-2 border-primary">
                <Image
                  src={employee.profile_image}
                  alt={`${employee.first_name} ${employee.last_name}`}
                  width={96}
                  height={96}
                  className="object-cover w-full h-full"
                />
              </div>
            ) : (
              <div className="h-24 w-24 rounded-full bg-primary/20 text-primary flex items-center justify-center text-3xl font-bold">
                {employee.first_name?.[0]}
                {employee.last_name?.[0]}
              </div>
            )}
            <div className="space-y-2">
              <h1 className="text-2xl font-bold">
                {employee.first_name} {employee.last_name}
              </h1>
              <p className="text-muted-foreground capitalize">
                {employee.role}
              </p>
              <Badge variant={employee.is_active ? "default" : "outline"}>
                {employee.is_active ? "Active" : "Inactive"}
              </Badge>
            </div>
          </CardHeader>
        </Card>

        {/* CONTACT & EMPLOYMENT */}
        <div className="grid md:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <h2 className="text-lg font-semibold">Contact & Address</h2>
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
            <CardHeader>
              <h2 className="text-lg font-semibold">Employment & Other Info</h2>
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
                    ? "text-green-600"
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
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
              <div>
                <h2 className="text-lg font-semibold flex items-center gap-2">
                  <Wallet className="h-5 w-5" />
                  Cash Ban
                </h2>
                <p className="text-sm mt-1">
                  <span className="text-muted-foreground">
                    Available Balance:{" "}
                  </span>
                  <span
                    className={
                      Number(employee.cash_ban_balance || 0) > 0
                        ? "text-green-600 font-semibold"
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

          {/* Government Benefit Overrides */}
          {isAdmin && (
            <Card className="col-span-full">
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <h2 className="text-lg font-semibold">Benefit Overrides</h2>
                  <p className="text-sm text-muted-foreground">
                    Custom government benefit amounts for this employee
                  </p>
                </div>
                <Button
                  size="sm"
                  onClick={() => {
                    setSelectedOverride(null)
                    setBenefitOverrideOpen(true)
                  }}
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
                  <div className="space-y-3">
                    {benefitOverrides.map((override) => (
                      <div
                        key={override.id}
                        className="flex items-center justify-between p-4 border rounded-md"
                      >
                        <div className="flex items-start gap-3 flex-1">
                          <BadgeDollarSign className="h-5 w-5 text-muted-foreground mt-0.5" />
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <p className="font-medium">
                                {override.benefit_type_display}
                              </p>
                              {!override.is_active && (
                                <Badge
                                  variant="secondary"
                                  className="text-xs"
                                >
                                  Inactive
                                </Badge>
                              )}
                            </div>
                            <div className="text-sm text-muted-foreground mt-1 space-y-1">
                              <p>
                                Employee: ₱
                                {Number(
                                  override.employee_share_amount,
                                ).toLocaleString()}
                                /week
                                {override.employer_share_amount &&
                                  ` • Employer: ₱${Number(override.employer_share_amount).toLocaleString()}/week`}
                              </p>
                              <p className="text-xs">
                                {format(
                                  new Date(override.effective_start),
                                  "MMM d, yyyy",
                                )}
                                {override.effective_end &&
                                  ` - ${format(new Date(override.effective_end), "MMM d, yyyy")}`}
                                {!override.effective_end && " - Ongoing"}
                              </p>
                              {override.notes && (
                                <p className="text-xs italic">
                                  {override.notes}
                                </p>
                              )}
                            </div>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setSelectedOverride(override)
                              setBenefitOverrideOpen(true)
                            }}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              if (
                                confirm(
                                  `Delete ${override.benefit_type_display} override?`,
                                )
                              ) {
                                deleteOverride.mutate(override.id)
                              }
                            }}
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
    </Wrapper>
  )
}

export default EmployeePage
