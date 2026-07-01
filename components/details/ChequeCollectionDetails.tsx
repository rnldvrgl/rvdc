"use client"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { AnimatedNumber } from "@/components/custom/shared/AnimatedNumber"
import { cn } from "@/lib/utils/helpers"
import { ChequeCollection } from "@/lib/constants/interface"
import { formatDate } from "@/lib/utils/helpers/date"
import {
    ArrowDownRight,
    ArrowUpRight,
    Banknote,
    Building2,
    CalendarDays,
    CheckCircle2,
    ClipboardCheck,
    CreditCard,
    FileText,
    Hash,
    Landmark,
    Receipt,
    User,
} from "lucide-react"

const statusConfig: Record<
    string,
    {
        variant: "default" | "secondary" | "success" | "destructive" | "outline"
        className: string
        label: string
    }
> = {
    pending: {
        variant: "secondary",
        className: "bg-warning/10 text-warning border-warning/30",
        label: "Pending",
    },
    deposited: {
        variant: "default",
        className: "bg-info/10 text-info border-info/30",
        label: "Deposited",
    },
    encashed: {
        variant: "success",
        className: "bg-success/10 text-success border-success/30",
        label: "Encashed",
    },
    returned: {
        variant: "outline",
        className: "bg-muted/60 text-muted-foreground border-border",
        label: "Returned",
    },
    bounced: {
        variant: "destructive",
        className: "bg-destructive/10 text-destructive border-destructive/30",
        label: "Bounced",
    },
    cancelled: {
        variant: "outline",
        className: "bg-muted/60 text-muted-foreground border-border",
        label: "Cancelled",
    },
}

function Section({
    step,
    icon: Icon,
    title,
    description,
    children,
}: {
    step: number
    icon: React.ElementType
    title: string
    description?: string
    children: React.ReactNode
}) {
    return (
        <div className="rounded-2xl border bg-background p-4 shadow-sm space-y-4 sm:p-5">
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

function InfoRow({
    icon: Icon,
    label,
    value,
    className,
}: {
    icon: React.ElementType
    label: string
    value: React.ReactNode
    className?: string
}) {
    return (
        <div className="flex items-start gap-3 rounded-xl border border-border/60 bg-muted/30 p-3 sm:p-4">
            <div className="mt-0.5 flex items-center justify-center size-8 rounded-lg bg-primary/10 text-primary shrink-0">
                <Icon className="size-4" />
            </div>
            <div className="flex-1 min-w-0">
                <p className="text-xs font-medium text-muted-foreground mb-0.5">
                    {label}
                </p>
                <p className={cn("text-sm font-semibold wrap-break-word", className)}>
                    {value}
                </p>
            </div>
        </div>
    )
}

export function ChequeCollectionDetails({
    entity,
    onCloseAction,
}: {
    entity: ChequeCollection
    onCloseAction: () => void
}) {
    const status = statusConfig[entity.status] ?? statusConfig.pending
    const difference =
        Number(entity.cheque_amount) - Number(entity.billing_amount)

    return (
        <div className="space-y-5 sm:space-y-6">
            <div className="rounded-2xl border bg-linear-to-br from-background to-muted/20 p-4 shadow-sm sm:p-5">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                    <div className="space-y-1.5">
                        <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                            Status
                        </p>
                        <Badge
                            className={cn("px-3 py-1.5 text-sm font-semibold border", status.className)}
                        >
                            {status.label}
                        </Badge>
                    </div>
                    <div className="space-y-1.5 sm:text-right">
                        <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                            Cheque Amount
                        </p>
                        <AnimatedNumber
                            value={Number(entity.cheque_amount)}
                            prefix="₱"
                            format={{ minimumFractionDigits: 2, maximumFractionDigits: 2 }}
                            className="text-2xl font-bold text-primary sm:text-3xl"
                        />
                    </div>
                </div>
            </div>

            {/* Step 1 — Cheque Details (mirrors the form's step 1: who it's
               from and what's written on the cheque) */}
            <Section
                step={1}
                icon={CreditCard}
                title="Cheque Details"
                description="Who it's from and what's written on the cheque."
            >
                <div className="grid grid-cols-1 gap-3 sm:gap-4">
                    <InfoRow
                        icon={User}
                        label="Client Name"
                        value={<span className="font-medium">{entity.client_name}</span>}
                    />
                    <InfoRow
                        icon={Building2}
                        label="Issuing Bank"
                        value={<span className="font-medium">{entity.bank_name}</span>}
                    />
                    <InfoRow
                        icon={Hash}
                        label="Cheque Number"
                        value={
                            <span className="font-mono tabular-nums font-semibold">
                                {entity.cheque_number}
                            </span>
                        }
                    />
                    <InfoRow
                        icon={CalendarDays}
                        label="Cheque Date"
                        value={
                            <span className="font-mono tabular-nums">
                                {formatDate(new Date(entity.cheque_date), "MMM dd, yyyy")}
                            </span>
                        }
                    />
                    <InfoRow
                        icon={FileText}
                        label="Issued By"
                        value={<span className="font-medium">{entity.issued_by}</span>}
                    />
                </div>
            </Section>

            {/* Step 2 — Billing & Verification (mirrors the form's step 2) */}
            <Section
                step={2}
                icon={Banknote}
                title="Billing & Verification"
                description="How the cheque compares against what was billed."
            >
                <div className="space-y-3">
                    <div className="grid gap-3">
                        <div className="flex flex-col gap-2 rounded-xl border bg-muted/30 p-4">
                            <span className="text-sm font-medium text-muted-foreground">
                                Cheque Amount
                            </span>
                            <AnimatedNumber
                                value={Number(entity.cheque_amount)}
                                prefix="₱"
                                format={{ minimumFractionDigits: 2, maximumFractionDigits: 2 }}
                                className="text-lg font-bold"
                            />
                        </div>
                        <div className="flex flex-col gap-2 rounded-xl border bg-muted/30 p-4">
                            <span className="text-sm font-medium text-muted-foreground">
                                Billing Amount
                            </span>
                            <AnimatedNumber
                                value={Number(entity.billing_amount)}
                                prefix="₱"
                                format={{ minimumFractionDigits: 2, maximumFractionDigits: 2 }}
                                className="text-lg font-bold"
                            />
                        </div>
                    </div>

                    {entity.or_number && (
                        <InfoRow
                            icon={Hash}
                            label="OR Number"
                            value={<span className="font-mono tabular-nums">{entity.or_number}</span>}
                        />
                    )}

                    {/* Difference banner — same copy, icons, and theme tokens
                       as the form (was previously hardcoded rose-50/200/700,
                       which ignored the app's --destructive theme token and
                       also silently hid the exact-match case). */}
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
                                ? "Cheque exceeded billing by"
                                : difference < 0
                                    ? "Cheque was short by"
                                    : "Amounts matched exactly"}
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
                </div>
            </Section>

            {/* Step 3 — Status & Collection (mirrors the form's step 3) */}
            <Section
                step={3}
                icon={ClipboardCheck}
                title="Status & Collection"
                description="Where this cheque is in the process."
            >
                <div className="grid grid-cols-1 gap-3">
                    {entity.deposit_bank && (
                        <InfoRow
                            icon={Landmark}
                            label="Deposit Bank"
                            value={<span className="font-medium">{entity.deposit_bank}</span>}
                        />
                    )}
                    <InfoRow
                        icon={CalendarDays}
                        label="Date Collected"
                        value={
                            <span className="font-mono tabular-nums">
                                {formatDate(new Date(entity.date_collected), "MMM dd, yyyy")}
                            </span>
                        }
                    />
                    {entity.collected_by_name && (
                        <InfoRow
                            icon={User}
                            label="Collected By"
                            value={<span className="font-medium">{entity.collected_by_name}</span>}
                        />
                    )}
                    {entity.sales_transaction && (
                        <InfoRow
                            icon={Receipt}
                            label="Sales Transaction"
                            value={
                                <span className="font-mono tabular-nums">#{entity.sales_transaction}</span>
                            }
                        />
                    )}
                </div>
            </Section>

            {/* Step 4 — Notes (mirrors the form's step 4) */}
            {entity.notes && (
                <Section
                    step={4}
                    icon={FileText}
                    title="Notes"
                >
                    <p className="text-sm text-muted-foreground leading-relaxed">
                        {entity.notes}
                    </p>
                </Section>
            )}

            {/* Footer */}
            <div className="flex justify-end border-t pt-4">
                <Button
                    variant="outline"
                    onClick={onCloseAction}
                >
                    Close
                </Button>
            </div>
        </div>
    )
}
