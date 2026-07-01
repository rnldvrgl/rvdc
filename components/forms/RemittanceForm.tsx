"use client"

import { zodResolver } from "@hookform/resolvers/zod"
import {
    ArrowRightLeft,
    Banknote,
    Info,
    Minus,
    Pencil,
    Plus,
    Wallet,
} from "lucide-react"
import { useCallback, useEffect, useMemo, useState } from "react"
import { useForm, useWatch } from "react-hook-form"

import { useCurrentUser } from "@/lib/hooks/useCurrentUser"
import { useRemittanceMutations } from "@/lib/mutations/useRemittanceMutations"
import { useStallChoices } from "@/lib/queries/useChoices"
import useUserProfileStore from "@/lib/store/useUserProfileStore"

import { ComboBox } from "@/components/custom/inputs/ComboBox"
import DatePicker from "@/components/custom/inputs/DatePicker"
import { AdminPasswordDialog } from "@/components/custom/shared/AdminPasswordDialog"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Separator } from "@/components/ui/separator"
import { Switch } from "@/components/ui/switch"
import { Textarea } from "@/components/ui/textarea"

import { RemittanceRecordPayload } from "@/lib/constants/infers"
import { RemittanceRecordSchema } from "@/lib/constants/schema"
import { useRemittancePreview } from "@/lib/queries/useRemittancesRecords"
import { cn } from "@/lib/utils/helpers"
import { format, startOfDay } from "date-fns"
import { AnimatedNumber } from "@/components/custom/shared/AnimatedNumber"
import { Format } from "@number-flow/react"

const DENOMINATIONS = [1000, 500, 200, 100, 50, 20, 10, 5, 1] as const
type Denom = (typeof DENOMINATIONS)[number]

const currencyFormat: Format = {
    style: "currency",
    currency: "PHP",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
}

// Visual config for denomination badges — colors come from shadcn theme tokens,
// not hard-coded Tailwind palette colors, so this respects light/dark themes.
const DENOM_CONFIG: Record<Denom, { label: string; type: "bill" | "coin" }> = {
    1000: { label: "₱1,000", type: "bill" },
    500: { label: "₱500", type: "bill" },
    200: { label: "₱200", type: "bill" },
    100: { label: "₱100", type: "bill" },
    50: { label: "₱50", type: "bill" },
    20: { label: "₱20", type: "bill" },
    10: { label: "₱10", type: "coin" },
    5: { label: "₱5", type: "coin" },
    1: { label: "₱1", type: "coin" },
}

interface Props {
    initialData?: RemittanceRecordPayload
    onClose: () => void
}

export default function RemittanceForm({ initialData, onClose }: Props) {
    const { role, isAdmin } = useCurrentUser()
    const userProfile = useUserProfileStore((s) => s.userProfile)
    const { data: stalls } = useStallChoices({})
    const { addRemittance, updateRemittance } = useRemittanceMutations()

    const isEditing = !!initialData
    const isRemitted = initialData?.is_remitted ?? false
    const disabled = isRemitted

    // Preview: fetch expected sales/expenses for the selected stall + date
    const [previewStall, setPreviewStall] = useState<number | undefined>(
        initialData?.stall ??
        (role === "admin" ? undefined : userProfile?.assigned_stall?.id),
    )
    const [previewDate, setPreviewDate] = useState<string | undefined>(
        format(new Date(), "yyyy-MM-dd"),
    )
    const { data: preview, isLoading: previewLoading } = useRemittancePreview({
        stall: isEditing ? undefined : previewStall,
        date: previewDate,
    })

    // "Remit all" mode: when ON, remit count auto-matches declared
    const defaultRemitAll =
        !initialData ||
        DENOMINATIONS.every((d) => {
            const declared = initialData?.cash_breakdown?.[`declared_count_${d}`] ?? 0
            const count = initialData?.cash_breakdown?.[`count_${d}`] ?? 0
            return declared === count
        })
    const [remitAll, setRemitAll] = useState(defaultRemitAll)

    // Manual sales adjustment state
    const [adjustSales, setAdjustSales] = useState(false)
    const [salesOverrides, setSalesOverrides] = useState({
        cash: "",
        gcash: "",
        credit: "",
        debit: "",
        cheque: "",
        expenses: "",
    })

    // Admin authorization for non-admin override adjustments
    const [adminDialogOpen, setAdminDialogOpen] = useState(false)
    const [adminCredentials, setAdminCredentials] = useState<{
        admin_username: string
        admin_password: string
    } | null>(null)
    // Track if the dialog was opened for the "adjust" toggle or for submission
    const [adminDialogPurpose, setAdminDialogPurpose] = useState<
        "adjust" | "submit"
    >("adjust")
    // Temp payload for deferred submission after admin verification
    const [pendingPayload, setPendingPayload] =
        useState<RemittanceRecordPayload | null>(null)

    // Pre-fill overrides when preview loads
    useEffect(() => {
        if (preview && !isEditing) {
            setSalesOverrides({
                cash: preview.total_sales_cash,
                gcash: preview.total_sales_gcash,
                credit: preview.total_sales_credit,
                debit: preview.total_sales_debit,
                cheque: preview.total_sales_cheque,
                expenses: preview.total_expenses,
            })
        }
    }, [preview, isEditing])

    const form = useForm<RemittanceRecordPayload>({
        resolver: zodResolver(RemittanceRecordSchema),
        defaultValues: {
            stall:
                initialData?.stall ??
                (role === "admin" ? undefined : userProfile?.assigned_stall?.id),
            notes: initialData?.notes ?? "",
            remittance_date:
                initialData?.remittance_date ?? format(new Date(), "yyyy-MM-dd"),
            mark_as_acknowledged: false,
            cash_breakdown: {
                ...Object.fromEntries(
                    DENOMINATIONS.flatMap((d) => [
                        [`count_${d}`, initialData?.cash_breakdown?.[`count_${d}`] ?? 0],
                        [
                            `declared_count_${d}`,
                            initialData?.cash_breakdown?.[`declared_count_${d}`] ?? 0,
                        ],
                    ]),
                ),
            },
        },
    })

    const { setValue, getValues, control, handleSubmit, watch } = form

    // Watch date for backdated indicator
    const watchedDate = watch("remittance_date")
    const todayStr = format(new Date(), "yyyy-MM-dd")
    const isBackdated = !isEditing && !!watchedDate && watchedDate !== todayStr

    // Watch all cash_breakdown fields for live totals
    const watchedBreakdown = useWatch({ control, name: "cash_breakdown" })

    // Compute live totals from watched values
    const liveTotals = useMemo(() => {
        let declared = 0
        let remitted = 0
        for (const d of DENOMINATIONS) {
            const dc =
                (watchedBreakdown as Record<string, number>)?.[`declared_count_${d}`] ??
                0
            const rc =
                (watchedBreakdown as Record<string, number>)?.[`count_${d}`] ?? 0
            declared += dc * d
            remitted += rc * d
        }
        return { declared, remitted, cod: declared - remitted }
    }, [watchedBreakdown])

    // Match table logic live in-form: Declared VS Expected (Over/Short/Balanced)
    const expectedToRemitLive = useMemo(() => {
        if (adjustSales && preview) {
            const adjustedExpected =
                (parseFloat(salesOverrides.cash) || 0) +
                (parseFloat(String(preview.cod_from_previous)) || 0) -
                (parseFloat(salesOverrides.expenses) || 0)
            return Math.max(0, adjustedExpected)
        }

        if (preview) {
            return parseFloat(String(preview.expected_remittance)) || 0
        }

        const editExpected =
            (initialData as unknown as { expected_remittance?: string | number })
                ?.expected_remittance ?? 0
        return parseFloat(String(editExpected)) || 0
    }, [adjustSales, preview, salesOverrides, initialData])

    const showLiveBalanceStatus = expectedToRemitLive > 0
    const liveBalance = liveTotals.declared - expectedToRemitLive

    const getCountField = (denom: number): keyof RemittanceRecordPayload =>
        `cash_breakdown.count_${denom}` as keyof RemittanceRecordPayload

    const getDeclaredField = (denom: number): keyof RemittanceRecordPayload =>
        `cash_breakdown.declared_count_${denom}` as keyof RemittanceRecordPayload

    const handleDeclaredChange = useCallback(
        (denom: number, value: number) => {
            setValue(getDeclaredField(denom), value)
            if (remitAll) {
                setValue(getCountField(denom), value)
            }
        },
        [remitAll, setValue],
    )

    const handleRemitChange = useCallback(
        (denom: number, value: number) => {
            // Don't let remit exceed declared
            const declared = (getValues(getDeclaredField(denom)) as number) || 0
            setValue(getCountField(denom), Math.min(value, declared))
        },
        [setValue, getValues],
    )

    const handleRemitAllToggle = useCallback(
        (checked: boolean) => {
            setRemitAll(checked)
            if (checked) {
                // Sync all remit counts to declared
                for (const d of DENOMINATIONS) {
                    const declared = (getValues(getDeclaredField(d)) as number) || 0
                    setValue(getCountField(d), declared)
                }
            }
        },
        [setValue, getValues],
    )

    const increment = useCallback(
        (field: keyof RemittanceRecordPayload, denom: number) => {
            const current = (getValues(field) as number) || 0
            const newVal = current + 1
            setValue(field, newVal)
            // If this is declared and remitAll, sync remit
            if (
                field.toString().startsWith("cash_breakdown.declared_count_") &&
                remitAll
            ) {
                const countField = getCountField(denom)
                setValue(countField, newVal)
            }
        },
        [setValue, getValues, remitAll],
    )

    const decrement = useCallback(
        (field: keyof RemittanceRecordPayload, denom: number) => {
            const current = (getValues(field) as number) || 0
            if (current <= 0) return
            const newVal = current - 1
            setValue(field, newVal)
            // If this is declared and remitAll, sync remit
            if (
                field.toString().startsWith("cash_breakdown.declared_count_") &&
                remitAll
            ) {
                const countField = getCountField(denom)
                setValue(countField, newVal)
            }
            // If this is declared and not remitAll, cap remit to new declared
            if (
                field.toString().startsWith("cash_breakdown.declared_count_") &&
                !remitAll
            ) {
                const countField = getCountField(denom)
                const remitCount = (getValues(countField) as number) || 0
                if (remitCount > newVal) {
                    setValue(countField, newVal)
                }
            }
        },
        [setValue, getValues, remitAll],
    )

    const submitPayload = (payload: RemittanceRecordPayload) => {
        if (isEditing) {
            updateRemittance.mutate(
                { id: initialData.id!, data: payload },
                { onSuccess: onClose },
            )
        } else {
            addRemittance.mutate(payload, { onSuccess: onClose })
        }
    }

    const onSubmit = (data: RemittanceRecordPayload) => {
        if (isRemitted) return

        const stallId =
            role === "admin" ? data.stall : userProfile?.assigned_stall?.id

        if (!stallId) return

        const payload: RemittanceRecordPayload = {
            ...data,
            stall: stallId,
        }

        // Include manual overrides if adjusted
        if (adjustSales && !isEditing) {
            const cash = parseFloat(salesOverrides.cash)
            const gcash = parseFloat(salesOverrides.gcash)
            const credit = parseFloat(salesOverrides.credit)
            const debit = parseFloat(salesOverrides.debit)
            const cheque = parseFloat(salesOverrides.cheque)
            const expenses = parseFloat(salesOverrides.expenses)
            if (!isNaN(cash)) payload.override_sales_cash = cash
            if (!isNaN(gcash)) payload.override_sales_gcash = gcash
            if (!isNaN(credit)) payload.override_sales_credit = credit
            if (!isNaN(debit)) payload.override_sales_debit = debit
            if (!isNaN(cheque)) payload.override_sales_cheque = cheque
            if (!isNaN(expenses)) payload.override_expenses = expenses

            // Non-admin: attach admin credentials if available, or prompt
            if (!isAdmin) {
                if (adminCredentials) {
                    payload.admin_username = adminCredentials.admin_username
                    payload.admin_password = adminCredentials.admin_password
                } else {
                    setPendingPayload(payload)
                    setAdminDialogPurpose("submit")
                    setAdminDialogOpen(true)
                    return
                }
            }
        }

        submitPayload(payload)
    }

    const handleAdminVerified = (credentials: {
        admin_username: string
        admin_password: string
    }) => {
        setAdminCredentials(credentials)
        if (adminDialogPurpose === "adjust") {
            setAdjustSales(true)
        } else if (adminDialogPurpose === "submit" && pendingPayload) {
            const finalPayload = {
                ...pendingPayload,
                admin_username: credentials.admin_username,
                admin_password: credentials.admin_password,
            }
            setPendingPayload(null)
            submitPayload(finalPayload)
        }
    }

    const handleAdjustToggle = () => {
        if (adjustSales) {
            // Turning off adjustments
            setAdjustSales(false)
            setAdminCredentials(null)
            return
        }
        // Turning on: admin skips dialog, non-admin needs verification
        if (isAdmin) {
            setAdjustSales(true)
        } else {
            setAdminDialogPurpose("adjust")
            setAdminDialogOpen(true)
        }
    }

    return (
        <Form {...form}>
            <form
                onSubmit={handleSubmit(onSubmit)}
                className="space-y-5 w-full max-w-xl mx-auto px-1 sm:px-0"
            >
                {/* Stall Selector (admin only) */}
                {role === "admin" && (
                    <FormField
                        control={control}
                        name="stall"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel required>Stall</FormLabel>
                                <FormControl>
                                    <ComboBox
                                        options={
                                            stalls?.map((s) => ({ value: s.id, label: s.name })) ?? []
                                        }
                                        value={field.value ?? null}
                                        onChange={(val) => {
                                            field.onChange(val)
                                            setPreviewStall(typeof val === "number" ? val : undefined)
                                        }}
                                        placeholder="Select stall"
                                        disabled={disabled}
                                    />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                )}

                {/* Date Picker + Backdate Options (admin, create mode only) */}
                {role === "admin" && !isEditing && (
                    <div className="space-y-3">
                        <FormField
                            control={control}
                            name="remittance_date"
                            render={({ field }) => {
                                const dateValue = field.value
                                    ? new Date(field.value + "T00:00:00")
                                    : new Date()

                                return (
                                    <DatePicker
                                        label="Remittance Date"
                                        placeholder="Select date"
                                        field={{
                                            value: dateValue,
                                            onChange: (date: Date | undefined) => {
                                                const d = date || new Date()
                                                const formatted = format(d, "yyyy-MM-dd")
                                                field.onChange(formatted)
                                                setPreviewDate(formatted)
                                            },
                                        }}
                                        withMinMaxDate
                                        maxDate={startOfDay(new Date())}
                                        withMessage
                                    />
                                )
                            }}
                        />

                        {/* Backdated info banner + auto-acknowledge */}
                        {isBackdated && (
                            <div className="rounded-lg border border-warning/30 bg-warning/10 p-3 space-y-3">
                                <div className="flex gap-2 text-sm text-warning">
                                    <Info className="size-4 mt-0.5 shrink-0" />
                                    <div>
                                        <p className="font-medium">Backdated entry</p>
                                        <p className="text-xs text-warning/80">
                                            Sales and expenses will be pulled from the selected date.
                                            COD carry-over may not be accurate for historical entries.
                                        </p>
                                    </div>
                                </div>
                                <FormField
                                    control={control}
                                    name="mark_as_acknowledged"
                                    render={({ field }) => (
                                        <div className="flex items-center justify-between gap-3">
                                            <div className="space-y-0.5">
                                                <p className="text-sm font-medium text-warning">
                                                    Mark as acknowledged
                                                </p>
                                                <p className="text-xs text-warning/80">
                                                    Cash was already collected by admin
                                                </p>
                                            </div>
                                            <Switch
                                                checked={field.value ?? false}
                                                onCheckedChange={field.onChange}
                                            />
                                        </div>
                                    )}
                                />
                            </div>
                        )}
                    </div>
                )}

                {/* Expected Remittance Preview */}
                {!isEditing && preview && !previewLoading && (
                    <div className="rounded-lg border bg-muted/30 p-3 sm:p-4 space-y-3">
                        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                            <p className="text-sm font-medium">
                                Expected for{" "}
                                {format(new Date(preview.date + "T00:00:00"), "MMM dd, yyyy")}
                            </p>
                            <div className="flex flex-wrap items-center gap-2">
                                {preview.already_exists && (
                                    <Badge variant="destructive" className="text-xs">
                                        Already submitted
                                    </Badge>
                                )}
                                <Button
                                    type="button"
                                    variant={adjustSales ? "default" : "outline"}
                                    size="sm"
                                    className="h-7 text-xs gap-1.5"
                                    onClick={handleAdjustToggle}
                                >
                                    <Pencil className="size-3" />
                                    {adjustSales ? "Editing" : "Adjust"}
                                </Button>
                            </div>
                        </div>

                        {adjustSales ? (
                            <div className="grid grid-cols-1 gap-2 text-sm">
                                {[
                                    { key: "cash" as const, label: "Cash Sales" },
                                    { key: "gcash" as const, label: "GCash Sales" },
                                    { key: "credit" as const, label: "Credit Sales" },
                                    { key: "debit" as const, label: "Debit Sales" },
                                    { key: "cheque" as const, label: "Cheque Sales" },
                                    { key: "expenses" as const, label: "Expenses" },
                                ].map(({ key, label }) => (
                                    <div
                                        key={key}
                                        className="flex items-center justify-between gap-3"
                                    >
                                        <span
                                            className={cn(
                                                "text-muted-foreground shrink-0",
                                                key === "expenses" && "text-destructive",
                                            )}
                                        >
                                            {key === "expenses" ? "− " : ""}
                                            {label}
                                        </span>
                                        <Input
                                            type="number"
                                            inputMode="decimal"
                                            min={0}
                                            step="0.01"
                                            className="h-8 w-28 sm:w-32 text-right text-sm font-medium tabular-nums [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
                                            value={salesOverrides[key]}
                                            onChange={(e) =>
                                                setSalesOverrides((prev) => ({
                                                    ...prev,
                                                    [key]: e.target.value,
                                                }))
                                            }
                                        />
                                    </div>
                                ))}
                                <div className="text-[11px] text-muted-foreground flex items-center gap-1 mt-1">
                                    <Info className="size-3 shrink-0" />
                                    Adjust values to match your manual records
                                </div>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 gap-y-2 text-sm">
                                <div className="flex justify-between gap-3">
                                    <span className="text-muted-foreground">Cash Sales</span>
                                    <AnimatedNumber
                                        value={parseFloat(String(preview.total_sales_cash)) || 0}
                                        className="font-medium tabular-nums"
                                        format={currencyFormat}
                                    />
                                </div>
                                {Number(preview.total_sales_gcash) > 0 && (
                                    <div className="flex justify-between gap-3">
                                        <span className="text-muted-foreground">GCash Sales</span>
                                        <AnimatedNumber
                                            value={parseFloat(String(preview.total_sales_gcash)) || 0}
                                            className="font-medium tabular-nums"
                                            format={currencyFormat}
                                        />
                                    </div>
                                )}
                                {Number(preview.total_sales_credit) > 0 && (
                                    <div className="flex justify-between gap-3">
                                        <span className="text-muted-foreground">Credit Sales</span>
                                        <AnimatedNumber
                                            value={parseFloat(String(preview.total_sales_credit)) || 0}
                                            className="font-medium tabular-nums"
                                            format={currencyFormat}
                                        />
                                    </div>
                                )}
                                {Number(preview.total_sales_debit) > 0 && (
                                    <div className="flex justify-between gap-3">
                                        <span className="text-muted-foreground">Debit Sales</span>
                                        <AnimatedNumber
                                            value={parseFloat(String(preview.total_sales_debit)) || 0}
                                            className="font-medium tabular-nums"
                                            format={currencyFormat}
                                        />
                                    </div>
                                )}
                                {Number(preview.total_sales_cheque) > 0 && (
                                    <div className="flex justify-between gap-3">
                                        <span className="text-muted-foreground">Cheque Sales</span>
                                        <AnimatedNumber
                                            value={parseFloat(String(preview.total_sales_cheque)) || 0}
                                            className="font-medium tabular-nums"
                                            format={currencyFormat}
                                        />
                                    </div>
                                )}
                                {Number(preview.cod_from_previous) > 0 && (
                                    <div className="flex justify-between gap-3">
                                        <span className="text-muted-foreground">
                                            + Previous Day Drawer
                                        </span>
                                        <AnimatedNumber
                                            value={parseFloat(String(preview.cod_from_previous)) || 0}
                                            className="font-medium tabular-nums"
                                            format={currencyFormat}
                                        />
                                    </div>
                                )}
                                {Number(preview.total_expenses) > 0 && (
                                    <div className="flex justify-between gap-3">
                                        <span className="text-muted-foreground">− Expenses</span>
                                        <AnimatedNumber
                                            value={parseFloat(String(preview.total_expenses)) || 0}
                                            className="font-medium tabular-nums text-destructive"
                                            format={currencyFormat}
                                        />
                                    </div>
                                )}
                            </div>
                        )}

                        <Separator />
                        <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
                            <span className="text-sm font-semibold">Expected to Remit</span>
                            <AnimatedNumber
                                value={adjustSales
                                    ? Math.max(
                                        0,
                                        (parseFloat(salesOverrides.cash) || 0) +
                                        parseFloat(String(preview.cod_from_previous) || "0") -
                                        (parseFloat(salesOverrides.expenses) || 0),
                                    )
                                    : parseFloat(String(preview.expected_remittance)) || 0}
                                className="text-lg font-bold tabular-nums text-primary"
                                format={currencyFormat}
                            />
                        </div>
                    </div>
                )}

                {/* Live Summary Cards */}
                <div className="grid grid-cols-3 gap-2 sm:gap-3">
                    <div className="rounded-lg border bg-card p-2.5 sm:p-3 text-center space-y-1">
                        <div className="flex items-center justify-center gap-1 sm:gap-1.5 text-[10px] sm:text-xs text-muted-foreground">
                            <Wallet className="size-3 sm:size-3.5 shrink-0" />
                            <span className="truncate">In Drawer</span>
                        </div>
                        <AnimatedNumber value={liveTotals.declared} className="text-sm sm:text-lg font-bold tabular-nums wrap-break-word" format={currencyFormat} />
                    </div>
                    <div className="rounded-lg border bg-card p-2.5 sm:p-3 text-center space-y-1">
                        <div className="flex items-center justify-center gap-1 sm:gap-1.5 text-[10px] sm:text-xs text-muted-foreground">
                            <Banknote className="size-3 sm:size-3.5 shrink-0" />
                            <span className="truncate">To Remit</span>
                        </div>
                        <AnimatedNumber value={liveTotals.remitted} className="text-sm sm:text-lg font-bold tabular-nums text-primary wrap-break-word" format={currencyFormat} />
                    </div>
                    <div className="rounded-lg border bg-card p-2.5 sm:p-3 text-center space-y-1">
                        <div className="flex items-center justify-center gap-1 sm:gap-1.5 text-[10px] sm:text-xs text-muted-foreground">
                            <ArrowRightLeft className="size-3 sm:size-3.5 shrink-0" />
                            <span className="truncate">COD Next Day</span>
                        </div>
                        <AnimatedNumber
                            value={liveTotals.cod}
                            className={cn(
                                "text-sm sm:text-lg font-bold tabular-nums wrap-break-word",
                                liveTotals.cod > 0 ? "text-warning" : "text-success",
                            )}
                            format={currencyFormat}
                        />
                    </div>
                </div>

                {showLiveBalanceStatus && (
                    <div className="rounded-lg border bg-card p-3 flex items-center justify-between gap-3">
                        <span className="text-sm font-medium text-muted-foreground">
                            Declared VS Expected
                        </span>
                        {liveBalance > 0 ? (
                            <Badge variant="warning">
                                Over <AnimatedNumber value={liveBalance} format={currencyFormat} />
                            </Badge>
                        ) : liveBalance < 0 ? (
                            <Badge variant="destructive">
                                Short <AnimatedNumber value={Math.abs(liveBalance)} format={currencyFormat} />
                            </Badge>
                        ) : (
                            <Badge variant="success">Balanced</Badge>
                        )}
                    </div>
                )}

                {/* Remit All Toggle */}
                <div className="flex flex-row items-center justify-between gap-3 rounded-lg border bg-muted/40 px-4 py-3">
                    <div className="space-y-0.5 min-w-0">
                        <p className="text-sm font-medium">Remit all cash</p>
                        <p className="text-xs text-muted-foreground">
                            Turn off to keep some cash in the drawer
                        </p>
                    </div>
                    <Switch
                        checked={remitAll}
                        onCheckedChange={handleRemitAllToggle}
                        disabled={disabled}
                        className="shrink-0"
                    />
                </div>

                {/* Denomination Counter */}
                <div className="space-y-2">
                    <p className="text-sm font-semibold text-foreground">Cash Count</p>

                    <div className="space-y-2">
                        {/* Bills Section */}
                        <div className="space-y-1.5">
                            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider px-1">
                                Bills
                            </p>
                            {DENOMINATIONS.filter((d) => DENOM_CONFIG[d].type === "bill").map(
                                (denom) => (
                                    <DenominationRow
                                        key={denom}
                                        denom={denom}
                                        control={control}
                                        disabled={disabled}
                                        remitAll={remitAll}
                                        getDeclaredField={getDeclaredField}
                                        getCountField={getCountField}
                                        onDeclaredChange={handleDeclaredChange}
                                        onRemitChange={handleRemitChange}
                                        onIncrement={increment}
                                        onDecrement={decrement}
                                    />
                                ),
                            )}
                        </div>

                        <Separator />

                        {/* Coins Section */}
                        <div className="space-y-1.5">
                            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider px-1">
                                Coins
                            </p>
                            {DENOMINATIONS.filter((d) => DENOM_CONFIG[d].type === "coin").map(
                                (denom) => (
                                    <DenominationRow
                                        key={denom}
                                        denom={denom}
                                        control={control}
                                        disabled={disabled}
                                        remitAll={remitAll}
                                        getDeclaredField={getDeclaredField}
                                        getCountField={getCountField}
                                        onDeclaredChange={handleDeclaredChange}
                                        onRemitChange={handleRemitChange}
                                        onIncrement={increment}
                                        onDecrement={decrement}
                                    />
                                ),
                            )}
                        </div>
                    </div>
                </div>

                {/* Notes */}
                <FormField
                    control={control}
                    name="notes"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Notes</FormLabel>
                            <FormControl>
                                <Textarea
                                    {...field}
                                    placeholder="Any remarks about today's cash count..."
                                    disabled={disabled}
                                    rows={2}
                                />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />

                {/* Submit — sticky on mobile so the primary action is always reachable */}
                <div className="sticky bottom-0 -mx-1 sm:mx-0 sm:static flex flex-col-reverse gap-2 sm:gap-3 border-t sm:border-t-0 bg-background/95 backdrop-blur supports-backdrop-filter:bg-background/80 px-1 sm:px-0 py-3 sm:py-0 sm:pt-2 sm:flex-row sm:justify-end">
                    <Button
                        type="button"
                        variant="outline"
                        onClick={onClose}
                        className="w-full sm:w-auto"
                    >
                        Cancel
                    </Button>
                    <Button type="submit" disabled={disabled} className="w-full sm:w-auto">
                        {isEditing ? "Update Remittance" : "Submit Remittance"}
                    </Button>
                </div>
            </form>

            <AdminPasswordDialog
                open={adminDialogOpen}
                onOpenChange={setAdminDialogOpen}
                onVerified={handleAdminVerified}
                description="Adjusting expected sales requires admin approval. Enter admin credentials to proceed."
            />
        </Form>
    )
}

/* ────────────────────────────────────────────
   Denomination Row Component
   ──────────────────────────────────────────── */

interface DenominationRowProps {
    denom: Denom
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    control: any
    disabled: boolean
    remitAll: boolean
    getDeclaredField: (d: number) => keyof RemittanceRecordPayload
    getCountField: (d: number) => keyof RemittanceRecordPayload
    onDeclaredChange: (d: number, v: number) => void
    onRemitChange: (d: number, v: number) => void
    onIncrement: (field: keyof RemittanceRecordPayload, denom: number) => void
    onDecrement: (field: keyof RemittanceRecordPayload, denom: number) => void
}

function DenominationRow({
    denom,
    control,
    disabled,
    remitAll,
    getDeclaredField,
    getCountField,
    onDeclaredChange,
    onRemitChange,
    onIncrement,
    onDecrement,
}: DenominationRowProps) {
    const config = DENOM_CONFIG[denom]

    // Watch individual values for this denomination
    const declaredCount =
        (useWatch({ control, name: getDeclaredField(denom) }) as number) ?? 0
    const remitCount =
        (useWatch({ control, name: getCountField(denom) }) as number) ?? 0
    const codCount = declaredCount - remitCount
    const declaredValue = declaredCount * denom

    return (
        <div
            className={cn(
                "rounded-lg border bg-card p-2.5 sm:p-3 transition-colors",
                declaredCount > 0 && "ring-1 ring-primary/20 bg-primary/5",
            )}
        >
            {/* Top: Denomination label + subtotals */}
            <div className="flex items-center justify-between gap-2 mb-2">
                <Badge
                    variant="outline"
                    className={cn(
                        "text-xs font-semibold px-2.5 py-0.5 shrink-0 font-mono",
                        config.type === "bill"
                            ? "border-success/30 bg-success/10 text-success"
                            : "border-warning/30 bg-warning/10 text-warning",
                    )}
                >
                    {config.label}
                </Badge>
                <div className="flex items-center gap-2 sm:gap-3 text-xs text-muted-foreground tabular-nums min-w-0">
                    {declaredValue > 0 && (
                        <AnimatedNumber value={declaredValue} prefix="= " className="truncate" format={currencyFormat} />
                    )}
                    {!remitAll && codCount > 0 && (
                        <Badge variant="secondary" className="text-[10px] px-1.5 py-0 shrink-0">
                            COD: <AnimatedNumber value={codCount} suffix="x" className="tabular-nums" />
                        </Badge>
                    )}
                </div>
            </div>

            {/* Bottom: Stepper controls */}
            <div
                className={cn(
                    "grid gap-2 sm:gap-3",
                    remitAll ? "grid-cols-1" : "grid-cols-1 sm:grid-cols-2",
                )}
            >
                {/* Declared Count */}
                <div className="space-y-1">
                    <span className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium">
                        {remitAll ? "Count" : "In Drawer"}
                    </span>
                    <FormField
                        control={control}
                        name={getDeclaredField(denom)}
                        render={({ field }) => (
                            <div className="flex items-center gap-1">
                                <Button
                                    type="button"
                                    variant="outline"
                                    size="icon"
                                    className="size-9 sm:size-8 shrink-0"
                                    disabled={disabled || (field.value as number) <= 0}
                                    onClick={() => onDecrement(getDeclaredField(denom), denom)}
                                >
                                    <Minus className="size-3.5" />
                                </Button>
                                <Input
                                    type="number"
                                    inputMode="numeric"
                                    min={0}
                                    className="h-9 sm:h-8 text-center text-sm font-medium tabular-nums [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
                                    disabled={disabled}
                                    value={typeof field.value === "number" ? field.value : 0}
                                    onChange={(e) => {
                                        const val = Math.max(0, parseInt(e.target.value || "0"))
                                        field.onChange(val)
                                        onDeclaredChange(denom, val)
                                    }}
                                />
                                <Button
                                    type="button"
                                    variant="outline"
                                    size="icon"
                                    className="size-9 sm:size-8 shrink-0"
                                    disabled={disabled}
                                    onClick={() => onIncrement(getDeclaredField(denom), denom)}
                                >
                                    <Plus className="size-3.5" />
                                </Button>
                            </div>
                        )}
                    />
                </div>

                {/* Remit Count (only visible when not remitAll) */}
                {!remitAll && (
                    <div className="space-y-1">
                        <span className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium">
                            To Remit
                        </span>
                        <FormField
                            control={control}
                            name={getCountField(denom)}
                            render={({ field }) => (
                                <div className="flex items-center gap-1">
                                    <Button
                                        type="button"
                                        variant="outline"
                                        size="icon"
                                        className="size-9 sm:size-8 shrink-0"
                                        disabled={disabled || (field.value as number) <= 0}
                                        onClick={() => onDecrement(getCountField(denom), denom)}
                                    >
                                        <Minus className="size-3.5" />
                                    </Button>
                                    <Input
                                        type="number"
                                        inputMode="numeric"
                                        min={0}
                                        max={declaredCount}
                                        className="h-9 sm:h-8 text-center text-sm font-medium tabular-nums [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
                                        disabled={disabled}
                                        value={typeof field.value === "number" ? field.value : 0}
                                        onChange={(e) => {
                                            const val = Math.max(0, parseInt(e.target.value || "0"))
                                            field.onChange(val)
                                            onRemitChange(denom, val)
                                        }}
                                    />
                                    <Button
                                        type="button"
                                        variant="outline"
                                        size="icon"
                                        className="size-9 sm:size-8 shrink-0"
                                        disabled={disabled || remitCount >= declaredCount}
                                        onClick={() => onIncrement(getCountField(denom), denom)}
                                    >
                                        <Plus className="size-3.5" />
                                    </Button>
                                </div>
                            )}
                        />
                    </div>
                )}
            </div>
        </div>
    )
}
