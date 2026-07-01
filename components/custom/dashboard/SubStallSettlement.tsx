"use client"

import { EmptyState } from "@/components/custom/EmptyState"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import { Skeleton } from "@/components/ui/skeleton"
import { AnimatedNumber } from "@/components/custom/shared/AnimatedNumber"
import { useSubStallPayable } from "@/lib/queries/useRemittancesRecords"
import { cn, formatCurrency } from "@/lib/utils/helpers"
import { formatDate } from "@/lib/utils/helpers/date"
import { AnimatePresence, motion } from "framer-motion"
import { Banknote, Keyboard, Store } from "lucide-react"
import { useEffect, useState } from "react"

type SubStallPayable = NonNullable<ReturnType<typeof useSubStallPayable>["data"]>
type SettlementVariant = "summary" | "full"

interface PaymentLineProps {
    label: string
    value: string | number
}

function PaymentRow({ label, value }: PaymentLineProps) {
    if (!(Number(value) > 0)) return null

    return (
        <div className="flex items-center justify-between gap-3 rounded-lg border border-border/60 bg-background/70 px-3 py-2 text-xs sm:text-sm">
            <span className="text-muted-foreground">{label}</span>
            <span className="tabular-nums font-medium text-foreground">
                {formatCurrency(value)}
            </span>
        </div>
    )
}

function SettlementDetails({ subStallPayable }: { subStallPayable: SubStallPayable }) {
    const ePaymentsTotal = Number(subStallPayable.e_payments_total)
    const hasServices = Boolean(subStallPayable.services?.length)

    return (
        <div className="space-y-3 px-4 pb-4 sm:space-y-4">
            <div className="overflow-hidden rounded-2xl border border-primary/15 bg-linear-to-br from-primary/10 via-background to-background shadow-sm">
                <div className="flex items-start justify-between gap-3 px-4 py-4 sm:px-5">
                    <div className="space-y-1">
                        <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-muted-foreground">
                            Cash to pay
                        </p>
                        <AnimatedNumber
                            value={subStallPayable.cash_payable}
                            className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl"
                            format={{
                                style: "currency",
                                currency: "PHP",
                                minimumFractionDigits: 2,
                                maximumFractionDigits: 2,
                            }}
                        />
                        <p className="text-xs text-muted-foreground">
                            Daily settlement summary for services and payment channels.
                        </p>
                    </div>
                    <div className="flex size-11 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                        <Banknote className="size-6" />
                    </div>
                </div>
            </div>

            <div className="grid gap-2 rounded-2xl border border-border/60 bg-muted/20 p-3 sm:p-4">
                <div className="flex items-center justify-between gap-3 rounded-lg bg-background/80 px-3 py-2 text-sm">
                    <span className="text-muted-foreground">Cash (Service Parts)</span>
                    <AnimatedNumber
                        value={subStallPayable.sales_cash}
                        className="text-sm font-semibold text-foreground"
                        format={{
                            style: "currency",
                            currency: "PHP",
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2,
                        }}
                    />
                </div>
            </div>

            {ePaymentsTotal > 0 && (
                <div className="space-y-2 rounded-2xl border border-border/60 bg-muted/20 p-3 sm:p-4">
                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                        E-Payments
                    </p>
                    <div className="grid gap-2">
                        <PaymentRow label="GCash" value={subStallPayable.sales_gcash} />
                        <PaymentRow label="Credit" value={subStallPayable.sales_credit} />
                        <PaymentRow label="Debit" value={subStallPayable.sales_debit} />
                        <PaymentRow label="Cheque" value={subStallPayable.sales_cheque} />
                    </div>
                </div>
            )}

            {hasServices && (
                <div className="space-y-2 rounded-2xl border border-border/60 bg-muted/20 p-3 sm:p-4">
                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                        Services ({subStallPayable.services.length})
                    </p>
                    <div className="max-h-40 space-y-2 overflow-y-auto pr-1">
                        {subStallPayable.services.map((svc) => (
                            <div
                                key={svc.service_id}
                                className="flex items-center justify-between gap-3 rounded-lg border border-border/60 bg-background/70 px-3 py-2 text-xs sm:text-sm"
                            >
                                <span className="min-w-0 truncate text-muted-foreground">
                                    #{svc.service_id}{svc.client_name ? ` — ${svc.client_name}` : ""}
                                </span>
                                <AnimatedNumber
                                    value={Number(svc.paid_today)}
                                    className="text-xs font-medium text-foreground sm:text-sm"
                                    format={{
                                        style: "currency",
                                        currency: "PHP",
                                        minimumFractionDigits: 2,
                                        maximumFractionDigits: 2,
                                    }}
                                />
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    )
}

function SettlementCardSkeleton({ compact }: { compact?: boolean }) {
    return (
        <Card className="h-full overflow-hidden border shadow-sm">
            <CardContent className={compact ? "p-4" : "p-0"}>
                <div className="mb-3 flex items-start justify-between gap-3">
                    <Skeleton className="size-10 rounded-xl" />
                    <Skeleton className="h-5 w-16 rounded-full" />
                </div>
                <Skeleton className="h-8 w-32 mt-1" />
                <Skeleton className="h-4 w-40 mt-2" />
            </CardContent>
        </Card>
    )
}

export function SubStallSettlement({
    className,
    enableShortcut,
    variant = "full",
}: {
    className?: string
    enableShortcut?: boolean
    variant?: SettlementVariant
}) {
    const { data: subStallPayable, isLoading } = useSubStallPayable()
    const [dialogOpen, setDialogOpen] = useState(false)

    const hasSettlement = Boolean(subStallPayable && Number(subStallPayable.total_sales) > 0)
    const today = subStallPayable?.date ?? new Date().toISOString().slice(0, 10)
    const stallName = subStallPayable?.sub_stall_name ?? "Sub Stall"

    useEffect(() => {
        if (!enableShortcut) return

        function handleKeyDown(event: KeyboardEvent) {
            if ((event.ctrlKey || event.metaKey) && event.shiftKey && event.key === "S") {
                event.preventDefault()
                setDialogOpen((previous) => !previous)
            }
        }

        window.addEventListener("keydown", handleKeyDown)
        return () => window.removeEventListener("keydown", handleKeyDown)
    }, [enableShortcut])

    if (isLoading) {
        return <SettlementCardSkeleton compact={variant === "summary"} />
    }

    const content = hasSettlement && subStallPayable ? (
        <SettlementDetails subStallPayable={subStallPayable} />
    ) : (
        <div className="px-4 pb-4 pt-1">
            <EmptyState
                icon={Banknote}
                title="No settlement today"
                description="No sub stall service payments were recorded for this stall."
                className="border-border/60 bg-muted/10 py-12"
            />
        </div>
    )

    if (variant === "summary") {
        return (
            <>
                <motion.div
                    className="h-full"
                    whileHover={{ y: -3, transition: { duration: 0.2, ease: "easeOut" } }}
                    whileTap={{ scale: 0.99 }}
                >
                    <Card
                        className={cn(
                            "group h-full overflow-hidden border-border/70 bg-card shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:shadow-md",
                            className,
                        )}
                        onClick={() => setDialogOpen(true)}
                    >
                        <CardContent className="space-y-4 p-4 sm:p-5">
                            <div className="flex items-start justify-between gap-3">
                                <div className="flex min-w-0 items-center gap-3">
                                    <div className="flex size-11 items-center justify-center rounded-2xl bg-primary/10 text-primary ring-1 ring-primary/10 transition-colors group-hover:bg-primary/15">
                                        <Store className="size-5" />
                                    </div>
                                    <div className="min-w-0">
                                        <p className="truncate text-sm font-semibold text-foreground sm:text-base">
                                            {stallName}
                                        </p>
                                        <p className="text-xs text-muted-foreground">Daily settlement</p>
                                    </div>
                                </div>
                                <Badge variant="outline" className="shrink-0 rounded-full px-2.5 py-1 text-[10px] font-medium">
                                    {formatDate(today, "MMM dd")}
                                </Badge>
                            </div>

                            <div className="space-y-1.5 rounded-2xl border border-border/60 bg-muted/20 px-4 py-4">
                                <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-muted-foreground">
                                    Cash to pay
                                </p>
                                {hasSettlement ? (
                                    <AnimatedNumber
                                        value={subStallPayable!.cash_payable}
                                        className="text-2xl font-bold tracking-tight text-foreground sm:text-[1.75rem]"
                                        format={{
                                            style: "currency",
                                            currency: "PHP",
                                            minimumFractionDigits: 2,
                                            maximumFractionDigits: 2,
                                        }}
                                    />
                                ) : (
                                    <p className="text-2xl font-bold tracking-tight text-foreground sm:text-[1.75rem]">
                                        No settlement
                                    </p>
                                )}
                                <p className="text-sm text-muted-foreground">
                                    Tap to review service, payment, and e-payment breakdowns.
                                </p>
                            </div>
                        </CardContent>
                    </Card>
                </motion.div>

                <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                    <DialogContent className="max-w-md overflow-hidden p-0">
                        <DialogHeader className="px-4 pt-4 pb-0 sm:px-5 sm:pt-5">
                            <DialogTitle className="flex items-center gap-2 text-sm">
                                <Store className="size-4 text-primary" />
                                {stallName} — Daily Settlement
                            </DialogTitle>
                            <p className="text-xs text-muted-foreground">{formatDate(today, "MMM dd, yyyy")}</p>
                        </DialogHeader>
                        <AnimatePresence mode="wait">
                            <motion.div
                                key={hasSettlement ? "data" : "empty"}
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                transition={{ duration: 0.15 }}
                            >
                                {content}
                            </motion.div>
                        </AnimatePresence>
                    </DialogContent>
                </Dialog>
            </>
        )
    }

    return (
        <>
            <Card className={cn("h-full overflow-hidden p-0", className)}>
                <div className="flex items-center justify-between gap-3 border-b border-border/60 px-4 py-4">
                    <div className="flex min-w-0 items-center gap-3">
                        <div className="flex size-9 items-center justify-center rounded-xl bg-primary/10 text-primary">
                            <Store className="size-4" />
                        </div>
                        <div className="min-w-0">
                            <p className="truncate text-sm font-semibold text-foreground">{stallName}</p>
                            <p className="text-xs text-muted-foreground">Daily Settlement (Services)</p>
                        </div>
                    </div>

                    <div className="flex shrink-0 items-center gap-1.5">
                        {enableShortcut && (
                            <Badge variant="secondary" className="cursor-default select-none gap-1.5 rounded-full px-3 py-1 text-[10px] font-medium">
                                <Keyboard className="size-2.5" />
                                Open details: Windows + Ctrl + Shift + S
                            </Badge>
                        )}
                        <Badge variant="outline" className="rounded-full px-3 py-1 text-xs font-normal">
                            {formatDate(today, "MMM dd, yyyy")}
                        </Badge>
                    </div>
                </div>

                {content}
            </Card>

            {enableShortcut && (
                <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                    <DialogContent className="max-w-md overflow-hidden p-0">
                        <DialogHeader className="px-4 pt-4 pb-0 sm:px-5 sm:pt-5">
                            <DialogTitle className="flex items-center gap-2 text-sm">
                                <Store className="size-4 text-primary" />
                                Sub Stall Settlement — {formatDate(today, "MMM dd, yyyy")}
                            </DialogTitle>
                        </DialogHeader>
                        <AnimatePresence mode="wait">
                            <motion.div
                                key={hasSettlement ? "data" : "empty"}
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                transition={{ duration: 0.15 }}
                            >
                                {content}
                            </motion.div>
                        </AnimatePresence>
                    </DialogContent>
                </Dialog>
            )}
        </>
    )
}

export function SubStallSettlementStatCard({ className }: { className?: string }) {
    return <SubStallSettlement className={className} variant="summary" />
}
