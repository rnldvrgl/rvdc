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
import { Card, CardContent } from "@/components/ui/card"
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
                <div className="max-w-5xl mx-auto space-y-6">
                    {/* PAGE HEADER SKELETON */}
                    <Card className="shadow-sm">
                        <CardContent className="p-6">
                            <div className="flex items-center gap-4">
                                <Skeleton className="h-16 w-16 rounded-full shrink-0" />
                                <div className="space-y-2 flex-1">
                                    <Skeleton className="h-6 w-48" />
                                    <Skeleton className="h-4 w-32" />
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* INFO GRID SKELETON */}
                    <div className="grid md:grid-cols-2 gap-4">
                        {[...Array(2)].map((_, i) => (
                            <Card key={i}>
                                <CardContent className="p-4 space-y-3">
                                    {[...Array(4)].map((__, j) => (
                                        <div key={j} className="flex items-center gap-3">
                                            <Skeleton className="h-4 w-4 shrink-0" />
                                            <div className="space-y-1 flex-1">
                                                <Skeleton className="h-3 w-20" />
                                                <Skeleton className="h-4 w-full" />
                                            </div>
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
                breadcrumbs={["Dashboard", "Employees", "Details"]}
                variant="compact"
                actionButton={
                    <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 w-full sm:w-auto">
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => router.push("/employees")}
                            className="w-full sm:w-auto"
                        >
                            <ArrowLeft className="size-4 mr-2" />
                            <span className="hidden sm:inline">Back to Employees</span>
                            <span className="sm:hidden">Back</span>
                        </Button>
                        <Button
                            size="sm"
                            onClick={() => openEntity(employee)}
                            className="w-full sm:w-auto"
                        >
                            <Pencil className="size-4 mr-2" />
                            Edit
                        </Button>
                    </div>
                }
            >
                {/* Profile in PageHeader */}
                <div className="flex items-center gap-4">
                    <Avatar className="size-14 sm:size-16 border-2 border-primary shrink-0 text-xl sm:text-2xl">
                        <AvatarImage
                            src={employee.profile_image}
                            alt={`${employee.first_name} ${employee.last_name}`}
                        />
                        <AvatarFallback className="bg-primary/20 text-primary font-bold">
                            {employee.first_name?.[0]}
                            {employee.last_name?.[0]}
                        </AvatarFallback>
                    </Avatar>
                    <div className="min-w-0">
                        <h1 className="text-xl sm:text-2xl font-bold tracking-tight truncate">
                            {employee.first_name} {employee.last_name}
                        </h1>
                        <div className="flex items-center gap-2 mt-1">
                            <p className="text-sm text-muted-foreground capitalize">
                                {employee.role}
                            </p>
                            <Badge
                                variant={employee.is_active ? "default" : "outline"}
                                className="text-[10px] px-1.5 py-0"
                            >
                                {employee.is_active ? "Active" : "Inactive"}
                            </Badge>
                        </div>
                    </div>
                </div>
            </PageHeader>

            <div className="mx-auto space-y-4">
                {/* CONTACT & EMPLOYMENT — compact 2-column grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Card>
                        <CardContent className="p-4 space-y-2.5">
                            <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
                                Contact & Address
                            </h3>
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
                        <CardContent className="p-4 space-y-2.5">
                            <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
                                Employment Info
                            </h3>
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
                </div>

                {/* CASH BAN */}
                <Card>
                    <CardContent className="p-4">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3">
                            <div className="flex items-center gap-2">
                                <Wallet className="h-4 w-4 text-muted-foreground" />
                                <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                                    Cash Ban
                                </h3>
                                <span
                                    className={`text-sm font-semibold ${Number(employee.cash_ban_balance || 0) > 0
                                            ? "text-success"
                                            : "text-muted-foreground"
                                        }`}
                                >
                                    ₱{Number(employee.cash_ban_balance || 0).toLocaleString()}
                                </span>
                            </div>
                            {canManageCashAdvance && (
                                <Button
                                    size="sm"
                                    variant={showCashAdvanceForm ? "outline" : "default"}
                                    onClick={() => setShowCashAdvanceForm(!showCashAdvanceForm)}
                                    className="h-7 text-xs"
                                >
                                    {showCashAdvanceForm ? (
                                        "Cancel"
                                    ) : (
                                        <>
                                            <Plus className="h-3.5 w-3.5 mr-1" />
                                            Record Movement
                                        </>
                                    )}
                                </Button>
                            )}
                        </div>
                        {/* Cash Advance Form */}
                        {canManageCashAdvance && showCashAdvanceForm && (
                            <div className="border rounded-lg p-3 bg-muted/50 mb-3">
                                <CashAdvanceForm
                                    employee={employee}
                                    onSuccess={() => setShowCashAdvanceForm(false)}
                                />
                            </div>
                        )}

                        {/* Cash Advance History */}
                        {cashAdvances.length === 0 ? (
                            <p className="text-sm text-muted-foreground text-center py-3">
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
                    </CardContent>
                </Card>

                {/* MANUAL DEDUCTIONS */}
                <Card>
                    <CardContent className="p-4">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3">
                            <div>
                                <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-2">
                                    <BadgeDollarSign className="h-4 w-4" />
                                    Manual Deductions
                                </h3>
                                <p className="text-xs text-muted-foreground mt-0.5">
                                    Per-employee deductions applied to payroll
                                </p>
                            </div>
                            <Button
                                size="sm"
                                onClick={() => {
                                    setSelectedDeduction(null)
                                    setDeductionFormOpen(true)
                                }}
                                className="h-7 text-xs w-full sm:w-auto"
                            >
                                <Plus className="h-3.5 w-3.5 mr-1" />
                                Add Deduction
                            </Button>
                        </div>
                        {employeeDeductions.length === 0 ? (
                            <p className="text-sm text-muted-foreground text-center py-3">
                                No manual deductions for this employee.
                            </p>
                        ) : (
                            <div className="space-y-2">
                                {employeeDeductions.map((ded) => (
                                    <div
                                        key={ded.id}
                                        className="flex flex-col sm:flex-row sm:items-center justify-between p-3 border rounded-md gap-2"
                                    >
                                        <div className="flex items-start gap-2.5 flex-1">
                                            <BadgeDollarSign className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center gap-1.5 flex-wrap">
                                                    <p className="text-sm font-medium">{ded.name}</p>
                                                    <Badge
                                                        variant={ded.is_recurring ? "default" : "secondary"}
                                                        className="text-[10px] px-1.5 py-0"
                                                    >
                                                        {ded.is_recurring ? "Recurring" : "One-Time"}
                                                    </Badge>
                                                    {!ded.is_active && (
                                                        <Badge variant="outline" className="text-[10px] px-1.5 py-0">
                                                            Paused
                                                        </Badge>
                                                    )}
                                                </div>
                                                <div className="text-xs text-muted-foreground mt-0.5 flex flex-wrap gap-x-3">
                                                    <span>₱{Number(ded.amount).toLocaleString()} / payroll</span>
                                                    {ded.effective_date && (
                                                        <span>
                                                            {format(new Date(ded.effective_date), "MMM d, yyyy")}
                                                            {ded.end_date
                                                                ? ` - ${format(new Date(ded.end_date), "MMM d, yyyy")}`
                                                                : ded.is_recurring ? " - Ongoing" : ""}
                                                        </span>
                                                    )}
                                                </div>
                                                {ded.description && (
                                                    <p className="text-[10px] italic text-muted-foreground mt-0.5">{ded.description}</p>
                                                )}
                                            </div>
                                        </div>
                                        <div className="flex gap-1">
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                className="h-7 w-7 p-0"
                                                onClick={() =>
                                                    toggleDeduction.mutate({
                                                        id: ded.id,
                                                        is_active: !ded.is_active,
                                                    })
                                                }
                                                title={ded.is_active ? "Pause" : "Resume"}
                                            >
                                                {ded.is_active ? (
                                                    <Pause className="h-3.5 w-3.5" />
                                                ) : (
                                                    <Play className="h-3.5 w-3.5" />
                                                )}
                                            </Button>
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                className="h-7 w-7 p-0"
                                                onClick={() => {
                                                    setSelectedDeduction(ded)
                                                    setDeductionFormOpen(true)
                                                }}
                                            >
                                                <Pencil className="h-3.5 w-3.5" />
                                            </Button>
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                className="h-7 w-7 p-0"
                                                onClick={() => {
                                                    if (
                                                        confirm(
                                                            `Archive deduction "${ded.name}"? It will be removed from future payrolls.`,
                                                        )
                                                    ) {
                                                        deleteDeduction.mutate(ded.id)
                                                    }
                                                }}
                                            >
                                                <Trash2 className="h-3.5 w-3.5 text-destructive" />
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
                    <Card>
                        <CardContent className="p-4">
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3">
                                <div>
                                    <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                                        Government Benefit Overrides
                                    </h3>
                                    <p className="text-xs text-muted-foreground mt-0.5">
                                        Custom amounts — overrides standard rates for this employee
                                    </p>
                                </div>
                                <Button
                                    size="sm"
                                    onClick={() => {
                                        setSelectedOverride(null)
                                        setBenefitOverrideOpen(true)
                                    }}
                                    className="h-7 text-xs w-full sm:w-auto"
                                >
                                    <Plus className="h-3.5 w-3.5 mr-1" />
                                    Add Override
                                </Button>
                            </div>
                            {benefitOverrides.length === 0 ? (
                                <p className="text-sm text-muted-foreground text-center py-3">
                                    No benefit overrides configured. Standard rates apply.
                                </p>
                            ) : (
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
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
                                            <div key={type} className="rounded-lg border p-2.5 space-y-1.5">
                                                <div className="flex items-center gap-1.5">
                                                    <span className="text-sm">{meta[type].icon}</span>
                                                    <span className="text-xs font-semibold">{meta[type].label}</span>
                                                    <Badge variant="outline" className="text-[9px] px-1 py-0">
                                                        {typeOverrides.length}
                                                    </Badge>
                                                </div>
                                                <div className="space-y-1.5">
                                                    {typeOverrides.map((override, idx) => (
                                                        <div
                                                            key={override.id}
                                                            className={`relative rounded-md border p-2 text-xs ${!override.is_active ? "opacity-50" : idx === 0 ? "border-primary/30 bg-primary/5" : ""
                                                                }`}
                                                        >
                                                            <div className="flex items-center justify-between mb-0.5">
                                                                <div className="flex items-center gap-1">
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
                                                                        className="h-5 w-5 p-0"
                                                                        onClick={() => {
                                                                            setSelectedOverride(override)
                                                                            setBenefitOverrideOpen(true)
                                                                        }}
                                                                    >
                                                                        <Pencil className="h-2.5 w-2.5" />
                                                                    </Button>
                                                                    <Button
                                                                        variant="ghost"
                                                                        size="sm"
                                                                        className="h-5 w-5 p-0"
                                                                        onClick={() => {
                                                                            if (confirm(`Delete this ${meta[type].label} override?`)) {
                                                                                deleteOverride.mutate(override.id)
                                                                            }
                                                                        }}
                                                                    >
                                                                        <Trash2 className="h-2.5 w-2.5 text-destructive" />
                                                                    </Button>
                                                                </div>
                                                            </div>
                                                            <div className="grid grid-cols-2 gap-1.5">
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
                                                            <p className="text-[10px] text-muted-foreground mt-0.5">
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
