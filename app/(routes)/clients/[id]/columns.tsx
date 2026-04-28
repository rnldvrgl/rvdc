"use client"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import type { AirconUnits, SalesTransaction, Service, ServicePayment } from "@/lib/constants/interface"
import type { ClientFundDeposit } from "@/lib/constants/types"
import { formatCurrency } from "@/lib/utils/currency"
import { getBadgeVariant } from "@/lib/utils/helpers"
import { paymentStatusLabels } from "@/lib/constants/enumMappings"
import {
  getServiceModeLabel,
  getServiceStatusLabel,
  getServiceTypeBadgeClass,
  getServiceTypeLabel,
} from "@/lib/utils/helpers/service"
import { ColumnDef } from "@tanstack/react-table"
import { format } from "date-fns"
import { Archive, Gift, MoreHorizontal, RotateCcw, Shield, Sparkles, Wrench } from "lucide-react"

// ── Label maps ──────────────────────────────────────────────────────────────

export const paymentTypeLabels: Record<string, string> = {
  cash: "Cash",
  gcash: "GCash",
  credit: "Credit Card",
  debit: "Debit Card",
  cheque: "Cheque",
  fund: "Client Fund",
}

// ── Helpers ─────────────────────────────────────────────────────────────────

export function formatDate(dateStr: string) {
  try { return format(new Date(dateStr), "MMM dd, yyyy") } catch { return dateStr }
}
export function formatDateTime(dateStr: string) {
  try { return format(new Date(dateStr), "MMM dd, yyyy hh:mm a") } catch { return dateStr }
}

// ── Types ───────────────────────────────────────────────────────────────────

export type PaymentRowType = ServicePayment & {
  service_id: number
  service_type: string
  received_by_name?: string
}

// ── Filter functions ────────────────────────────────────────────────────────

export const serviceFilterFn = (s: Service, q: string) =>
  String(s.id).includes(q) ||
  getServiceTypeLabel(s.service_type).toLowerCase().includes(q) ||
  getServiceModeLabel(s.service_mode).toLowerCase().includes(q) ||
  getServiceStatusLabel(s.status).toLowerCase().includes(q) ||
  (s.description ?? "").toLowerCase().includes(q)

export const salesFilterFn = (t: SalesTransaction, q: string) =>
  (t.manual_receipt_number ?? "").toLowerCase().includes(q) ||
  (t.stall?.name ?? "").toLowerCase().includes(q) ||
  (t.items?.some((i) => (i.item?.name ?? i.description ?? "").toLowerCase().includes(q)) ?? false)

export const paymentFilterFn = (p: PaymentRowType, q: string) =>
  String(p.service_id).includes(q) ||
  (paymentTypeLabels[p.payment_type] ?? p.payment_type).toLowerCase().includes(q) ||
  (p.received_by_name ?? "").toLowerCase().includes(q)

export const unitFilterFn = (u: AirconUnits, q: string) =>
  (u.serial_number ?? "").toLowerCase().includes(q) ||
  (u.outdoor_serial_number ?? "").toLowerCase().includes(q) ||
  (u.model?.brand?.name ?? "").toLowerCase().includes(q) ||
  (u.model?.name ?? "").toLowerCase().includes(q) ||
  (u.unit_status ?? "").toLowerCase().includes(q)

export const fundDepositFilterFn = (d: ClientFundDeposit, q: string) =>
  (d.payment_method_display ?? d.payment_method).toLowerCase().includes(q) ||
  (d.notes ?? "").toLowerCase().includes(q) ||
  (d.recorded_by_name ?? "").toLowerCase().includes(q)

export const fundDepositColumns: ColumnDef<ClientFundDeposit>[] = [
  {
    id: "deposit_date",
    accessorFn: (row) => row.deposit_date,
    header: "Date",
    enableSorting: true,
    cell: ({ row }) => (
      <span className="text-sm text-muted-foreground">
        {formatDateTime(row.original.deposit_date)}
      </span>
    ),
  },
  {
    id: "amount",
    accessorFn: (row) => parseFloat(row.amount || "0"),
    header: "Amount",
    enableSorting: true,
    cell: ({ row }) => (
      <span className="font-semibold text-emerald-600">
        {formatCurrency(row.original.amount)}
      </span>
    ),
  },
  {
    id: "payment_method",
    accessorFn: (row) => row.payment_method,
    header: "Method",
    enableSorting: true,
    cell: ({ row }) => (
      <Badge variant="outline" className="text-xs">
        {row.original.payment_method_display ?? row.original.payment_method}
      </Badge>
    ),
  },
  {
    id: "recorded_by",
    accessorFn: (row) => row.recorded_by_name ?? "",
    header: "Recorded By",
    enableSorting: true,
    cell: ({ row }) => (
      <span className="text-sm text-muted-foreground">
        {row.original.recorded_by_name || "\u2014"}
      </span>
    ),
  },
  {
    id: "notes",
    accessorFn: (row) => row.notes ?? "",
    header: "Notes",
    enableSorting: false,
    cell: ({ row }) => (
      <span className="text-sm text-muted-foreground line-clamp-1 max-w-[280px]">
        {row.original.notes || "\u2014"}
      </span>
    ),
  },
]

// ── Service columns ─────────────────────────────────────────────────────────

export function getServiceColumns({
  canManage,
  onViewService,
  onArchiveService,
}: {
  canManage: boolean
  onViewService: (s: Service) => void
  onArchiveService: (s: Service) => void
}): ColumnDef<Service>[] {
  const cols: ColumnDef<Service>[] = [
    {
      id: "id",
      accessorFn: (row) => row.id,
      header: "SVC #",
      enableSorting: true,
      meta: { thClass: "w-28", tdClass: "w-28" },
      cell: ({ row }) => (
        <span className="font-mono font-semibold text-sm">
          SVC-{String(row.original.id).padStart(4, "0")}
        </span>
      ),
    },
    {
      id: "type",
      header: "Service",
      enableSorting: false,
      cell: ({ row }) => {
        const service = row.original
        const warranty = service.appliances?.some(
          (a) => a.is_labor_warranty_active || a.is_unit_warranty_active,
        ) ?? false
        const freeCleaning = service.installation_units?.some(
          (u) => u.free_cleaning_redeemed === false && u.free_cleaning_status === "available",
        ) ?? false

        return (
          <div className="space-y-0.5">
            <div className="flex flex-wrap items-center gap-1">
              <Badge variant="outline" className={`text-[10px] px-1.5 py-0 ${getServiceTypeBadgeClass(service.service_type)}`}>
                {getServiceTypeLabel(service.service_type)}
              </Badge>
              <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
                {getServiceModeLabel(service.service_mode)}
              </Badge>
              {service.is_complementary && (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Badge
                      variant="outline"
                      className="text-[10px] px-1.5 py-0 border-amber-500 text-amber-600 dark:text-amber-400 gap-0.5"
                    >
                      <Gift className="h-2.5 w-2.5" />
                      {service.complementary_reason === "Warranty Claim" ? "Warranty" : "Free"}
                    </Badge>
                  </TooltipTrigger>
                  <TooltipContent>
                    {service.complementary_reason || "Complementary Service"}
                  </TooltipContent>
                </Tooltip>
              )}
              {warranty && (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Shield className="h-3 w-3 text-blue-500 shrink-0" />
                  </TooltipTrigger>
                  <TooltipContent>Active warranty</TooltipContent>
                </Tooltip>
              )}
              {freeCleaning && (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Sparkles className="h-3 w-3 text-success shrink-0" />
                  </TooltipTrigger>
                  <TooltipContent>Free cleaning available</TooltipContent>
                </Tooltip>
              )}
            </div>
            {service.description && (
              <p className="text-xs text-muted-foreground line-clamp-1 max-w-[180px]">
                {service.description}
              </p>
            )}
          </div>
        )
      },
    },
    {
      id: "status",
      header: "Status",
      enableSorting: false,
      meta: { thClass: "w-28", tdClass: "w-28" },
      cell: ({ row }) => (
        <Badge variant={getBadgeVariant(row.original.status)} className="text-xs">
          {getServiceStatusLabel(row.original.status)}
        </Badge>
      ),
    },
    {
      id: "created",
      accessorFn: (row) => row.created_at,
      header: "Created",
      enableSorting: true,
      meta: { thClass: "hidden md:table-cell w-32", tdClass: "hidden md:table-cell w-32" },
      cell: ({ row }) => (
        <span className="text-muted-foreground whitespace-nowrap">
          {formatDate(row.original.created_at)}
        </span>
      ),
    },
    {
      id: "main_rev",
      accessorFn: (row) => parseFloat(row.main_stall_revenue || "0"),
      header: "Main",
      enableSorting: true,
      meta: { thClass: "hidden lg:table-cell w-32", tdClass: "hidden lg:table-cell w-32" },
      cell: ({ row }) => (
        <span className="text-muted-foreground">
          {Number(row.original.main_stall_revenue) > 0 ? formatCurrency(row.original.main_stall_revenue) : "\u2014"}
        </span>
      ),
    },
    {
      id: "sub_rev",
      accessorFn: (row) => parseFloat(row.sub_stall_revenue || "0"),
      header: "Sub",
      enableSorting: true,
      meta: { thClass: "hidden lg:table-cell w-32", tdClass: "hidden lg:table-cell w-32" },
      cell: ({ row }) => (
        <span className="text-muted-foreground">
          {Number(row.original.sub_stall_revenue) > 0 ? formatCurrency(row.original.sub_stall_revenue) : "\u2014"}
        </span>
      ),
    },
    {
      id: "total",
      accessorFn: (row) => parseFloat(row.total_revenue || "0"),
      header: "Total",
      enableSorting: true,
      meta: { thClass: "w-32", tdClass: "w-32" },
      cell: ({ row }) => (
        <span className="font-semibold">
          {formatCurrency(row.original.total_revenue)}
        </span>
      ),
    },
    {
      id: "balance",
      accessorFn: (row) => parseFloat(row.balance_due || "0"),
      header: "Balance",
      enableSorting: true,
      meta: { thClass: "w-28", tdClass: "w-28" },
      cell: ({ row }) => {
        const balance = parseFloat(row.original.balance_due || "0")
        if (balance === 0) {
          return <span className="text-muted-foreground text-sm">—</span>
        }
        return (
          <span className={`font-medium tabular-nums text-sm ${balance < 0 ? "text-orange-600" : "text-destructive"}`}>
            {formatCurrency(balance)}
          </span>
        )
      },
    },
    {
      id: "payment_status",
      header: "Payment",
      enableSorting: false,
      meta: { thClass: "w-32", tdClass: "w-32" },
      cell: ({ row }) => (
        <Badge variant={getBadgeVariant(row.original.payment_status)} className="text-xs">
          {paymentStatusLabels[row.original.payment_status] ?? row.original.payment_status}
        </Badge>
      ),
    },
  ]
  if (canManage) {
    cols.push({
      id: "actions",
      header: "",
      enableSorting: false,
      cell: ({ row }) => (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="size-8">
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => onViewService(row.original)}>
              <Wrench className="mr-2 h-4 w-4" />View Details
            </DropdownMenuItem>
            <DropdownMenuItem
              className="text-destructive"
              onClick={() => onArchiveService(row.original)}
            >
              <Archive className="mr-2 h-4 w-4" />Archive
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      ),
    })
  }
  return cols
}

// ── Archived service columns ────────────────────────────────────────────────

export function getArchivedServiceColumns(
  onRestore: (id: number) => void,
): ColumnDef<Service>[] {
  return [
    {
      id: "id",
      accessorFn: (row) => row.id,
      header: "SVC #",
      enableSorting: true,
      meta: { thClass: "w-28", tdClass: "w-28" },
      cell: ({ row }) => (
        <span className="font-mono font-semibold text-sm">
          SVC-{String(row.original.id).padStart(4, "0")}
        </span>
      ),
    },
    {
      id: "type",
      header: "Service",
      enableSorting: false,
      cell: ({ row }) => {
        const service = row.original
        return (
          <div className="flex flex-wrap items-center gap-1">
            <Badge variant="outline" className={`text-[10px] px-1.5 py-0 ${getServiceTypeBadgeClass(service.service_type)}`}>
              {getServiceTypeLabel(service.service_type)}
            </Badge>
            <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
              {getServiceModeLabel(service.service_mode)}
            </Badge>
            {service.is_complementary && (
              <Badge
                variant="outline"
                className="text-[10px] px-1.5 py-0 border-amber-500 text-amber-600 dark:text-amber-400 gap-0.5"
              >
                <Gift className="h-2.5 w-2.5" />
                {service.complementary_reason === "Warranty Claim" ? "Warranty" : "Free"}
              </Badge>
            )}
          </div>
        )
      },
    },
    {
      id: "status",
      header: "Status",
      enableSorting: false,
      meta: { thClass: "w-28", tdClass: "w-28" },
      cell: ({ row }) => (
        <Badge variant={getBadgeVariant(row.original.status)} className="text-xs">
          {getServiceStatusLabel(row.original.status)}
        </Badge>
      ),
    },
    {
      id: "created",
      accessorFn: (row) => row.created_at,
      header: "Created",
      enableSorting: true,
      meta: { thClass: "hidden md:table-cell w-32", tdClass: "hidden md:table-cell w-32" },
      cell: ({ row }) => (
        <span className="text-muted-foreground whitespace-nowrap">
          {formatDate(row.original.created_at)}
        </span>
      ),
    },
    {
      id: "total",
      accessorFn: (row) => parseFloat(row.total_revenue || "0"),
      header: "Total",
      enableSorting: true,
      meta: { thClass: "w-32", tdClass: "w-32" },
      cell: ({ row }) => (
        <span className="font-semibold">
          {formatCurrency(row.original.total_revenue)}
        </span>
      ),
    },
    {
      id: "restore",
      header: "",
      enableSorting: false,
      meta: { thClass: "w-12", tdClass: "w-12" },
      cell: ({ row }) => (
        <Button
          variant="ghost" size="icon" className="size-8"
          onClick={() => onRestore(row.original.id)}
        >
          <RotateCcw className="h-4 w-4" />
        </Button>
      ),
    },
  ]
}

// ── Sales columns ───────────────────────────────────────────────────────────

export function getSalesColumns(
  serviceRelatedTransactionIds: Set<number>,
): ColumnDef<SalesTransaction>[] {
  return [
    {
      id: "receipt",
      header: "OR / SI #",
      enableSorting: false,
      meta: { thClass: "w-36", tdClass: "w-36" },
      cell: ({ row }) => {
        const tx = row.original
        return tx.manual_receipt_number ? (
          <span className="font-mono font-semibold text-sm">
            {tx.document_type === "or" ? "OR" : "SI"} #{tx.manual_receipt_number}
            {tx.receipt_book && (
              <span className="block text-xs font-normal text-muted-foreground">
                Book {tx.receipt_book}
              </span>
            )}
          </span>
        ) : (
          <span className="text-xs text-muted-foreground">{"\u2014"}</span>
        )
      },
    },
    {
      id: "date",
      accessorFn: (row) => row.created_at,
      header: "Date",
      enableSorting: true,
      meta: { thClass: "w-32", tdClass: "w-32" },
      cell: ({ row }) => (
        <span className="text-muted-foreground whitespace-nowrap">
          {formatDate(row.original.created_at)}
        </span>
      ),
    },
    {
      id: "items",
      header: "Items",
      enableSorting: false,
      cell: ({ row }) => {
        const tx = row.original
        const itemCount = tx.items?.length || 0
        const totalQty = tx.items?.reduce((s, i) => s + parseFloat(String(i.quantity)), 0) || 0
        return (
          <div>
            <p className="font-medium">
              {itemCount} item{itemCount !== 1 ? "s" : ""}
              <span className="text-muted-foreground font-normal"> ({totalQty} qty)</span>
            </p>
            {tx.items && tx.items.length > 0 && (
              <p className="text-xs text-muted-foreground line-clamp-1 max-w-[200px] mt-0.5">
                {tx.items.map((item) => {
                  const qty = parseFloat(String(item.quantity))
                  return `${item.item?.name ?? item.description} x${qty % 1 === 0 ? qty.toFixed(0) : qty}`
                }).join(", ")}
              </p>
            )}
          </div>
        )
      },
    },
    {
      id: "stall",
      header: "Stall",
      enableSorting: false,
      meta: { thClass: "hidden md:table-cell w-28", tdClass: "hidden md:table-cell w-28" },
      cell: ({ row }) => (
        <span className="text-muted-foreground">{row.original.stall?.name || "\u2014"}</span>
      ),
    },
    {
      id: "source",
      header: "Source",
      enableSorting: false,
      meta: { thClass: "hidden sm:table-cell w-24", tdClass: "hidden sm:table-cell w-24" },
      cell: ({ row }) => {
        const isServiceRelated = serviceRelatedTransactionIds.has(row.original.id)
        return (
          <Badge
            variant="outline"
            className={`text-xs ${isServiceRelated ? "border-blue-500/30 text-blue-600 dark:text-blue-400" : ""}`}
          >
            {isServiceRelated ? "Service" : "Walk-in"}
          </Badge>
        )
      },
    },
    {
      id: "amount",
      accessorFn: (row) => parseFloat(String(row.computed_total || "0")),
      header: "Amount",
      enableSorting: true,
      meta: { thClass: "w-32", tdClass: "w-32" },
      cell: ({ row }) => (
        <span className="font-semibold">
          {formatCurrency(row.original.computed_total || 0)}
        </span>
      ),
    },
    {
      id: "pay_status",
      header: "Status",
      enableSorting: false,
      meta: { thClass: "w-32", tdClass: "w-32" },
      cell: ({ row }) => (
        <Badge variant={getBadgeVariant(row.original.payment_status)} className="text-xs">
          {paymentStatusLabels[row.original.payment_status] ?? row.original.payment_status}
        </Badge>
      ),
    },
  ]
}

// ── Payment columns ─────────────────────────────────────────────────────────

export const paymentColumns: ColumnDef<PaymentRowType>[] = [
  {
    id: "date",
    accessorFn: (row) => row.payment_date,
    header: "Date & Time",
    enableSorting: true,
    meta: { thClass: "w-44", tdClass: "w-44" },
    cell: ({ row }) => (
      <span className="whitespace-nowrap">
        {formatDateTime(row.original.payment_date)}
      </span>
    ),
  },
  {
    id: "service",
    header: "Service",
    enableSorting: false,
    cell: ({ row }) => (
      <div className="flex items-center gap-2 flex-wrap">
        <span className="font-mono font-semibold">
          SVC-{String(row.original.service_id).padStart(4, "0")}
        </span>
        <Badge variant="outline" className={`text-xs ${getServiceTypeBadgeClass(row.original.service_type)}`}>
          {getServiceTypeLabel(row.original.service_type)}
        </Badge>
      </div>
    ),
  },
  {
    id: "method",
    header: "Method",
    enableSorting: false,
    meta: { thClass: "hidden sm:table-cell w-32", tdClass: "hidden sm:table-cell w-32" },
    cell: ({ row }) => (
      <Badge variant="outline" className="text-xs">
        {paymentTypeLabels[row.original.payment_type] ?? row.original.payment_type}
      </Badge>
    ),
  },
  {
    id: "received_by",
    header: "Received By",
    enableSorting: false,
    meta: { thClass: "hidden md:table-cell", tdClass: "hidden md:table-cell" },
    cell: ({ row }) => (
      <span className="text-muted-foreground">
        {row.original.received_by_name || "\u2014"}
      </span>
    ),
  },
  {
    id: "amount",
    accessorFn: (row) => parseFloat(String(row.amount || "0")),
    header: "Amount",
    enableSorting: true,
    meta: { thClass: "w-32", tdClass: "w-32" },
    cell: ({ row }) => (
      <span className="font-semibold text-success">
        {formatCurrency(row.original.amount)}
      </span>
    ),
  },
]

// ── Unit columns ────────────────────────────────────────────────────────────

export const unitColumns: ColumnDef<AirconUnits>[] = [
  {
    id: "unit",
    header: "Unit",
    enableSorting: false,
    cell: ({ row }) => {
      const u = row.original
      return (
        <div>
          <p className="text-sm font-medium">
            {u.model?.brand?.name} {u.model?.name}
          </p>
          <p className="text-xs text-muted-foreground font-mono mt-0.5">
            SN: {u.serial_number}
          </p>
        </div>
      )
    },
  },
  {
    id: "type",
    header: "Type / HP",
    enableSorting: false,
    meta: { thClass: "hidden sm:table-cell w-32", tdClass: "hidden sm:table-cell w-32" },
    cell: ({ row }) => (
      <span className="text-sm text-muted-foreground capitalize">
        {row.original.model?.aircon_type ?? "—"} · {row.original.model?.horsepower ?? "—"}HP
      </span>
    ),
  },
  {
    id: "status",
    header: "Status",
    enableSorting: false,
    meta: { thClass: "w-32", tdClass: "w-32" },
    cell: ({ row }) => {
      const status = row.original.unit_status ?? "Available"
      const variant =
        status === "Installed" ? "default" :
        status === "For Installation" ? "secondary" :
        status === "Sold" ? "default" :
        "outline"
      return <Badge variant={variant} className="text-xs">{status}</Badge>
    },
  },
  {
    id: "warranty",
    header: "Warranty",
    enableSorting: false,
    meta: { thClass: "hidden md:table-cell w-36", tdClass: "hidden md:table-cell w-36" },
    cell: ({ row }) => {
      const u = row.original
      if (!u.warranty_start_date) return <span className="text-xs text-muted-foreground">—</span>
      const status = u.warranty_status ?? "expired"
      const variant = status === "active" ? "default" : status === "expiring_soon" ? "secondary" : "outline"
      return (
        <div>
          <Badge variant={variant} className="text-xs capitalize">{status.replace("_", " ")}</Badge>
          {u.warranty_days_left != null && u.warranty_days_left > 0 && (
            <p className="text-xs text-muted-foreground mt-0.5">{u.warranty_days_left}d left</p>
          )}
        </div>
      )
    },
  },
  {
    id: "free_cleaning",
    header: "Free Cleaning",
    enableSorting: false,
    meta: { thClass: "hidden lg:table-cell w-32", tdClass: "hidden lg:table-cell w-32" },
    cell: ({ row }) => {
      const u = row.original
      return (
        <Badge variant={u.free_cleaning_redeemed ? "outline" : "default"} className="text-xs">
          {u.free_cleaning_redeemed ? "Redeemed" : "Available"}
        </Badge>
      )
    },
  },
  {
    id: "installed",
    header: "Installed",
    enableSorting: false,
    meta: { thClass: "hidden lg:table-cell w-32", tdClass: "hidden lg:table-cell w-32" },
    cell: ({ row }) => (
      <span className="text-muted-foreground whitespace-nowrap">
        {row.original.installed_date ? formatDate(row.original.installed_date) : "—"}
      </span>
    ),
  },
]

// ── Warranty claim filter ───────────────────────────────────────────────────

export const warrantyFilterFn = (s: Service, q: string) =>
  String(s.id).includes(q) ||
  (s.complementary_reason ?? "").toLowerCase().includes(q) ||
  getServiceStatusLabel(s.status).toLowerCase().includes(q) ||
  (s.appliances?.some(
    (a) => (a.brand ?? "").toLowerCase().includes(q) || (a.model ?? "").toLowerCase().includes(q),
  ) ?? false)

// ── Warranty claim columns ──────────────────────────────────────────────────

export function getWarrantyClaimColumns(): ColumnDef<Service>[] {
  return [
    {
      id: "id",
      accessorFn: (row) => row.id,
      header: "SVC #",
      enableSorting: true,
      meta: { thClass: "w-28", tdClass: "w-28" },
      cell: ({ row }) => (
        <span className="font-mono font-semibold text-sm">
          SVC-{String(row.original.id).padStart(4, "0")}
        </span>
      ),
    },
    {
      id: "reason",
      header: "Claim Type",
      enableSorting: false,
      cell: ({ row }) => (
        <Badge variant="outline" className="text-xs gap-1 border-amber-500 text-amber-600 dark:text-amber-400">
          <Shield className="h-3 w-3" />
          {row.original.complementary_reason || "Warranty"}
        </Badge>
      ),
    },
    {
      id: "appliances",
      header: "Appliance",
      enableSorting: false,
      cell: ({ row }) => {
        const appliances = row.original.appliances || []
        if (appliances.length === 0) return <span className="text-muted-foreground text-sm">—</span>
        const first = appliances[0]
        return (
          <div>
            <p className="text-sm font-medium">
              {first.brand && first.model
                ? `${first.brand} ${first.model}`
                : first.appliance_type?.name || "Unknown"}
            </p>
            {first.serial_number && (
              <p className="text-xs text-muted-foreground font-mono mt-0.5">
                SN: {first.serial_number}
              </p>
            )}
            {appliances.length > 1 && (
              <p className="text-xs text-muted-foreground mt-0.5">
                +{appliances.length - 1} more
              </p>
            )}
          </div>
        )
      },
    },
    {
      id: "status",
      header: "Status",
      enableSorting: false,
      meta: { thClass: "w-28", tdClass: "w-28" },
      cell: ({ row }) => (
        <Badge variant={getBadgeVariant(row.original.status)} className="text-xs">
          {getServiceStatusLabel(row.original.status)}
        </Badge>
      ),
    },
    {
      id: "revenue",
      header: "Parts Cost",
      enableSorting: true,
      accessorFn: (row) => parseFloat(row.total_revenue || "0"),
      meta: { thClass: "w-28", tdClass: "w-28" },
      cell: ({ row }) => {
        const rev = parseFloat(row.original.total_revenue || "0")
        return rev > 0 ? (
          <span className="font-semibold text-sm">{formatCurrency(rev)}</span>
        ) : (
          <span className="text-muted-foreground text-sm">Free</span>
        )
      },
    },
    {
      id: "created",
      accessorFn: (row) => row.created_at,
      header: "Claimed",
      enableSorting: true,
      meta: { thClass: "w-32", tdClass: "w-32" },
      cell: ({ row }) => (
        <span className="text-muted-foreground whitespace-nowrap text-sm">
          {formatDate(row.original.created_at)}
        </span>
      ),
    },
  ]
}
