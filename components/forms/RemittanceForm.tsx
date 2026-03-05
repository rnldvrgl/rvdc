"use client"

import { zodResolver } from "@hookform/resolvers/zod"
import {
  ArrowRightLeft,
  Banknote,
  CalendarIcon,
  Info,
  Minus,
  Plus,
  Wallet,
} from "lucide-react"
import { useCallback, useMemo, useState } from "react"
import { useForm, useWatch } from "react-hook-form"

import { useCurrentUser } from "@/lib/hooks/useCurrentUser"
import { useRemittanceMutations } from "@/lib/mutations/useRemittanceMutations"
import { useStallChoices } from "@/lib/queries/useChoices"
import useUserProfileStore from "@/lib/store/useUserProfileStore"

import { ComboBox } from "@/components/custom/inputs/ComboBox"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { Separator } from "@/components/ui/separator"
import { Switch } from "@/components/ui/switch"
import { Textarea } from "@/components/ui/textarea"

import { RemittanceRecordPayload } from "@/lib/constants/infers"
import { RemittanceRecordSchema } from "@/lib/constants/schema"
import { useRemittancePreview } from "@/lib/queries/useRemittancesRecords"
import { cn, formatCurrency } from "@/lib/utils/helpers"
import { format, isToday, startOfDay } from "date-fns"

const DENOMINATIONS = [1000, 500, 200, 100, 50, 20, 10, 5, 1] as const
type Denom = (typeof DENOMINATIONS)[number]

// Visual config for denomination badges
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
  const { role } = useCurrentUser()
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
  const [previewDate, setPreviewDate] = useState<string | undefined>(undefined)
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

  const form = useForm<RemittanceRecordPayload>({
    resolver: zodResolver(RemittanceRecordSchema),
    defaultValues: {
      stall:
        initialData?.stall ??
        (role === "admin" ? undefined : userProfile?.assigned_stall?.id),
      notes: initialData?.notes ?? "",
      remittance_date: undefined,
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
  const isBackdated = !isEditing && !!watchedDate

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

  const onSubmit = (data: RemittanceRecordPayload) => {
    if (isRemitted) return

    const stallId =
      role === "admin" ? data.stall : userProfile?.assigned_stall?.id

    if (!stallId) return

    const payload: RemittanceRecordPayload = {
      ...data,
      stall: stallId,
    }

    if (isEditing) {
      updateRemittance.mutate(
        { id: initialData.id!, data: payload },
        { onSuccess: onClose },
      )
    } else {
      addRemittance.mutate(payload, { onSuccess: onClose })
    }
  }

  return (
    <Form {...form}>
      <form
        onSubmit={handleSubmit(onSubmit)}
        className="space-y-6 max-w-xl"
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
                  : undefined

                return (
                  <FormItem>
                    <FormLabel>Remittance Date</FormLabel>
                    <Popover>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            variant="outline"
                            className={cn(
                              "w-full justify-start text-left font-normal",
                              !field.value && "text-muted-foreground",
                            )}
                          >
                            <CalendarIcon className="mr-2 size-4" />
                            {dateValue
                              ? format(dateValue, "EEE, MMM dd yyyy")
                              : "Today (default)"}
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent
                        className="w-auto p-0"
                        align="start"
                      >
                        <Calendar
                          mode="single"
                          selected={dateValue}
                          onSelect={(date) => {
                            if (date && isToday(date)) {
                              field.onChange(undefined)
                              setPreviewDate(undefined)
                            } else if (date) {
                              const formatted = format(date, "yyyy-MM-dd")
                              field.onChange(formatted)
                              setPreviewDate(formatted)
                            } else {
                              field.onChange(undefined)
                              setPreviewDate(undefined)
                            }
                          }}
                          disabled={(date) => date > startOfDay(new Date())}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                    <FormMessage />
                  </FormItem>
                )
              }}
            />

            {/* Backdated info banner + auto-acknowledge */}
            {isBackdated && (
              <div className="rounded-lg border border-amber-200 bg-amber-50 dark:border-amber-800 dark:bg-amber-950/30 p-3 space-y-3">
                <div className="flex gap-2 text-sm text-amber-700 dark:text-amber-400">
                  <Info className="size-4 mt-0.5 shrink-0" />
                  <div>
                    <p className="font-medium">Backdated entry</p>
                    <p className="text-xs text-amber-600 dark:text-amber-500">
                      Sales and expenses will be pulled from the selected date.
                      COD carry-over may not be accurate for historical entries.
                    </p>
                  </div>
                </div>
                <FormField
                  control={control}
                  name="mark_as_acknowledged"
                  render={({ field }) => (
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <p className="text-sm font-medium text-amber-700 dark:text-amber-400">
                          Mark as acknowledged
                        </p>
                        <p className="text-xs text-amber-600 dark:text-amber-500">
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
          <div className="rounded-lg border bg-muted/30 p-4 space-y-3">
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium">
                Expected for{" "}
                {format(new Date(preview.date + "T00:00:00"), "MMM dd, yyyy")}
              </p>
              {preview.already_exists && (
                <Badge
                  variant="destructive"
                  className="text-xs"
                >
                  Already submitted
                </Badge>
              )}
            </div>
            <div className="grid grid-cols-2 gap-x-6 gap-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Cash Sales</span>
                <span className="font-medium tabular-nums">
                  {formatCurrency(preview.total_sales_cash)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">GCash</span>
                <span className="font-medium tabular-nums">
                  {formatCurrency(preview.total_sales_gcash)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">COD In</span>
                <span className="font-medium tabular-nums">
                  {formatCurrency(preview.cod_from_previous)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Expenses</span>
                <span className="font-medium tabular-nums text-red-600">
                  {Number(preview.total_expenses) > 0
                    ? `−${formatCurrency(preview.total_expenses)}`
                    : formatCurrency(0)}
                </span>
              </div>
            </div>
            <Separator />
            <div className="flex items-center justify-between">
              <span className="text-sm font-semibold">Expected to Remit</span>
              <span className="text-lg font-bold tabular-nums text-primary">
                {formatCurrency(preview.expected_remittance)}
              </span>
            </div>
          </div>
        )}

        {/* Live Summary Cards */}
        <div className="grid grid-cols-3 gap-3">
          <div className="rounded-lg border bg-card p-3 text-center space-y-1">
            <div className="flex items-center justify-center gap-1.5 text-xs text-muted-foreground">
              <Wallet className="size-3.5" />
              In Drawer
            </div>
            <p className="text-lg font-bold tabular-nums">
              {formatCurrency(liveTotals.declared)}
            </p>
          </div>
          <div className="rounded-lg border bg-card p-3 text-center space-y-1">
            <div className="flex items-center justify-center gap-1.5 text-xs text-muted-foreground">
              <Banknote className="size-3.5" />
              To Remit
            </div>
            <p className="text-lg font-bold tabular-nums text-primary">
              {formatCurrency(liveTotals.remitted)}
            </p>
          </div>
          <div className="rounded-lg border bg-card p-3 text-center space-y-1">
            <div className="flex items-center justify-center gap-1.5 text-xs text-muted-foreground">
              <ArrowRightLeft className="size-3.5" />
              COD Next Day
            </div>
            <p
              className={cn(
                "text-lg font-bold tabular-nums",
                liveTotals.cod > 0 ? "text-amber-600" : "text-green-600",
              )}
            >
              {formatCurrency(liveTotals.cod)}
            </p>
          </div>
        </div>

        {/* Remit All Toggle */}
        <div className="flex items-center justify-between rounded-lg border bg-muted/40 px-4 py-3">
          <div className="space-y-0.5">
            <p className="text-sm font-medium">Remit all cash</p>
            <p className="text-xs text-muted-foreground">
              Turn off to keep some cash in the drawer
            </p>
          </div>
          <Switch
            checked={remitAll}
            onCheckedChange={handleRemitAllToggle}
            disabled={disabled}
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

        {/* Submit */}
        <div className="flex justify-end gap-3 pt-2">
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            disabled={disabled}
          >
            {isEditing ? "Update Remittance" : "Submit Remittance"}
          </Button>
        </div>
      </form>
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
        "rounded-lg border bg-card p-3 transition-colors",
        declaredCount > 0 && "ring-1 ring-primary/20 bg-primary/2",
      )}
    >
      {/* Top: Denomination label + subtotals */}
      <div className="flex items-center justify-between mb-2">
        <Badge
          variant="outline"
          className={cn(
            "text-xs font-semibold px-2.5 py-0.5",
            config.type === "bill"
              ? "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-800 dark:bg-emerald-950 dark:text-emerald-400"
              : "border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-800 dark:bg-amber-950 dark:text-amber-400",
          )}
        >
          {config.label}
        </Badge>
        <div className="flex items-center gap-3 text-xs text-muted-foreground tabular-nums">
          {declaredValue > 0 && <span>= {formatCurrency(declaredValue)}</span>}
          {!remitAll && codCount > 0 && (
            <Badge
              variant="secondary"
              className="text-[10px] px-1.5 py-0"
            >
              COD: {codCount}×
            </Badge>
          )}
        </div>
      </div>

      {/* Bottom: Stepper controls */}
      <div
        className={cn("grid gap-3", remitAll ? "grid-cols-1" : "grid-cols-2")}
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
                  className="size-8 shrink-0"
                  disabled={disabled || (field.value as number) <= 0}
                  onClick={() => onDecrement(getDeclaredField(denom), denom)}
                >
                  <Minus className="size-3.5" />
                </Button>
                <Input
                  type="number"
                  inputMode="numeric"
                  min={0}
                  className="h-8 text-center text-sm font-medium tabular-nums [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
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
                  className="size-8 shrink-0"
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
                    className="size-8 shrink-0"
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
                    className="h-8 text-center text-sm font-medium tabular-nums [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
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
                    className="size-8 shrink-0"
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
