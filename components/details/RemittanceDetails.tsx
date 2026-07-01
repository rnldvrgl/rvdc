"use client"

import { AnimatedNumber } from "@/components/custom/shared/AnimatedNumber"
import { Badge, BadgeVariant } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { RemittanceRecord } from "@/lib/constants/interface"
import { useCurrentUser } from "@/lib/hooks/useCurrentUser"
import { cn, formatCurrency } from "@/lib/utils/helpers"
import { formatDate } from "@/lib/utils/helpers/date"
import type { ReactNode } from "react"
import {
    AlertTriangle,
    ArrowRightLeft,
    Banknote,
    CheckCircle2,
    CreditCard,
    Landmark,
    Receipt,
    RefreshCw,
    ShieldCheck,
    StickyNote,
    TrendingDown,
    TrendingUp,
    Wallet,
} from "lucide-react"

const DENOMINATIONS = [
    { key: "count_1000", declaredKey: "declared_count_1000", label: "₱1,000", value: 1000, type: "bill" },
    { key: "count_500", declaredKey: "declared_count_500", label: "₱500", value: 500, type: "bill" },
    { key: "count_200", declaredKey: "declared_count_200", label: "₱200", value: 200, type: "bill" },
    { key: "count_100", declaredKey: "declared_count_100", label: "₱100", value: 100, type: "bill" },
    { key: "count_50", declaredKey: "declared_count_50", label: "₱50", value: 50, type: "bill" },
    { key: "count_20", declaredKey: "declared_count_20", label: "₱20", value: 20, type: "bill" },
    { key: "count_10", declaredKey: "declared_count_10", label: "₱10", value: 10, type: "coin" },
    { key: "count_5", declaredKey: "declared_count_5", label: "₱5", value: 5, type: "coin" },
    { key: "count_1", declaredKey: "declared_count_1", label: "₱1", value: 1, type: "coin" },
] as const

export function RemittanceDetails({
    entity,
    onMarkAsRemitted,
    onRecalculate,
    recalculatePending,
    markAsRemittedPending,
}: {
    entity: RemittanceRecord
    onClose: () => void
    onMarkAsRemitted: () => void
    markAsRemittedPending: boolean
    onRecalculate?: () => void
    recalculatePending?: boolean
}) {
    const { role } = useCurrentUser()

    const remitStatus = (): { variant: BadgeVariant; value: string; icon: ReactNode } => {
        const balance = Number(entity.balance || 0)

        if (balance > 0) {
            return {
                variant: "warning",
                value: `Over by ${formatCurrency(balance)}`,
                icon: <TrendingUp className="size-3.5" />,
            }
        }

        if (balance < 0) {
            return {
                variant: "destructive",
                value: `Short by ${formatCurrency(-balance)}`,
                icon: <TrendingDown className="size-3.5" />,
            }
        }

        return {
            variant: "success",
            value: "Balanced",
            icon: <CheckCircle2 className="size-3.5" />,
        }
    }

    const status = remitStatus()

    const denomTotals = entity.cash_breakdown
        ? {
            declared: DENOMINATIONS.reduce(
                (sum, { declaredKey, value }) =>
                    sum + (entity.cash_breakdown?.[declaredKey] ?? 0) * value,
                0,
            ),
            remitted: DENOMINATIONS.reduce(
                (sum, { key, value }) => sum + (entity.cash_breakdown?.[key] ?? 0) * value,
                0,
            ),
        }
        : null

    return (
        <div className="space-y-5 sm:space-y-6">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex flex-wrap items-center gap-2">
                    <Badge variant={entity.is_remitted ? "success" : "secondary"}>
                        {entity.is_remitted ? (
                            <ShieldCheck className="size-3" />
                        ) : (
                            <AlertTriangle className="size-3" />
                        )}
                        {entity.is_remitted ? "Acknowledged" : "Pending"}
                    </Badge>
                    <Badge variant={status.variant} className="gap-1">
                        {status.icon}
                        {status.value}
                    </Badge>
                </div>
                <span className="text-sm text-muted-foreground">
                    {formatDate(new Date(entity.created_at), "EEE, MMM dd yyyy")}
                </span>
            </div>

            <div className="grid grid-cols-2 gap-2.5 sm:gap-3">
                <SummaryCard
                    label="In Drawer (Declared)"
                    value={<AnimatedNumber value={Number(entity.declared_amount || 0)} prefix="₱" />}
                    icon={<Wallet className="size-4" />}
                    highlight
                />
                <SummaryCard
                    label="Remitted"
                    value={<AnimatedNumber value={Number(entity.remitted_amount || 0)} prefix="₱" />}
                    icon={<Banknote className="size-4" />}
                    highlight
                />
                <SummaryCard
                    label="Expected"
                    value={<AnimatedNumber value={Number(entity.expected_remittance || 0)} prefix="₱" />}
                    icon={<Receipt className="size-4" />}
                />
                <SummaryCard
                    label="COD → Next Day"
                    value={<AnimatedNumber value={Number(entity.cod_for_next_day || 0)} prefix="₱" />}
                    icon={<ArrowRightLeft className="size-4" />}
                    className={Number(entity.cod_for_next_day || 0) > 0 ? "text-warning" : ""}
                />
            </div>

            <Card>
                <CardHeader className="pb-3">
                    <CardTitle className="flex items-center gap-2 text-sm font-medium">
                        <Landmark className="size-4 text-muted-foreground" />
                        General Information
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="grid grid-cols-2 gap-3 sm:gap-4 text-sm">
                        <InfoRow label="Stall" value={entity.stall_data?.name || "—"} />
                        <InfoRow
                            label="Date"
                            value={formatDate(new Date(entity.created_at), "EEE, MMM dd yyyy")}
                        />
                        <InfoRow
                            label="COD (Today)"
                            value={
                                <AnimatedNumber
                                    value={Number(
                                        entity.cash_breakdown?.cod_amount ||
                                        entity.cod_for_today?.cod_amount ||
                                        0,
                                    )}
                                    prefix="₱"
                                />
                            }
                        />
                        <InfoRow
                            label="Remitted By"
                            value={entity.remitted_by?.full_name || "—"}
                        />
                        {entity.notes && (
                            <div className="col-span-2">
                                <InfoRow
                                    label="Notes"
                                    value={entity.notes}
                                    icon={<StickyNote className="size-3.5" />}
                                />
                            </div>
                        )}
                    </div>
                </CardContent>
            </Card>

            <Card>
                <CardHeader className="pb-3">
                    <CardTitle className="flex items-center gap-2 text-sm font-medium">
                        <CreditCard className="size-4 text-muted-foreground" />
                        Sales by Payment Method
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="space-y-2">
                        <PaymentRow label="Cash" value={entity.total_sales_cash} icon="💵" />
                        <PaymentRow label="GCash" value={entity.total_sales_gcash} icon="📱" />
                        <PaymentRow label="Credit" value={entity.total_sales_credit} icon="💳" />
                        <PaymentRow label="Debit" value={entity.total_sales_debit} icon="💳" />
                        <PaymentRow label="Cheque" value={entity.total_sales_cheque} icon="📝" />
                        <Separator />
                        <div className="flex items-center justify-between text-sm font-semibold gap-3">
                            <span>Total Collected</span>
                            <span className="tabular-nums">
                                {formatCurrency(entity.total_collected)}
                            </span>
                        </div>
                        <PaymentRow
                            label="Expenses"
                            value={entity.total_expenses}
                            icon="📤"
                            destructive
                        />
                    </div>
                </CardContent>
            </Card>

            {entity.cash_breakdown && (
                <Card>
                    <CardHeader className="pb-3">
                        <CardTitle className="flex items-center gap-2 text-sm font-medium">
                            <Banknote className="size-4 text-muted-foreground" />
                            Cash Denomination Breakdown
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="px-2 sm:px-6">
                        <div className="space-y-1.5">
                            <div className="hidden sm:grid grid-cols-4 gap-2 text-[10px] uppercase tracking-wider text-muted-foreground font-medium px-3 pb-1">
                                <span>Denomination</span>
                                <span className="text-right">Declared</span>
                                <span className="text-right">Remitted</span>
                                <span className="text-right">COD</span>
                            </div>

                            {DENOMINATIONS.map(({ key, declaredKey, label, value, type }) => {
                                const declared = entity.cash_breakdown?.[declaredKey] ?? 0
                                const remitted = entity.cash_breakdown?.[key] ?? 0
                                const cod = declared - remitted

                                if (declared === 0 && remitted === 0) return null

                                return (
                                    <div
                                        key={key}
                                        className={cn(
                                            "rounded-md px-3 py-2 text-sm",
                                            "grid grid-cols-2 gap-x-2 gap-y-1.5 sm:grid-cols-4 sm:items-center sm:gap-y-0",
                                            cod > 0 ? "bg-warning/10" : "bg-muted/30",
                                        )}
                                    >
                                        <div className="col-span-2 sm:col-span-1 flex items-center gap-2">
                                            <Badge
                                                variant="outline"
                                                className={cn(
                                                    "text-[10px] px-1.5 py-0",
                                                    type === "bill"
                                                        ? "border-success/30 text-success"
                                                        : "border-warning/30 text-warning",
                                                )}
                                            >
                                                {label}
                                            </Badge>
                                        </div>
                                        <div className="text-left sm:text-right tabular-nums">
                                            <span className="text-[10px] uppercase tracking-wider text-muted-foreground sm:hidden block">
                                                Declared
                                            </span>
                                            <span className="text-muted-foreground">{declared}×</span>{" "}
                                            <span className="font-medium">
                                                {formatCurrency(declared * value)}
                                            </span>
                                        </div>
                                        <div className="text-left sm:text-right tabular-nums">
                                            <span className="text-[10px] uppercase tracking-wider text-muted-foreground sm:hidden block">
                                                Remitted
                                            </span>
                                            <span className="text-muted-foreground">{remitted}×</span>{" "}
                                            <span className="font-medium">
                                                {formatCurrency(remitted * value)}
                                            </span>
                                        </div>
                                        <div className="text-left sm:text-right tabular-nums">
                                            <span className="text-[10px] uppercase tracking-wider text-muted-foreground sm:hidden block">
                                                COD
                                            </span>
                                            {cod > 0 ? (
                                                <span className="font-medium text-warning">
                                                    {cod}× = {formatCurrency(cod * value)}
                                                </span>
                                            ) : (
                                                <span className="text-muted-foreground">—</span>
                                            )}
                                        </div>
                                    </div>
                                )
                            })}

                            {denomTotals && (
                                <>
                                    <Separator className="my-2" />
                                    <div className="grid grid-cols-2 gap-x-2 gap-y-1.5 sm:grid-cols-4 sm:items-center sm:gap-y-0 rounded-md px-3 py-2 text-sm font-semibold bg-muted/50">
                                        <span className="col-span-2 sm:col-span-1">Totals</span>
                                        <span className="text-left sm:text-right tabular-nums">
                                            <span className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium sm:hidden block">
                                                Declared
                                            </span>
                                            {formatCurrency(denomTotals.declared)}
                                        </span>
                                        <span className="text-left sm:text-right tabular-nums">
                                            <span className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium sm:hidden block">
                                                Remitted
                                            </span>
                                            {formatCurrency(denomTotals.remitted)}
                                        </span>
                                        <span
                                            className={cn(
                                                "text-left sm:text-right tabular-nums",
                                                denomTotals.declared - denomTotals.remitted > 0 &&
                                                "text-warning",
                                            )}
                                        >
                                            <span className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium sm:hidden block">
                                                COD
                                            </span>
                                            {formatCurrency(denomTotals.declared - denomTotals.remitted)}
                                        </span>
                                    </div>
                                </>
                            )}
                        </div>
                    </CardContent>
                </Card>
            )}

            <div className="grid lg:grid-cols-2 gap-2 sm:flex-row sm:justify-end sm:gap-3 border-t pt-4">
                {!entity.is_remitted && onRecalculate && (
                    <Button
                        variant="outline"
                        onClick={onRecalculate}
                        disabled={recalculatePending}
                        className="gap-1.5 w-full"
                    >
                        <RefreshCw
                            className={cn("size-4", recalculatePending && "animate-spin")}
                        />
                        {recalculatePending ? "Recalculating..." : "Recalculate"}
                    </Button>
                )}
                {!entity.is_remitted && role === "admin" && (
                    <Button
                        variant="success"
                        onClick={onMarkAsRemitted}
                        disabled={markAsRemittedPending}
                        className="gap-1.5 w-full"
                    >
                        <ShieldCheck className="size-4" />
                        {markAsRemittedPending
                            ? "Acknowledging..."
                            : "Acknowledge Remittance"}
                    </Button>
                )}
            </div>
        </div>
    )
}

function SummaryCard({
    label,
    value,
    icon,
    highlight,
    className,
}: {
    label: string
    value: ReactNode
    icon: ReactNode
    highlight?: boolean
    className?: string
}) {
    return (
        <div
            className={cn(
                "rounded-lg border p-2.5 sm:p-3 space-y-1 min-w-0",
                highlight && "border-primary/30 bg-primary/5",
            )}
        >
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                {icon}
                <span className="truncate">{label}</span>
            </div>
            <p
                className={cn(
                    "text-base sm:text-xl font-bold tabular-nums wrap-break-word",
                    className,
                )}
            >
                {value}
            </p>
        </div>
    )
}

function InfoRow({
    label,
    value,
    icon,
}: {
    label: string
    value: ReactNode
    icon?: ReactNode
}) {
    return (
        <div className="space-y-0.5 min-w-0">
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
                {icon}
                {label}
            </div>
            <p className="font-medium wrap-break-word">{value || "—"}</p>
        </div>
    )
}

function PaymentRow({
    label,
    value,
    icon,
    destructive,
}: {
    label: string
    value: string | number
    icon: string
    destructive?: boolean
}) {
    const amount = Number(value || 0)

    return (
        <div className="flex items-center justify-between gap-3 text-sm py-1">
            <div className="flex items-center gap-2 min-w-0">
                <span className="text-base leading-none shrink-0">{icon}</span>
                <span className={cn("truncate", destructive && "text-destructive")}>
                    {label}
                </span>
            </div>
            <span
                className={cn(
                    "tabular-nums font-medium shrink-0",
                    destructive && amount > 0 && "text-destructive",
                )}
            >
                {destructive && amount > 0
                    ? `−${formatCurrency(amount)}`
                    : formatCurrency(amount)}
            </span>
        </div>
    )
}
