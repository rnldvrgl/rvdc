"use client"

import PageHeader from "@/components/custom/shared/PageHeader"
import { Wrapper } from "@/components/custom/shared/Wrapper"
import {
    ListCardSkeleton,
    StatCardSkeleton,
} from "@/components/custom/shared/skeletons"
import { AnimatedNumber } from "@/components/custom/shared/AnimatedNumber"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { cn } from "@/lib/utils/helpers"
import {
    ChequeCollection,
    RemittanceRecord,
    SalesTransaction,
    Service,
} from "@/lib/constants/interface"
import { useSalesTransactions } from "@/lib/queries/sales/useSalesTransactions"
import { useServices } from "@/lib/queries/services/useServices"
import { useChequeCollections } from "@/lib/queries/useChequeCollections"
import { useRemittancesRecords } from "@/lib/queries/useRemittancesRecords"
import { getBadgeVariant } from "@/lib/utils/helpers"
import {
    AlertTriangle,
    Banknote,
    CircleDollarSign,
    CreditCard,
    ExternalLink,
    FileText,
    Receipt,
    Wrench,
} from "lucide-react"
import Link from "next/link"
import React from "react"
import { Format } from "@number-flow/react"

// ── Shared helpers ──────────────────────────────────────────────────────

const PESO_FORMAT: Format = {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
}

function statusBadge(status: string) {
    return (
        <Badge
            variant={getBadgeVariant(status)}
            className="capitalize text-xs"
        >
            {status}
        </Badge>
    )
}

// ── Summary Card ─────────────────────────────────────────────────────────
// `tone` maps to the same semantic theme tokens used across the app
// (--info, --success, --warning, --primary via bg-{token}/10 text-{token}),
// instead of raw Tailwind palette colors that don't track the theme or
// dark mode the way the rest of the app does.

const TONE_STYLES = {
    info: "bg-info/10 text-info",
    success: "bg-success/10 text-success",
    warning: "bg-warning/10 text-warning",
    primary: "bg-primary/10 text-primary",
} as const

function SummaryCard({
    title,
    value,
    count,
    icon: Icon,
    tone,
}: {
    title: string
    value: number
    count: number
    icon: React.ElementType
    tone: keyof typeof TONE_STYLES
}) {
    return (
        <Card>
            <CardContent className="p-4">
                <div className="flex items-start gap-3">
                    <div
                        className={cn(
                            "flex items-center justify-center size-10 rounded-lg shrink-0",
                            TONE_STYLES[tone],
                        )}
                    >
                        <Icon className="size-5" />
                    </div>
                    <div className="flex-1 min-w-0">
                        <p className="text-sm text-muted-foreground">{title}</p>
                        <AnimatedNumber
                            value={value}
                            prefix="₱"
                            format={PESO_FORMAT}
                            className="text-xl font-bold tracking-tight"
                        />
                        <p className="text-xs text-muted-foreground mt-0.5">
                            {count} outstanding
                        </p>
                    </div>
                </div>
            </CardContent>
        </Card>
    )
}

// ── List row ─────────────────────────────────────────────────────────────
// Shared row shape for all four sections, so services/sales/remittances/
// cheques render identically instead of each section hand-rolling its own
// badge and amount markup (which is how Remittances/Cheques ended up with
// a hardcoded static "Pending" badge instead of the same statusBadge()
// helper Services/Sales already used).

function CollectionRow({
    title,
    subtitle,
    status,
    amount,
}: {
    title: string
    subtitle: string
    status: string
    amount: number
}) {
    return (
        <div className="flex items-center justify-between p-2.5 rounded-lg border hover:bg-muted/50 transition-colors">
            <div className="min-w-0 flex-1">
                <p className="text-sm font-medium truncate">{title}</p>
                <p className="text-xs text-muted-foreground truncate">{subtitle}</p>
            </div>
            <div className="flex items-center gap-2 shrink-0 ml-3">
                {statusBadge(status)}
                <AnimatedNumber
                    value={amount}
                    prefix="₱"
                    format={PESO_FORMAT}
                    className="text-sm font-semibold whitespace-nowrap"
                />
            </div>
        </div>
    )
}

// ── List Section ─────────────────────────────────────────────────────────

function CollectionSection({
    title,
    icon: Icon,
    href,
    children,
    count,
    emptyMessage,
}: {
    title: string
    icon: React.ElementType
    href: string
    children: React.ReactNode
    count: number
    emptyMessage: string
}) {
    return (
        <Card>
            <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                    <Icon className="size-5" />
                    {title}
                    {count > 0 && (
                        <Badge
                            variant="secondary"
                            className="ml-auto"
                        >
                            {count}
                        </Badge>
                    )}
                </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
                {count === 0 ? (
                    <p className="text-sm text-muted-foreground py-3 text-center">
                        {emptyMessage}
                    </p>
                ) : (
                    children
                )}
                <Link href={href}>
                    <Button
                        variant="ghost"
                        size="sm"
                        className="w-full mt-2"
                    >
                        View all
                        <ExternalLink className="size-3.5 ml-1.5" />
                    </Button>
                </Link>
            </CardContent>
        </Card>
    )
}

// ── Page ──────────────────────────────────────────────────────────────────

export default function PaymentCollectionPage() {
    // Fetch outstanding data
    const { data: servicesData, isLoading: loadingServices } = useServices({
        filter: { payment_status: "unpaid,partial" },
        limit: 200,
    })
    const { data: salesData, isLoading: loadingSales } = useSalesTransactions({
        filter: { payment_status: "unpaid,partial", transaction_type: "sale,replacement,pull_out,asset_sale" },
        limit: 200,
    })
    const { data: remittancesData, isLoading: loadingRemittances } =
        useRemittancesRecords({
            filter: { is_remitted: "false" },
            limit: 50,
        })
    const { data: chequesData, isLoading: loadingCheques } = useChequeCollections(
        {
            filter: { status: "pending" },
            limit: 50,
        },
    )

    const isLoading =
        loadingServices || loadingSales || loadingRemittances || loadingCheques

    const services: Service[] = React.useMemo(
        () =>
            (servicesData?.results ?? []).filter(
                (s) => s.payment_status === "unpaid" || s.payment_status === "partial",
            ),
        [servicesData],
    )

    const sales: SalesTransaction[] = React.useMemo(
        () =>
            (salesData?.results ?? []).filter(
                (s) =>
                    !s.voided &&
                    s.transaction_type !== "service" &&
                    (s.payment_status === "unpaid" || s.payment_status === "partial"),
            ),
        [salesData],
    )

    const remittances: RemittanceRecord[] = React.useMemo(
        () => (remittancesData?.results ?? []).filter((r) => !r.is_remitted),
        [remittancesData],
    )

    const cheques: ChequeCollection[] = React.useMemo(
        () => (chequesData?.results ?? []).filter((c) => c.status === "pending"),
        [chequesData],
    )

    // Totals
    const serviceDue = services.reduce(
        (sum, s) => sum + Number(s.balance_due ?? 0),
        0,
    )
    const salesDue = sales.reduce(
        (sum, s) =>
            sum + (Number(s.computed_total ?? 0) - Number(s.total_paid ?? 0)),
        0,
    )
    const remittanceDue = remittances.reduce(
        (sum, r) => sum + Number(r.balance ?? 0),
        0,
    )
    const chequeDue = cheques.reduce(
        (sum, c) => sum + Number(c.cheque_amount ?? 0),
        0,
    )
    const grandTotal = serviceDue + salesDue + remittanceDue + chequeDue

    if (isLoading) {
        return (
            <Wrapper>
                <PageHeader
                    icon={CreditCard}
                    title="Payment Collection"
                    description="Track all outstanding payments across services, sales, remittances, and cheques."
                    breadcrumbs={["Dashboard", "Receivables", "Collection"]}
                />
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                    {Array.from({ length: 4 }).map((_, i) => (
                        <StatCardSkeleton key={i} />
                    ))}
                </div>
                <div className="grid lg:grid-cols-2 gap-6 mt-6">
                    <ListCardSkeleton rows={4} />
                    <ListCardSkeleton rows={4} />
                </div>
            </Wrapper>
        )
    }

    return (
        <Wrapper>
            <PageHeader
                icon={CreditCard}
                title="Payment Collection"
                description="Track all outstanding payments across services, sales, remittances, and cheques."
                breadcrumbs={["Dashboard", "Receivables", "Collection"]}
            />

            {/* Grand Total */}
            <Card className="border-primary/20 bg-primary/5 mb-6">
                <CardContent className="p-5 flex items-center justify-between">
                    <div>
                        <p className="text-sm text-muted-foreground">Total Outstanding</p>
                        <AnimatedNumber
                            value={grandTotal}
                            prefix="₱"
                            format={PESO_FORMAT}
                            className="text-3xl font-bold tracking-tight text-primary"
                        />
                    </div>
                    <div className="flex items-center justify-center size-12 rounded-xl bg-primary/10 shrink-0">
                        <CircleDollarSign className="size-6 text-primary" />
                    </div>
                </CardContent>
            </Card>

            {/* Summary Cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                <SummaryCard
                    title="Services"
                    value={serviceDue}
                    count={services.length}
                    icon={Wrench}
                    tone="info"
                />
                <SummaryCard
                    title="Sales"
                    value={salesDue}
                    count={sales.length}
                    icon={Receipt}
                    tone="success"
                />
                <SummaryCard
                    title="Remittances"
                    value={remittanceDue}
                    count={remittances.length}
                    icon={Banknote}
                    tone="warning"
                />
                <SummaryCard
                    title="Cheques"
                    value={chequeDue}
                    count={cheques.length}
                    icon={FileText}
                    tone="primary"
                />
            </div>

            <Separator className="mb-6" />

            {/* Detail Lists */}
            <div className="grid lg:grid-cols-2 gap-6">
                {/* Services */}
                <CollectionSection
                    title="Unpaid Services"
                    icon={Wrench}
                    href="/services?payment_status=unpaid,partial&no_date_range=1"
                    count={services.length}
                    emptyMessage="No outstanding service payments"
                >
                    {services.slice(0, 5).map((s) => (
                        <CollectionRow
                            key={s.id}
                            title={`Service #${String(s.id).padStart(4, "0")}`}
                            subtitle={s.client?.full_name ?? "—"}
                            status={s.payment_status ?? "unpaid"}
                            amount={Number(s.balance_due ?? 0)}
                        />
                    ))}
                </CollectionSection>

                {/* Sales */}
                <CollectionSection
                    title="Unpaid Sales"
                    icon={Receipt}
                    href="/sales?payment_status=unpaid,partial&no_date_range=1"
                    count={sales.length}
                    emptyMessage="No outstanding sales payments"
                >
                    {sales.slice(0, 5).map((s) => (
                        <CollectionRow
                            key={s.id}
                            title={`Transaction #${String(s.id).padStart(4, "0")}`}
                            subtitle={s.client?.full_name ?? "—"}
                            status={s.payment_status ?? "unpaid"}
                            amount={Number(s.computed_total ?? 0) - Number(s.total_paid ?? 0)}
                        />
                    ))}
                </CollectionSection>

                {/* Remittances */}
                <CollectionSection
                    title="Pending Remittances"
                    icon={Banknote}
                    href="/receivables/remittances?is_remitted=false&no_date_range=1"
                    count={remittances.length}
                    emptyMessage="No pending remittances"
                >
                    {remittances.slice(0, 5).map((r) => (
                        <CollectionRow
                            key={r.id}
                            title={`${r.stall_data?.name ?? "Stall"} — ${r.remittance_date
                                    ? new Date(r.remittance_date + "T00:00:00").toLocaleDateString(
                                        "en-PH",
                                        { month: "short", day: "numeric" },
                                    )
                                    : "—"
                                }`}
                            subtitle={r.remitted_by?.full_name ?? "Unassigned"}
                            status="pending"
                            amount={Number(r.balance ?? 0)}
                        />
                    ))}
                </CollectionSection>

                {/* Cheques */}
                <CollectionSection
                    title="Pending Cheques"
                    icon={FileText}
                    href="/receivables/cheques?status=pending&no_date_range=1"
                    count={cheques.length}
                    emptyMessage="No pending cheques"
                >
                    {cheques.slice(0, 5).map((c) => (
                        <CollectionRow
                            key={c.id}
                            title={`Cheque #${c.cheque_number}`}
                            subtitle={`${c.client_name ?? "—"} · ${c.bank_name}`}
                            status="pending"
                            amount={Number(c.cheque_amount ?? 0)}
                        />
                    ))}
                </CollectionSection>
            </div>

            {/* Alert for large outstanding */}
            {grandTotal > 50000 && (
                <Card className="mt-6 border-warning/30 bg-warning/10">
                    <CardContent className="p-4 flex items-start gap-3">
                        <AlertTriangle className="size-5 text-warning mt-0.5 shrink-0" />
                        <div>
                            <p className="text-sm font-medium text-warning">
                                High Outstanding Balance
                            </p>
                            <p className="text-xs text-warning/80 mt-0.5">
                                Total outstanding payments exceed ₱50,000. Consider following up
                                on overdue accounts.
                            </p>
                        </div>
                    </CardContent>
                </Card>
            )}
        </Wrapper>
    )
}
