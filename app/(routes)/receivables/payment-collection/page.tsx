"use client"

import PageHeader from "@/components/custom/shared/PageHeader"
import { Wrapper } from "@/components/custom/shared/Wrapper"
import {
  ListCardSkeleton,
  StatCardSkeleton,
} from "@/components/custom/shared/skeletons"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
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

// ── Shared helpers ──────────────────────────────────────────────────────

function peso(value: string | number | undefined | null): string {
  const n = Number(value ?? 0)
  return `₱${n.toLocaleString("en-PH", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
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

function SummaryCard({
  title,
  value,
  count,
  icon: Icon,
  color,
}: {
  title: string
  value: string
  count: number
  icon: React.ElementType
  color: string
}) {
  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          <div
            className={`flex items-center justify-center size-10 rounded-lg ${color}`}
          >
            <Icon className="size-5" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm text-muted-foreground">{title}</p>
            <p className="text-xl font-bold tracking-tight">{value}</p>
            <p className="text-xs text-muted-foreground mt-0.5">
              {count} outstanding
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

// ── List Section ─────────────────────────────────────────────────────────

function CollectionSection({
  title,
  icon: Icon,
  href,
  children,
  count,
}: {
  title: string
  icon: React.ElementType
  href: string
  children: React.ReactNode
  count: number
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
        {children}
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
            <p className="text-3xl font-bold tracking-tight text-primary">
              {peso(grandTotal)}
            </p>
          </div>
          <div className="flex items-center justify-center size-12 rounded-xl bg-primary/10">
            <CircleDollarSign className="size-6 text-primary" />
          </div>
        </CardContent>
      </Card>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <SummaryCard
          title="Services"
          value={peso(serviceDue)}
          count={services.length}
          icon={Wrench}
          color="bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400"
        />
        <SummaryCard
          title="Sales"
          value={peso(salesDue)}
          count={sales.length}
          icon={Receipt}
          color="bg-green-100 text-success dark:bg-green-900/30 "
        />
        <SummaryCard
          title="Remittances"
          value={peso(remittanceDue)}
          count={remittances.length}
          icon={Banknote}
          color="bg-amber-100 text-warning dark:bg-amber-900/30 "
        />
        <SummaryCard
          title="Cheques"
          value={peso(chequeDue)}
          count={cheques.length}
          icon={FileText}
          color="bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400"
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
        >
          {services.length === 0 ? (
            <p className="text-sm text-muted-foreground py-3 text-center">
              No outstanding service payments
            </p>
          ) : (
            services.slice(0, 5).map((s) => (
              <div
                key={s.id}
                className="flex items-center justify-between p-2.5 rounded-lg border hover:bg-muted/50 transition-colors"
              >
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium truncate">
                    Service #{String(s.id).padStart(4, "0")}
                  </p>
                  <p className="text-xs text-muted-foreground truncate">
                    {s.client?.full_name ?? "—"}
                  </p>
                </div>
                <div className="flex items-center gap-2 shrink-0 ml-3">
                  {statusBadge(s.payment_status ?? "unpaid")}
                  <span className="text-sm font-semibold whitespace-nowrap">
                    {peso(s.balance_due)}
                  </span>
                </div>
              </div>
            ))
          )}
        </CollectionSection>

        {/* Sales */}
        <CollectionSection
          title="Unpaid Sales"
          icon={Receipt}
          href="/sales?payment_status=unpaid,partial&no_date_range=1"
          count={sales.length}
        >
          {sales.length === 0 ? (
            <p className="text-sm text-muted-foreground py-3 text-center">
              No outstanding sales payments
            </p>
          ) : (
            sales.slice(0, 5).map((s) => (
              <div
                key={s.id}
                className="flex items-center justify-between p-2.5 rounded-lg border hover:bg-muted/50 transition-colors"
              >
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium truncate">
                    Transaction #{String(s.id).padStart(4, "0")}
                  </p>
                  <p className="text-xs text-muted-foreground truncate">
                    {s.client?.full_name ?? "—"}
                  </p>
                </div>
                <div className="flex items-center gap-2 shrink-0 ml-3">
                  {statusBadge(s.payment_status ?? "unpaid")}
                  <span className="text-sm font-semibold whitespace-nowrap">
                    {peso(
                      Number(s.computed_total ?? 0) - Number(s.total_paid ?? 0),
                    )}
                  </span>
                </div>
              </div>
            ))
          )}
        </CollectionSection>

        {/* Remittances */}
        <CollectionSection
          title="Pending Remittances"
          icon={Banknote}
          href="/receivables/remittances?is_remitted=false&no_date_range=1"
          count={remittances.length}
        >
          {remittances.length === 0 ? (
            <p className="text-sm text-muted-foreground py-3 text-center">
              No pending remittances
            </p>
          ) : (
            remittances.slice(0, 5).map((r) => (
              <div
                key={r.id}
                className="flex items-center justify-between p-2.5 rounded-lg border hover:bg-muted/50 transition-colors"
              >
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium truncate">
                    {r.stall_data?.name ?? "Stall"} —{" "}
                    {r.remittance_date
                      ? new Date(
                          r.remittance_date + "T00:00:00",
                        ).toLocaleDateString("en-PH", {
                          month: "short",
                          day: "numeric",
                        })
                      : "—"}
                  </p>
                  <p className="text-xs text-muted-foreground truncate">
                    {r.remitted_by?.full_name ?? "Unassigned"}
                  </p>
                </div>
                <div className="flex items-center gap-2 shrink-0 ml-3">
                  <Badge
                    variant="outline"
                    className="text-xs"
                  >
                    Pending
                  </Badge>
                  <span className="text-sm font-semibold whitespace-nowrap">
                    {peso(r.balance)}
                  </span>
                </div>
              </div>
            ))
          )}
        </CollectionSection>

        {/* Cheques */}
        <CollectionSection
          title="Pending Cheques"
          icon={FileText}
          href="/receivables/cheques?status=pending&no_date_range=1"
          count={cheques.length}
        >
          {cheques.length === 0 ? (
            <p className="text-sm text-muted-foreground py-3 text-center">
              No pending cheques
            </p>
          ) : (
            cheques.slice(0, 5).map((c) => (
              <div
                key={c.id}
                className="flex items-center justify-between p-2.5 rounded-lg border hover:bg-muted/50 transition-colors"
              >
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium truncate">
                    Cheque #{c.cheque_number}
                  </p>
                  <p className="text-xs text-muted-foreground truncate">
                    {c.client_name ?? "—"} · {c.bank_name}
                  </p>
                </div>
                <div className="flex items-center gap-2 shrink-0 ml-3">
                  <Badge
                    variant="outline"
                    className="text-xs"
                  >
                    Pending
                  </Badge>
                  <span className="text-sm font-semibold whitespace-nowrap">
                    {peso(c.cheque_amount)}
                  </span>
                </div>
              </div>
            ))
          )}
        </CollectionSection>
      </div>

      {/* Alert for large outstanding */}
      {grandTotal > 50000 && (
        <Card className="mt-6 border-amber-200 bg-amber-50/50 dark:bg-amber-900/10">
          <CardContent className="p-4 flex items-start gap-3">
            <AlertTriangle className="size-5 text-amber-600 mt-0.5 shrink-0" />
            <div>
              <p className="text-sm font-medium text-amber-900 dark:text-amber-100">
                High Outstanding Balance
              </p>
              <p className="text-xs text-amber-700 dark:text-amber-300 mt-0.5">
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
