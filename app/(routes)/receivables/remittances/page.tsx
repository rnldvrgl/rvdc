"use client"

import { SubStallSettlement } from "@/components/custom/dashboard/SubStallSettlement"
import EntitySheet from "@/components/custom/shared/EntitySheet"
import PageHeader from "@/components/custom/shared/PageHeader"
import { Wrapper } from "@/components/custom/shared/Wrapper"
import { DataTable } from "@/components/custom/table/DataTable"
import { RemittanceDetails } from "@/components/details/RemittanceDetails"
import RemittanceForm from "@/components/forms/RemittanceForm"
import { Button } from "@/components/ui/button"
import { RemittanceRecord } from "@/lib/constants/interface"
import { useCurrentUser } from "@/lib/hooks/useCurrentUser"
import { useEntitySheet } from "@/lib/hooks/useEntitySheet"
import useSearchParameters from "@/lib/hooks/useSearchParameters"
import { useRemittanceMutations } from "@/lib/mutations/useRemittanceMutations"
import {
  useRemittancesRecordFilters,
  useRemittancesRecords,
} from "@/lib/queries/useRemittancesRecords"
import { cn, formatCurrency } from "@/lib/utils/helpers"
import {
  ArrowRightLeft,
  Banknote,
  DollarSign,
  Plus,
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

      <SubStallSettlement className="w-full lg:w-80 lg:ml-auto" />

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
