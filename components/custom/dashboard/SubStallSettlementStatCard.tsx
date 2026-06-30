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
import { Separator } from "@/components/ui/separator"
import { Skeleton } from "@/components/ui/skeleton"
import { useSubStallPayable } from "@/lib/queries/useRemittancesRecords"
import { cn, formatCurrency } from "@/lib/utils/helpers"
import { formatDate } from "@/lib/utils/helpers/date"
import { motion, AnimatePresence } from "framer-motion"
import { Banknote, Store } from "lucide-react"
import { useState } from "react"

interface PaymentLine {
    label: string
    value: string | number
}

function PaymentRow({ label, value }: PaymentLine) {
    if (!(Number(value) > 0)) return null
    return (
        <div className="flex items-center justify-between">
            <span className="text-muted-foreground">{label}</span>
            <span className="tabular-nums text-muted-foreground font-medium">
                {formatCurrency(value)}
            </span>
        </div>
    )
}

export function SubStallSettlementStatCard({
    className,
}: {
    className?: string
}) {
    const { data: subStallPayable, isLoading } = useSubStallPayable()
    const [dialogOpen, setDialogOpen] = useState(false)

    const hasSettlement = !!subStallPayable && Number(subStallPayable.total_sales) > 0

    const today = subStallPayable?.date ?? new Date().toISOString().slice(0, 10)
    const stallName = subStallPayable?.sub_stall_name ?? "Sub Stall"

    if (isLoading) {
        return (
            <Card className={cn("overflow-hidden border shadow-sm h-full", className)}>
                <CardContent >
                    <div className="flex items-start justify-between mb-3">
                        <Skeleton className="size-10 rounded-lg" />
                        <Skeleton className="h-5 w-16 rounded-full" />
                    </div>
                    <Skeleton className="h-7 w-28 mt-1" />
                    <Skeleton className="h-4 w-36 mt-2" />
                </CardContent>
            </Card>
        )
    }

    const renderDetail = () => {
        if (!hasSettlement || !subStallPayable) {
            return (
                <EmptyState
                    icon={Banknote}
                    title="No settlement today"
                    description="No sub stall service payments recorded"
                />
            )
        }

        const ep = subStallPayable
        const ePaymentsTotal = Number(ep.e_payments_total)
        const hasServices = ep.services && ep.services.length > 0

        return (
            <div className="px-4 pb-4 space-y-2.5">
                {/* Cash Payable hero */}
                <div className="relative mx-0 mb-4 rounded-lg overflow-hidden border border-primary/20 shadow-sm">
                    <div className="relative px-4 py-3.5 flex items-center justify-between">
                        <div className="space-y-0.5">
                            <p className="text-[11px] font-medium">Cash to Pay</p>
                            <p className="text-2xl font-bold tabular-nums tracking-tight">
                                {formatCurrency(ep.cash_payable)}
                            </p>
                        </div>
                        <div className="flex items-center justify-center size-10 rounded-full bg-primary/10">
                            <Banknote className="size-6 text-primary" />
                        </div>
                    </div>
                </div>

                {/* Cash from services */}
                <div className="space-y-1.5 text-sm">
                    <div className="flex items-center justify-between py-0.5">
                        <span className="text-muted-foreground">Cash (Service Parts)</span>
                        <span className="font-semibold tabular-nums">{formatCurrency(ep.sales_cash)}</span>
                    </div>
                </div>

                {/* E-payments */}
                {ePaymentsTotal > 0 && (
                    <>
                        <Separator />
                        <div className="space-y-1.5">
                            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                                E-Payments (received by admin)
                            </p>
                            <div className="grid gap-x-4 gap-y-1.5 text-xs">
                                <PaymentRow label="GCash" value={ep.sales_gcash} />
                                <PaymentRow label="Credit" value={ep.sales_credit} />
                                <PaymentRow label="Debit" value={ep.sales_debit} />
                                <PaymentRow label="Cheque" value={ep.sales_cheque} />
                            </div>
                        </div>
                    </>
                )}

                {/* Services breakdown */}
                {hasServices && (
                    <>
                        <Separator />
                        <div className="space-y-1.5">
                            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                                Services ({ep.services.length})
                            </p>
                            <div className="max-h-40 overflow-y-auto grid gap-y-1.5 text-xs pr-1">
                                {ep.services.map((svc) => (
                                    <div key={svc.service_id} className="flex items-center justify-between">
                                        <span className="text-muted-foreground">
                                            #{svc.service_id}
                                            {svc.client_name && ` — ${svc.client_name}`}
                                        </span>
                                        <span className="tabular-nums font-medium">{formatCurrency(svc.paid_today)}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </>
                )}
            </div>
        )
    }

    return (
        <>
            <motion.div
                className="h-full"
                whileHover={{ y: -4, transition: { duration: 0.2, ease: "easeOut" } }}
                whileTap={{ scale: 0.98 }}
            >
                <Card
                    className={cn(
                        "overflow-hidden border shadow-sm hover:shadow-md transition-shadow border-primary/50 duration-300 h-full cursor-pointer",
                        className,
                    )}
                    onClick={() => setDialogOpen(true)}
                >
                    <CardContent>
                        <div className="flex items-start justify-between mb-3">
                            <div className="p-2.5 rounded-lg bg-primary/10 dark:bg-primary/20">
                                <Store className="size-5 text-primary" />
                            </div>
                            <Badge variant="outline" className="text-[10px] font-normal px-2 py-0.5">
                                {formatDate(today, "MMM dd")}
                            </Badge>

                        </div>

                        <p className="text-xl sm:text-2xl font-bold text-foreground tracking-tight break-all sm:break-normal">
                            {hasSettlement ? formatCurrency(subStallPayable!.cash_payable) : "No settlement"}
                        </p>
                        <p className="text-sm font-medium text-muted-foreground mt-1">
                            {stallName} — Daily Settlement
                        </p>
                    </CardContent>
                </Card>
            </motion.div>

            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                <DialogContent className="max-w-sm p-4 overflow-hidden">
                    <DialogHeader>
                        <DialogTitle className="text-sm flex items-center gap-2">
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
                            {renderDetail()}
                        </motion.div>
                    </AnimatePresence>
                </DialogContent>
            </Dialog>
        </>
    )
}
