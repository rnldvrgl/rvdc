"use client"

import { zodResolver } from "@hookform/resolvers/zod"
import { useEffect, useMemo, useRef, useState } from "react"
import { useForm } from "react-hook-form"
import { AnimatePresence, motion } from "framer-motion"

import {
    ClientComboBox,
    useClients,
} from "@/components/custom/inputs/ClientComboBox"
import { ComboBox } from "@/components/custom/inputs/ComboBox"
import DatePicker from "@/components/custom/inputs/DatePicker"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { AnimatedNumber } from "@/components/custom/shared/AnimatedNumber"
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
import { Textarea } from "@/components/ui/textarea"

import { cn } from "@/lib/utils/helpers"
import { ChequeStatus } from "@/lib/constants/general"
import { ChequeCollection } from "@/lib/constants/interface"
import { ChequeCollectionSchema } from "@/lib/constants/schema"
import { ChequeCollectionPayload } from "@/lib/constants/types"
import { useChequeCollectionMutations } from "@/lib/mutations/useChequeCollectionMutations"
import { useBanksChoices, useUsersChoices } from "@/lib/queries/useChoices"
import { getBadgeVariant } from "@/lib/utils/helpers"
import { formatBackDate } from "@/lib/utils/helpers/date"
import {
    ArrowDownRight,
    ArrowUpRight,
    Banknote,
    Check,
    CheckCircle2,
    ClipboardCheck,
    CreditCard,
    FileText,
    Loader2,
    Save,
} from "lucide-react"

// ── Status options ─────────────────────────────────────

const STATUS_OPTIONS = [
    { value: "pending", label: "Pending" },
    { value: "deposited", label: "Deposited" },
    { value: "encashed", label: "Encashed" },
    { value: "returned", label: "Returned" },
    { value: "bounced", label: "Bounced" },
    { value: "cancelled", label: "Cancelled" },
] as const

// ── Section wrapper ────────────────────────────────────
// Numbered because this genuinely is a sequential process: capture the
// cheque, verify it against billing, set its status, then add notes.

function Section({
    step,
    icon: Icon,
    title,
    description,
    children,
    className,
}: {
    step: number
    icon: React.ElementType
    title: string
    description?: string
    children: React.ReactNode
    className?: string
}) {
    return (
        <div
            className={cn(
                "space-y-4 rounded-2xl border bg-card p-4 shadow-sm sm:p-5",
                className,
            )}
        >
            <div className="flex items-start gap-3">
                <div className="flex items-center justify-center size-9 rounded-lg bg-primary/10 text-primary shrink-0">
                    <Icon className="size-5" />
                </div>
                <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                        <span className="font-mono text-[11px] font-semibold text-muted-foreground/70">
                            {String(step).padStart(2, "0")}
                        </span>
                        <h3 className="text-sm font-semibold sm:text-base">{title}</h3>
                    </div>
                    {description && (
                        <p className="mt-0.5 text-xs text-muted-foreground">{description}</p>
                    )}
                </div>
            </div>
            <Separator className="bg-border/60" />
            {children}
        </div>
    )
}

// ── Status chip selector ───────────────────────────────
// Six fixed options don't need a dropdown — tap-to-select is faster,
// works better on mobile, and shows every option (and the current pick)
// at a glance instead of hiding them behind a click.

function StatusSelector({
    value,
    onChange,
    disabled,
}: {
    value: string
    onChange: (v: string) => void
    disabled?: boolean
}) {
    return (
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
            {STATUS_OPTIONS.map((opt) => {
                const selected = value === opt.value
                return (
                    <button
                        key={opt.value}
                        type="button"
                        disabled={disabled}
                        onClick={() => onChange(opt.value)}
                        className={cn(
                            "flex items-center justify-between gap-2 rounded-xl border px-3 py-2.5 text-left text-sm font-medium transition-all",
                            "disabled:cursor-not-allowed disabled:opacity-60",
                            selected
                                ? "border-primary bg-primary/5 ring-2 ring-primary/20"
                                : "border-border bg-background hover:border-primary/40 hover:bg-muted/40",
                        )}
                    >
                        <span className="flex items-center gap-2 min-w-0">
                            <Badge
                                variant={getBadgeVariant(opt.value)}
                                className="size-2 rounded-full p-0 shrink-0"
                            />
                            <span className="truncate">{opt.label}</span>
                        </span>
                        {selected && <Check className="size-4 text-primary shrink-0" />}
                    </button>
                )
            })}
        </div>
    )
}

// ── Form ───────────────────────────────────────────────

interface Props {
    initialData?: ChequeCollection
    onClose: () => void
}

export default function ChequeCollectionForm({ initialData, onClose }: Props) {
    const submitLockRef = useRef(false)
    const [sameAsClient, setSameAsClient] = useState(true)
    const { addChequeCollection, updateChequeCollection } =
        useChequeCollectionMutations()
    const { clients, isLoading: clientsLoading } = useClients()
    const { data: users, isLoading: usersLoading } = useUsersChoices()
    const { data: banks } = useBanksChoices()

    const isEditing = !!initialData

    const form = useForm<ChequeCollectionPayload>({
        resolver: zodResolver(ChequeCollectionSchema),
        defaultValues: {
            client:
                typeof initialData?.client === "number"
                    ? initialData.client
                    : undefined,
            status: initialData?.status ?? ChequeStatus.PENDING,
            bank_name: initialData?.bank_name ?? "",
            deposit_bank: initialData?.deposit_bank ?? "",
            cheque_number: initialData?.cheque_number ?? "",
            cheque_amount: initialData?.cheque_amount
                ? Number(initialData.cheque_amount)
                : undefined,
            cheque_date: initialData?.cheque_date
                ? new Date(initialData.cheque_date)
                : undefined,
            issued_by: initialData?.issued_by ?? "",
            billing_amount: initialData?.billing_amount
                ? Number(initialData.billing_amount)
                : undefined,
            or_number: initialData?.or_number ?? "",
            date_collected: initialData?.date_collected
                ? new Date(initialData.date_collected)
                : undefined,
            collected_by:
                typeof initialData?.collected_by === "number"
                    ? initialData.collected_by
                    : undefined,
            notes: initialData?.notes ?? "",
        },
    })

    const mutationLoading =
        addChequeCollection.isPending || updateChequeCollection.isPending

    const userOptions = useMemo(() => {
        if (usersLoading) return [{ value: "", label: "Loading..." }]
        return users?.map((u) => ({ value: u.id, label: u.full_name ?? "" })) ?? []
    }, [users, usersLoading])

    const selectedClientId = form.watch("client")
    const selectedStatus = form.watch("status")
    const chequeAmount = form.watch("cheque_amount")
    const billingAmount = form.watch("billing_amount")

    const needsDepositBank = ["deposited", "encashed"].includes(selectedStatus || "")

    // Auto-fill issued_by when sameAsClient is true
    useEffect(() => {
        if (sameAsClient && selectedClientId && clients) {
            const clientName =
                clients.find((c) => c.id === selectedClientId)?.full_name || ""
            form.setValue("issued_by", clientName)
        }
    }, [sameAsClient, selectedClientId, clients, form])

    useEffect(() => {
        if (!needsDepositBank) {
            form.setValue("deposit_bank", "")
        }
    }, [needsDepositBank, form])

    const onSubmit = async (data: ChequeCollectionPayload) => {
        if (submitLockRef.current || mutationLoading) return
        submitLockRef.current = true

        const payload = {
            ...data,
            cheque_date: new Date(formatBackDate(data.cheque_date)),
            date_collected: data.date_collected,
        }

        try {
            if (isEditing) {
                await updateChequeCollection.mutateAsync({ id: initialData!.id, data: payload })
            } else {
                await addChequeCollection.mutateAsync(payload)
            }

            onClose()
        } finally {
            submitLockRef.current = false
        }
    }

    const difference =
        chequeAmount && billingAmount
            ? Number(chequeAmount) - Number(billingAmount)
            : null

    return (
        <Form {...form}>
            <form
                onSubmit={form.handleSubmit(onSubmit)}
                className="space-y-6"
            >
                {/* Step 1 — Cheque Details */}
                <Section
                    step={1}
                    icon={CreditCard}
                    title="Cheque Details"
                    description="Who it's from and what's written on the cheque."
                >
                    <div className="space-y-4">
                        <FormField
                            control={form.control}
                            name="client"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel required>Client</FormLabel>
                                    <FormControl>
                                        <ClientComboBox
                                            value={field.value ?? null}
                                            onChange={field.onChange}
                                            disabled={mutationLoading || clientsLoading}
                                            nameOnly
                                        />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                            <FormField
                                control={form.control}
                                name="bank_name"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel required>Issuing Bank</FormLabel>
                                        <FormControl>
                                            <ComboBox
                                                options={banks ?? []}
                                                value={field.value || null}
                                                onChange={field.onChange}
                                                placeholder="Select bank"
                                                disabled={mutationLoading}
                                            />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <FormField
                                control={form.control}
                                name="cheque_number"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel required>Cheque Number</FormLabel>
                                        <FormControl>
                                            <Input
                                                {...field}
                                                placeholder="e.g. 001234567"
                                                disabled={mutationLoading}
                                            />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>

                        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                            <FormField
                                control={form.control}
                                name="cheque_amount"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel required>Cheque Amount (₱)</FormLabel>
                                        <FormControl>
                                            <Input
                                                type="number"
                                                step="0.01"
                                                value={field.value ?? ""}
                                                onChange={(e) =>
                                                    field.onChange(e.target.valueAsNumber || undefined)
                                                }
                                                placeholder="0.00"
                                                disabled={mutationLoading}
                                            />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <FormField
                                control={form.control}
                                name="cheque_date"
                                render={({ field }) => (
                                    <FormItem>
                                        <DatePicker
                                            field={field}
                                            placeholder="Pick a date"
                                            label="Cheque Date"
                                            disabled={mutationLoading}
                                            required
                                            maxDate={
                                                new Date(
                                                    new Date().setFullYear(new Date().getFullYear() + 1),
                                                )
                                            }
                                        />
                                    </FormItem>
                                )}
                            />
                        </div>

                        <FormField
                            control={form.control}
                            name="issued_by"
                            render={({ field }) => (
                                <FormItem>
                                    <div className="flex items-center justify-between gap-2">
                                        <FormLabel required>Issued By</FormLabel>
                                        <label
                                            htmlFor="sameAsClient"
                                            className="flex items-center gap-1.5 text-xs text-muted-foreground cursor-pointer select-none"
                                        >
                                            <Checkbox
                                                id="sameAsClient"
                                                checked={sameAsClient}
                                                onCheckedChange={(checked) => setSameAsClient(!!checked)}
                                                disabled={mutationLoading}
                                                className="size-3.5"
                                            />
                                            Same as client
                                        </label>
                                    </div>
                                    <FormControl>
                                        <Input
                                            {...field}
                                            placeholder="Name on the cheque"
                                            disabled={mutationLoading || sameAsClient}
                                        />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                    </div>
                </Section>

                {/* Step 2 — Billing & Verification */}
                <Section
                    step={2}
                    icon={Banknote}
                    title="Billing & Verification"
                    description="Check the cheque against what was actually billed."
                >
                    <div className="space-y-4">
                        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                            <FormField
                                control={form.control}
                                name="billing_amount"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel required>Billing Amount (₱)</FormLabel>
                                        <FormControl>
                                            <Input
                                                type="number"
                                                step="0.01"
                                                value={field.value ?? ""}
                                                onChange={(e) =>
                                                    field.onChange(e.target.valueAsNumber || undefined)
                                                }
                                                placeholder="0.00"
                                                disabled={mutationLoading}
                                            />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <FormField
                                control={form.control}
                                name="or_number"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>OR Number</FormLabel>
                                        <FormControl>
                                            <Input
                                                {...field}
                                                placeholder="e.g. OR-2026-0001"
                                                disabled={mutationLoading}
                                            />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>

                        {/* Amount Comparison — the one number that tells the
                           collector whether this cheque needs follow-up, so
                           it gets the most visual weight in the section. */}
                        <AnimatePresence>
                            {difference !== null && (
                                <motion.div
                                    initial={{ opacity: 0, height: 0 }}
                                    animate={{ opacity: 1, height: "auto" }}
                                    exit={{ opacity: 0, height: 0 }}
                                    transition={{ duration: 0.2 }}
                                    className="overflow-hidden"
                                >
                                    <div
                                        className={cn(
                                            "flex flex-col gap-2 rounded-xl border-2 px-4 py-3.5 sm:flex-row sm:items-center sm:justify-between",
                                            difference > 0 && "bg-success/10 border-success/30",
                                            difference < 0 && "bg-destructive/10 border-destructive/30",
                                            difference === 0 && "bg-muted/40 border-border",
                                        )}
                                    >
                                        <span className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                                            {difference > 0 && (
                                                <ArrowUpRight className="size-4 text-success shrink-0" />
                                            )}
                                            {difference < 0 && (
                                                <ArrowDownRight className="size-4 text-destructive shrink-0" />
                                            )}
                                            {difference === 0 && (
                                                <CheckCircle2 className="size-4 text-muted-foreground shrink-0" />
                                            )}
                                            {difference > 0
                                                ? "Cheque exceeds billing by"
                                                : difference < 0
                                                    ? "Cheque is short by"
                                                    : "Amounts match exactly"}
                                        </span>
                                        {difference !== 0 && (
                                            <AnimatedNumber
                                                value={Math.abs(Number(difference))}
                                                prefix="₱"
                                                format={{ minimumFractionDigits: 2, maximumFractionDigits: 2 }}
                                                className={cn(
                                                    "text-lg font-bold",
                                                    difference > 0 ? "text-success" : "text-destructive",
                                                )}
                                            />
                                        )}
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>
                </Section>

                {/* Step 3 — Status & Collection */}
                <Section
                    step={3}
                    icon={ClipboardCheck}
                    title="Status & Collection"
                    description="Where this cheque is in the process right now."
                >
                    <div className="space-y-4">
                        <FormField
                            control={form.control}
                            name="status"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel required>Status</FormLabel>
                                    <FormControl>
                                        <StatusSelector
                                            value={field.value ?? ""}
                                            onChange={field.onChange}
                                            disabled={mutationLoading}
                                        />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <AnimatePresence>
                            {needsDepositBank && (
                                <motion.div
                                    initial={{ opacity: 0, height: 0 }}
                                    animate={{ opacity: 1, height: "auto" }}
                                    exit={{ opacity: 0, height: 0 }}
                                    transition={{ duration: 0.2 }}
                                    className="overflow-hidden"
                                >
                                    <FormField
                                        control={form.control}
                                        name="deposit_bank"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel required>Deposit Bank</FormLabel>
                                                <FormControl>
                                                    <ComboBox
                                                        options={banks ?? []}
                                                        value={field.value || null}
                                                        onChange={field.onChange}
                                                        placeholder="Select deposit bank"
                                                        disabled={mutationLoading}
                                                    />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                </motion.div>
                            )}
                        </AnimatePresence>

                        <Separator className="my-2" />

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <FormField
                                control={form.control}
                                name="date_collected"
                                render={({ field }) => (
                                    <FormItem>
                                        <DatePicker
                                            field={field}
                                            label="Date Collected"
                                            placeholder="Pick a date"
                                            disabled={mutationLoading}
                                        />
                                    </FormItem>
                                )}
                            />

                            <FormField
                                control={form.control}
                                name="collected_by"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Collected By</FormLabel>
                                        <FormControl>
                                            <ComboBox
                                                options={userOptions}
                                                value={field.value ?? null}
                                                onChange={field.onChange}
                                                placeholder="Select collector"
                                                disabled={mutationLoading || usersLoading}
                                            />
                                        </FormControl>
                                        <p className="text-xs text-muted-foreground mt-1.5">
                                            Leave empty if delivered by client
                                        </p>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>
                    </div>
                </Section>

                {/* Step 4 — Notes */}
                <Section
                    step={4}
                    icon={FileText}
                    title="Notes"
                >
                    <FormField
                        control={form.control}
                        name="notes"
                        render={({ field }) => (
                            <FormItem>
                                <FormControl>
                                    <Textarea
                                        {...field}
                                        placeholder="Add any additional remarks or important information..."
                                        rows={4}
                                        disabled={mutationLoading}
                                        className="resize-none"
                                    />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                </Section>

                {/* Actions */}
                <div className="sticky bottom-0 z-10 mt-4 border-t bg-background/95 px-1 py-3 backdrop-blur sm:static sm:border-0 sm:bg-transparent sm:px-0 sm:py-0">
                    <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end sm:gap-3">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={onClose}
                            disabled={mutationLoading}
                            className="w-full sm:min-w-[100px] sm:w-auto"
                        >
                            Cancel
                        </Button>
                        <Button
                            type="submit"
                            disabled={mutationLoading}
                            className="w-full sm:min-w-[140px] sm:w-auto"
                        >
                            {mutationLoading ? (
                                <Loader2 className="size-4 mr-2 animate-spin" />
                            ) : (
                                <Save className="size-4 mr-2" />
                            )}
                            {mutationLoading ? "Saving..." : isEditing ? "Update Cheque" : "Save Cheque"}
                        </Button>
                    </div>
                </div>
            </form>
        </Form>
    )
}
