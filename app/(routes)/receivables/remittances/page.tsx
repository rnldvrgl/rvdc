"use client"

import EntitySheet from "@/components/custom/shared/EntitySheet"
import PageHeader from "@/components/custom/shared/PageHeader"
import { Wrapper } from "@/components/custom/shared/Wrapper"
import { DataTable } from "@/components/custom/table/DataTable"
import { RemittanceDetails } from "@/components/details/RemittanceDetails"
import RemittanceForm from "@/components/forms/RemittanceForm"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { RemittanceRecord } from "@/lib/constants/interface"
import { useCurrentUser } from "@/lib/hooks/useCurrentUser"
import { useEntitySheet } from "@/lib/hooks/useEntitySheet"
import useSearchParameters from "@/lib/hooks/useSearchParameters"
import { useRemittanceMutations } from "@/lib/mutations/useRemittanceMutations"
import {
  useRemittancesRecordFilters,
  useRemittancesRecords,
  useSubStallPayable,
} from "@/lib/queries/useRemittancesRecords"
import { cn, formatCurrency } from "@/lib/utils/helpers"
import { formatDate } from "@/lib/utils/helpers/date"
import {
  ArrowRightLeft,
  Banknote,
  CheckCircle2,
  Clock,
  DollarSign,
  Plus,
  Store,
  TrendingDown,
  TrendingUp,
  Wallet,
} from "lucide-react"
import { useMemo } from "react"
import { getRemittanceColumns } from "./columns"

export default function RemittancesPage() {
  const { role, isAdmin } = useCurrentUser()
  const { page, limit, search, ordering, filter } = useSearchParameters({
    defaultRangePreset: "Last 30 Days",
  })
  const { data, isLoading, refetch } = useRemittancesRecords({
    page,
    limit,
    search,
    ordering,
    filter,
  })
  const { filters, orderingOptions } = useRemittancesRecordFilters()
  const { deleteRemittance, markRemitted } = useRemittanceMutations()
  const { data: subStallPayable } = useSubStallPayable()

  // Compute summary stats from loaded results
  const stats = useMemo(() => {
    const results = data?.results ?? []
    const totalDeclared = results.reduce(
      (s, r) => s + Number(r.declared_amount || 0),
      0,
    )
    const totalRemitted = results.reduce(
      (s, r) => s + Number(r.remitted_amount || 0),
      0,
    )
    const totalCOD = results.reduce(
      (s, r) => s + Number(r.cod_for_next_day || 0),
      0,
    )
    const acknowledged = results.filter((r) => r.is_remitted).length
    const pending = results.length - acknowledged
    const overCount = results.filter((r) => Number(r.balance || 0) > 0).length
    const shortCount = results.filter((r) => Number(r.balance || 0) < 0).length

    return {
      totalDeclared,
      totalRemitted,
      totalCOD,
      acknowledged,
      pending,
      overCount,
      shortCount,
      total: results.length,
    }
  }, [data?.results])

  const {
    entityState: viewSheet,
    openEntity: openView,
    closeEntity: closeView,
  } = useEntitySheet<RemittanceRecord>()
  const {
    entityState: createSheet,
    openEntity: openCreate,
    closeEntity: closeCreate,
  } = useEntitySheet<RemittanceRecord>()
  const {
    entityState: editSheet,
    openEntity: openEdit,
    closeEntity: closeEdit,
  } = useEntitySheet<RemittanceRecord>()

  const columns = getRemittanceColumns({
    onView: openView,
    onEdit: openEdit,
    onDelete: (tx) => {
      if (tx?.id) deleteRemittance.mutate(tx.id)
    },
    role: role ?? "guest",
  })

  return (
    <Wrapper>
      <PageHeader
        icon={DollarSign}
        title="Remittance Management"
        description="Track and manage daily cash remittances from all stall locations with comprehensive financial oversight."
        breadcrumbs={["Dashboard", "Receivables", "Remittances"]}
        actionButton={
          (isAdmin || role === "manager" || role === "clerk") && (
            <Button onClick={() => openCreate()}>
              <Plus className="size-4 mr-2" />
              New Remittance
            </Button>
          )
        }
      />

      {/* Summary Stat Cards */}
      {!isLoading && (
        <div className="grid md:grid-cols-3 gap-4">
          <StatCard
            label="Declared"
            value={formatCurrency(stats.totalDeclared)}
            icon={<Wallet className="size-4" />}
            variant="muted"
          />
          <StatCard
            label="Remitted"
            value={formatCurrency(stats.totalRemitted)}
            icon={<Banknote className="size-4" />}
            variant="primary"
          />
          <StatCard
            label="COD Carried"
            value={formatCurrency(stats.totalCOD)}
            icon={<ArrowRightLeft className="size-4" />}
            variant={stats.totalCOD > 0 ? "warning" : "default"}
          />
        </div>
      )}
      <StatusCard stats={stats} />

      {/* Sub Stall Payable — Daily cash settlement owed to sub stall */}
      {role === "manager" &&
        subStallPayable &&
        Number(subStallPayable.total_sales) > 0 && (
          <Card className="p-0 overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between px-4 pt-4">
              <div className="flex items-center gap-2">
                <div className="flex items-center justify-center size-8 rounded-md bg-primary/10">
                  <Store className="size-4 text-primary" />
                </div>
                <div>
                  <p className="text-xs font-semibold leading-tight">
                    {subStallPayable.sub_stall_name}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Daily Settlement
                  </p>
                </div>
              </div>
              <Badge
                variant="outline"
                className="text-xs font-normal px-3 py-1"
              >
                {formatDate(subStallPayable.date, "MMM dd, yyyy")}
              </Badge>
            </div>

            <CardContent className="p-0">
              {/* Cash Payable — hero */}
              <div className="relative mx-3 mb-4 rounded-lg overflow-hidden border border-primary/20 shadow-sm">
                <div className="relative px-4 py-3.5 flex items-center justify-between">
                  <div className="space-y-0.5">
                    <p className="text-[11px] font-medium">Cash to Pay</p>
                    <p className="text-2xl font-bold tabular-nums tracking-tight">
                      {formatCurrency(subStallPayable.cash_payable)}
                    </p>
                  </div>
                  <div className="flex items-center justify-center size-10 rounded-full bg-primary/10">
                    <Banknote className="size-6 text-primary" />
                  </div>
                </div>
              </div>

              {/* Breakdown rows */}
              <div className="px-4 pb-4 space-y-2.5">
                {/* Cash calculation */}
                <div className="space-y-1.5 text-sm">
                  <div className="flex items-center justify-between py-0.5">
                    <span className="text-muted-foreground">Cash Sales</span>
                    <span className="font-semibold tabular-nums">
                      {formatCurrency(subStallPayable.sales_cash)}
                    </span>
                  </div>
                  {Number(subStallPayable.total_expenses) > 0 && (
                    <div className="flex items-center justify-between py-0.5">
                      <span className="text-destructive">− Expenses</span>
                      <span className="font-semibold tabular-nums text-destructive">
                        {formatCurrency(subStallPayable.total_expenses)}
                      </span>
                    </div>
                  )}
                </div>

                {/* E-payments — received directly by admin */}
                {Number(subStallPayable.e_payments_total) > 0 && (
                  <>
                    <Separator />
                    <div className="space-y-1.5">
                      <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                        E-Payments (received by admin)
                      </p>
                      <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 text-xs">
                        {Number(subStallPayable.sales_gcash) > 0 && (
                          <div className="flex items-center justify-between">
                            <span className="text-muted-foreground">GCash</span>
                            <span className="tabular-nums text-muted-foreground font-medium">
                              {formatCurrency(subStallPayable.sales_gcash)}
                            </span>
                          </div>
                        )}
                        {Number(subStallPayable.sales_credit) > 0 && (
                          <div className="flex items-center justify-between">
                            <span className="text-muted-foreground">
                              Credit
                            </span>
                            <span className="tabular-nums text-muted-foreground font-medium">
                              {formatCurrency(subStallPayable.sales_credit)}
                            </span>
                          </div>
                        )}
                        {Number(subStallPayable.sales_debit) > 0 && (
                          <div className="flex items-center justify-between">
                            <span className="text-muted-foreground">Debit</span>
                            <span className="tabular-nums text-muted-foreground font-medium">
                              {formatCurrency(subStallPayable.sales_debit)}
                            </span>
                          </div>
                        )}
                        {Number(subStallPayable.sales_cheque) > 0 && (
                          <div className="flex items-center justify-between">
                            <span className="text-muted-foreground">
                              Cheque
                            </span>
                            <span className="tabular-nums text-muted-foreground font-medium">
                              {formatCurrency(subStallPayable.sales_cheque)}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  </>
                )}
              </div>
            </CardContent>
          </Card>
        )}

      {/* Create Remittance Sheet */}
      <EntitySheet
        open={createSheet.open}
        className="min-w-xl"
        onClose={closeCreate}
        title="New Remittance"
        description="Record a new cash remittance from a stall location."
        withCloseConfirmation
        renderForm={({ forceClose }) => <RemittanceForm onClose={forceClose} />}
      />

      {/* Edit Remittance Sheet */}
      <EntitySheet
        className="min-w-xl"
        open={editSheet.open}
        onClose={closeEdit}
        entity={editSheet.entity}
        title="Edit Remittance"
        description="Update remittance details and information."
        withCloseConfirmation
        renderForm={({ forceClose, entity }) =>
          entity ? (
            <RemittanceForm
              initialData={{
                ...entity,
                stall: entity.stall,
              }}
              onClose={forceClose}
            />
          ) : null
        }
      />

      {/* View Remittance Sheet */}
      <EntitySheet
        className="min-w-xl"
        open={viewSheet.open}
        onClose={closeView}
        entity={viewSheet.entity}
        title="Remittance Details"
        description="View comprehensive remittance information and status."
        renderForm={({ entity, onClose }) =>
          entity ? (
            <RemittanceDetails
              entity={entity}
              onClose={onClose}
              onMarkAsRemitted={() => {
                if (entity.id) markRemitted.mutate(entity.id)
                onClose()
              }}
              markAsRemittedPending={markRemitted.isPending}
            />
          ) : null
        }
      />

      {/* Main Content */}
      <DataTable
        title="Remittances"
        description="Daily cash remittances and financial tracking"
        isLoading={isLoading}
        columns={columns}
        data={
          data ?? {
            count: 0,
            next: null,
            previous: null,
            results: [],
          }
        }
        defaultRangePreset="Last 30 Days"
        filters={filters}
        orderingOptions={orderingOptions}
        onRefresh={refetch}
        emptyIcon={DollarSign}
        emptyTitle="No remittances found"
        emptyDescription="Submit your first daily remittance to start tracking"
      />
    </Wrapper>
  )
}

/* ────────────────────────────────────────────
   Sub-components
   ──────────────────────────────────────────── */

function StatCard({
  label,
  value,
  icon,
  variant = "default",
}: {
  label: string
  value: string
  icon: React.ReactNode
  variant?: "default" | "primary" | "warning" | "muted"
}) {
  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-xl border p-4 transition-all hover:shadow-md",
        variant === "primary" && "border-primary/30 bg-primary/5",
        variant === "warning" && "border-amber-500/30 bg-amber-500/5",
        variant === "muted" && "bg-muted/30",
        variant === "default" && "bg-card",
      )}
    >
      <div className="flex items-center justify-between mb-3">
        <div
          className={cn(
            "flex items-center justify-center size-9 rounded-lg",
            variant === "primary" && "bg-primary/15",
            variant === "warning" && "bg-amber-500/15",
            variant === "muted" && "bg-muted-foreground/10",
            variant === "default" && "bg-primary/10",
          )}
        >
          <div
            className={cn(
              variant === "primary" && "text-primary",
              variant === "warning" && "text-amber-600",
              variant === "muted" && "text-muted-foreground",
              variant === "default" && "text-primary",
            )}
          >
            {icon}
          </div>
        </div>
      </div>
      <div className="space-y-1">
        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
          {label}
        </p>
        <p
          className={cn(
            "text-2xl font-bold tabular-nums tracking-tight",
            variant === "warning" && "text-amber-600",
            variant === "muted" && "text-muted-foreground",
          )}
        >
          {value}
        </p>
      </div>
    </div>
  )
}

function StatusCard({
  stats,
}: {
  stats: {
    pending: number
    acknowledged: number
    shortCount: number
    overCount: number
  }
}) {
  return (
    <div className="relative overflow-hidden rounded-xl border bg-card p-4 transition-all hover:shadow-md">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center justify-center size-9 rounded-lg bg-primary/10">
          <DollarSign className="size-4 text-primary" />
        </div>
      </div>
      <div className="space-y-1 mb-3">
        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
          Status
        </p>
      </div>
      <div className="grid md:grid-cols-2 gap-2">
        {stats.pending > 0 && (
          <div className="flex items-center gap-2 rounded-lg bg-secondary/50 px-2.5 py-2">
            <Clock className="size-4 text-muted-foreground shrink-0" />
            <div className="min-w-0">
              <p className="text-lg font-bold tabular-nums leading-none">
                {stats.pending}
              </p>
              <p className="text-[10px] text-muted-foreground uppercase tracking-wide">
                Pending
              </p>
            </div>
          </div>
        )}
        {stats.acknowledged > 0 && (
          <div className="flex items-center gap-2 rounded-lg bg-green-500/10 px-2.5 py-2">
            <CheckCircle2 className="size-4 text-green-600 shrink-0" />
            <div className="min-w-0">
              <p className="text-lg font-bold tabular-nums leading-none text-green-600">
                {stats.acknowledged}
              </p>
              <p className="text-[10px] text-green-600/70 uppercase tracking-wide">
                Done
              </p>
            </div>
          </div>
        )}
        {stats.shortCount > 0 && (
          <div className="flex items-center gap-2 rounded-lg bg-destructive/10 px-2.5 py-2">
            <TrendingDown className="size-4 text-destructive shrink-0" />
            <div className="min-w-0">
              <p className="text-lg font-bold tabular-nums leading-none text-destructive">
                {stats.shortCount}
              </p>
              <p className="text-[10px] text-destructive/70 uppercase tracking-wide">
                Short
              </p>
            </div>
          </div>
        )}
        {stats.overCount > 0 && (
          <div className="flex items-center gap-2 rounded-lg bg-amber-500/10 px-2.5 py-2">
            <TrendingUp className="size-4 text-amber-600 shrink-0" />
            <div className="min-w-0">
              <p className="text-lg font-bold tabular-nums leading-none text-amber-600">
                {stats.overCount}
              </p>
              <p className="text-[10px] text-amber-600/70 uppercase tracking-wide">
                Over
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
