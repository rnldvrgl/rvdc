"use client"

import { ArchiveToggle } from "@/components/custom/shared/ArchiveToggle"
import { ConfirmDialog } from "@/components/custom/shared/ConfirmDialog"
import EntitySheet from "@/components/custom/shared/EntitySheet"
import PageHeader from "@/components/custom/shared/PageHeader"
import { Wrapper } from "@/components/custom/shared/Wrapper"
import { SalesTransactionDetails } from "@/components/details/SalesTransactionDetails"
import ServiceFormWizard from "@/components/forms/ServiceFormWizard"
import ServiceDetail from "@/components/services/ServiceDetail"
import { AirconUnitDetails } from "@/components/aircons/AirconUnitDetails"
import { DataTable } from "@/components/custom/table/DataTable"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Skeleton } from "@/components/ui/skeleton"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import type {
  AirconUnits,
  SalesTransaction,
  Service,
  ServicePayment,
} from "@/lib/constants/interface"
import { useArchive } from "@/lib/hooks/useArchive"
import { useCurrentUser } from "@/lib/hooks/useCurrentUser"
import { useEntitySheet } from "@/lib/hooks/useEntitySheet"
import { useServiceMutations } from "@/lib/mutations/services/useServiceMutations"
import { useClient } from "@/lib/queries/clients/useClients"
import { useSalesTransactions } from "@/lib/queries/sales/useSalesTransactions"
import { useService, useServices } from "@/lib/queries/services/useServices"
import { useAirconUnits } from "@/lib/queries/useAircons"
import { formatCurrency } from "@/lib/utils/currency"
import { getBadgeVariant } from "@/lib/utils/helpers"
import {
  getServiceModeLabel,
  getServiceStatusLabel,
  getServiceTypeBadgeClass,
  getServiceTypeLabel,
} from "@/lib/utils/helpers/service"
import { ColumnDef } from "@tanstack/react-table"
import { format } from "date-fns"
import {
  Archive,
  ArrowLeft,
  Ban,
  Calendar,
  CreditCard,
  DollarSign,
  MapPin,
  MoreHorizontal,
  Phone,
  Plus,
  Receipt,
  RotateCcw,
  ShoppingCart,
  User,
  Wallet,
  Wind,
  Wrench,
} from "lucide-react"
import { useParams, useRouter } from "next/navigation"
import { useMemo, useState } from "react"

// ── Label maps ────────────────────────────────────────────────────────────────

const paymentStatusLabels: Record<string, string> = {
  unpaid: "Unpaid",
  partial: "Partially Paid",
  paid: "Paid",
  refunded: "Refunded",
  written_off: "Written Off",
  "n/a": "N/A",
}

const paymentTypeLabels: Record<string, string> = {
  cash: "Cash",
  gcash: "GCash",
  credit: "Credit Card",
  debit: "Debit Card",
  cheque: "Cheque",
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function formatDate(dateStr: string) {
  try { return format(new Date(dateStr), "MMM dd, yyyy") } catch { return dateStr }
}
function formatDateTime(dateStr: string) {
  try { return format(new Date(dateStr), "MMM dd, yyyy hh:mm a") } catch { return dateStr }
}

// ── Stat card ─────────────────────────────────────────────────────────────────

function StatCard({
  icon,
  label,
  value,
  accent = "default",
  valueClass,
}: {
  icon: React.ElementType
  label: string
  value: string | number
  accent?: "default" | "blue" | "purple" | "green" | "red" | "muted"
  valueClass?: string
}) {
  const Icon = icon
  const styles = {
    default: { card: "", icon: "bg-primary/10 text-primary" },
    blue:    { card: "border-blue-500/20   bg-blue-500/5",   icon: "bg-blue-500/15   text-blue-500" },
    purple:  { card: "border-purple-500/20 bg-purple-500/5", icon: "bg-purple-500/15 text-purple-500" },
    green:   { card: "border-green-500/20  bg-green-500/5",  icon: "bg-green-500/15  text-green-500" },
    red:     { card: "border-red-500/20    bg-red-500/5",    icon: "bg-red-500/15    text-destructive" },
    muted:   { card: "bg-muted/30",                          icon: "bg-muted-foreground/10 text-muted-foreground" },
  }[accent]
  return (
    <div className={`relative overflow-hidden rounded-xl border p-4 transition-all hover:shadow-md ${styles.card}`}>
      <div className={`inline-flex items-center justify-center size-9 rounded-lg mb-3 ${styles.icon}`}>
        <Icon className="size-4" />
      </div>
      <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1">{label}</p>
      <p className={`text-2xl font-bold tabular-nums tracking-tight ${valueClass ?? ""}`}>{value}</p>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────

export default function ClientDetailPage() {
  const params = useParams()
  const router = useRouter()
  const clientId = params.id as string
  const { canManage } = useCurrentUser()

  const { data: client, isLoading: clientLoading } = useClient(clientId)
  const {
    data: servicesData,
    isLoading: servicesLoading,
    refetch: refetchServices,
  } = useServices({ filter: { client: clientId }, limit: 500 })

  const { data: salesData, isLoading: salesLoading } = useSalesTransactions({
    filter: { client: clientId },
    limit: 500,
  })

  const { data: unitsData, isLoading: unitsLoading } = useAirconUnits({
    filter: { client: clientId },
    limit: 500,
  })

  // ── Service detail sheet ─────────────────────────────────────────────────
  const [selectedService, setSelectedService] = useState<Service | null>(null)
  const [detailsOpen, setDetailsOpen] = useState(false)
  const { data: detailService, refetch: refetchService } = useService(selectedService?.id)

  // ── Sales detail sheet ───────────────────────────────────────────────────
  const {
    entityState: salesViewSheet,
    openEntity: openSalesView,
    closeEntity: closeSalesView,
  } = useEntitySheet<SalesTransaction>()

  // ── Create service sheet ─────────────────────────────────────────────────
  const {
    entityState: createServiceSheet,
    openEntity: openCreateService,
    closeEntity: closeCreateService,
  } = useEntitySheet()

  // ── Unit detail sheet ────────────────────────────────────────────────────
  const {
    entityState: unitDetailSheet,
    openEntity: openUnitDetail,
    closeEntity: closeUnitDetail,
  } = useEntitySheet<AirconUnits>()

  // ── Archive ──────────────────────────────────────────────────────────────
  const [archiveTarget, setArchiveTarget] = useState<Service | null>(null)
  const [isArchivedView, setIsArchivedView] = useState(false)
  const { deleteService } = useServiceMutations()
  const { archivedQuery, restoreItem } = useArchive<Service>(
    "services/services/",
    "services",
    { filter: { client: clientId } },
    isArchivedView,
  )


  // ── Derived data ─────────────────────────────────────────────────────────
  const services: Service[] = useMemo(() => servicesData?.results ?? [], [servicesData])
  const salesTransactions: SalesTransaction[] = useMemo(() => salesData?.results ?? [], [salesData])
  const archivedServices: Service[] = archivedQuery.data?.results ?? []

  const airconUnits: AirconUnits[] = useMemo(() => unitsData?.results ?? [], [unitsData])

  const serviceRelatedTransactionIds = useMemo(
    () =>
      new Set(
        services
          .flatMap((s) => [s.related_transaction, s.related_sub_transaction])
          .filter((id): id is number => id != null),
      ),
    [services],
  )

  const standaloneSales = useMemo(
    () => salesTransactions.filter((t) => !serviceRelatedTransactionIds.has(t.id)),
    [salesTransactions, serviceRelatedTransactionIds],
  )

  const allPayments: (ServicePayment & {
    service_id: number
    service_type: string
    received_by_name?: string
  })[] = useMemo(() => {
    const list: (ServicePayment & { service_id: number; service_type: string; received_by_name?: string })[] = []
    services.forEach((service) => {
      service.payments?.forEach((payment) => {
        list.push({
          ...payment,
          service_id: service.id,
          service_type: service.service_type,
          received_by_name: (payment as unknown as Record<string, unknown>)
            .received_by_name as string | undefined,
        })
      })
    })
    return list.sort(
      (a, b) => new Date(b.payment_date).getTime() - new Date(a.payment_date).getTime(),
    )
  }, [services])

  // ── Summary stats ────────────────────────────────────────────────────────
  const totalServices = services.length

  const serviceRevenue = services.reduce((s, x) => s + parseFloat(x.total_revenue || "0"), 0)
  const serviceMainRev = services.reduce((s, x) => s + parseFloat(x.main_stall_revenue || "0"), 0)
  const serviceSubRev = services.reduce((s, x) => s + parseFloat(x.sub_stall_revenue || "0"), 0)
  const servicePaid = services.reduce((s, x) => s + parseFloat(x.total_paid || "0"), 0)
  const serviceBalance = services.reduce((s, x) => s + parseFloat(x.balance_due || "0"), 0)

  const salesRevenue = standaloneSales.reduce((s, t) => s + parseFloat(String(t.computed_total || "0")), 0)
  const salesPaid = standaloneSales.reduce((s, t) => {
    return s + (t.payments?.reduce((ps, p) => ps + parseFloat(String(p.amount || "0")), 0) || 0)
  }, 0)
  const salesBalance = salesRevenue - salesPaid
  const salesMainRev = standaloneSales
    .filter((t) => t.stall?.name?.toLowerCase().includes("main"))
    .reduce((s, t) => s + parseFloat(String(t.computed_total || "0")), 0)
  const salesSubRev = standaloneSales
    .filter((t) => t.stall?.name?.toLowerCase().includes("sub"))
    .reduce((s, t) => s + parseFloat(String(t.computed_total || "0")), 0)

  const totalRevenue = serviceRevenue + salesRevenue
  const totalPaid = servicePaid + salesPaid
  const totalBalance = serviceBalance + salesBalance
  const totalMainRev = serviceMainRev + salesMainRev
  const totalSubRev = serviceSubRev + salesSubRev

  // ── Handlers ─────────────────────────────────────────────────────────────
  const handleViewService = (service: Service) => {
    setSelectedService(service)
    setDetailsOpen(true)
  }
  const handleCloseDetails = () => {
    setDetailsOpen(false)
    setSelectedService(null)
  }

  // ── Filter functions (passed to LocalDataTable) ──────────────────────────
  const serviceFilterFn = (s: Service, q: string) =>
    String(s.id).includes(q) ||
    getServiceTypeLabel(s.service_type).toLowerCase().includes(q) ||
    getServiceModeLabel(s.service_mode).toLowerCase().includes(q) ||
    getServiceStatusLabel(s.status).toLowerCase().includes(q) ||
    (s.description ?? "").toLowerCase().includes(q)

  const salesFilterFn = (t: SalesTransaction, q: string) =>
    (t.manual_receipt_number ?? "").toLowerCase().includes(q) ||
    (t.stall?.name ?? "").toLowerCase().includes(q) ||
    (t.items?.some((i) => (i.item?.name ?? i.description ?? "").toLowerCase().includes(q)) ?? false)

  const paymentFilterFn = (p: PaymentRowType, q: string) =>
    String(p.service_id).includes(q) ||
    (paymentTypeLabels[p.payment_type] ?? p.payment_type).toLowerCase().includes(q) ||
    (p.received_by_name ?? "").toLowerCase().includes(q)

  const unitFilterFn = (u: AirconUnits, q: string) =>
    (u.serial_number ?? "").toLowerCase().includes(q) ||
    (u.outdoor_serial_number ?? "").toLowerCase().includes(q) ||
    (u.model?.brand?.name ?? "").toLowerCase().includes(q) ||
    (u.model?.name ?? "").toLowerCase().includes(q) ||
    (u.unit_status ?? "").toLowerCase().includes(q)

  // ── Column definitions ────────────────────────────────────────────────────
  const serviceColumns = useMemo<ColumnDef<Service>[]>(() => {
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
        header: "Type",
        enableSorting: false,
        cell: ({ row }) => (
          <div>
            <Badge variant="outline" className={`text-xs ${getServiceTypeBadgeClass(row.original.service_type)}`}>
              {getServiceTypeLabel(row.original.service_type)}
            </Badge>
            {row.original.description && (
              <p className="text-xs text-muted-foreground line-clamp-1 max-w-[180px] mt-0.5">
                {row.original.description}
              </p>
            )}
          </div>
        ),
      },
      {
        id: "mode",
        header: "Mode",
        enableSorting: false,
        meta: { thClass: "hidden sm:table-cell w-28", tdClass: "hidden sm:table-cell w-28" },
        cell: ({ row }) => (
          <Badge variant="outline" className="text-xs">
            {getServiceModeLabel(row.original.service_mode)}
          </Badge>
        ),
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
              <DropdownMenuItem onClick={() => handleViewService(row.original)}>
                <Wrench className="mr-2 h-4 w-4" />View Details
              </DropdownMenuItem>
              <DropdownMenuItem
                className="text-destructive"
                onClick={() => setArchiveTarget(row.original)}
              >
                <Archive className="mr-2 h-4 w-4" />Archive
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        ),
      })
    }
    return cols
  }, [canManage])

  const archivedServiceColumns = useMemo<ColumnDef<Service>[]>(() => [
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
      header: "Type",
      enableSorting: false,
      cell: ({ row }) => (
        <Badge variant="outline" className={`text-xs ${getServiceTypeBadgeClass(row.original.service_type)}`}>
          {getServiceTypeLabel(row.original.service_type)}
        </Badge>
      ),
    },
    {
      id: "mode",
      header: "Mode",
      enableSorting: false,
      meta: { thClass: "hidden sm:table-cell w-28", tdClass: "hidden sm:table-cell w-28" },
      cell: ({ row }) => (
        <Badge variant="outline" className="text-xs">
          {getServiceModeLabel(row.original.service_mode)}
        </Badge>
      ),
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
          onClick={() => restoreItem.mutate(row.original.id)}
        >
          <RotateCcw className="h-4 w-4" />
        </Button>
      ),
    },
  ], [restoreItem])

  const salesColumns = useMemo<ColumnDef<SalesTransaction>[]>(() => [
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
          <span className="text-xs text-muted-foreground">\u2014</span>
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
  ], [serviceRelatedTransactionIds])

  type PaymentRowType = ServicePayment & { service_id: number; service_type: string; received_by_name?: string }
  const paymentColumns = useMemo<ColumnDef<PaymentRowType>[]>(() => [
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
  ], [])

  const unitColumns = useMemo<ColumnDef<AirconUnits>[]>(() => [
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
  ], [])

  // ── Loading / not found ───────────────────────────────────────────────────
  if (clientLoading) {
    return (
      <Wrapper>
        <div className="space-y-4">
          <Skeleton className="h-10 w-48" />
          <Skeleton className="h-20 w-full" />
          <div className="grid grid-cols-6 gap-3">
            {Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-16" />)}
          </div>
          <Skeleton className="h-80 w-full" />
        </div>
      </Wrapper>
    )
  }

  if (!client) {
    return (
      <Wrapper>
        <div className="flex flex-col items-center justify-center py-20 gap-4">
          <p className="text-muted-foreground">Client not found</p>
          <Button variant="outline" onClick={() => router.push("/clients")}>
            <ArrowLeft className="mr-2 h-4 w-4" />Back to Clients
          </Button>
        </div>
      </Wrapper>
    )
  }

  const address = [client.address, client.barangay, client.city, client.province]
    .filter(Boolean)
    .join(", ")

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <Wrapper>
      <PageHeader
        icon={User}
        title={client.full_name}
        breadcrumbs={["Clients", { label: client.full_name }]}
        actionButton={
          <Button variant="outline" size="sm" onClick={() => router.push("/clients")}>
            <ArrowLeft className="mr-2 h-4 w-4" />Back
          </Button>
        }
      />

      {/* ── Client profile + Stats ── */}
      <div className="grid grid-cols-1 lg:grid-cols-[300px_1fr] gap-4">

        {/* Client Profile Card */}
        <Card>
          <CardContent className="space-y-4">
            {/* Avatar + Namea + blocklist badge */}
            <div className="flex items-center gap-3">
                {client.is_blocklisted && (
                  <Badge variant="destructive" className="gap-1 mt-1 text-xs">
                    <Ban className="h-3 w-3" />Blocklisted
                  </Badge>
                )}
            </div>
            {/* Per-row field list */}
            <div className="space-y-3 text-sm">
              {client.contact_number && (
                <div className="flex items-start gap-2.5">
                  <Phone className="h-4 w-4 shrink-0 text-muted-foreground mt-0.5" />
                  <div>
                    <p className="text-xs text-muted-foreground">Phone</p>
                    <p className="font-medium">{client.contact_number}</p>
                  </div>
                </div>
              )}
              {address && (
                <div className="flex items-start gap-2.5">
                  <MapPin className="h-4 w-4 shrink-0 text-muted-foreground mt-0.5" />
                  <div>
                    <p className="text-xs text-muted-foreground">Address</p>
                    <p className="font-medium">{address}</p>
                  </div>
                </div>
              )}
              {client.created_at && (
                <div className="flex items-start gap-2.5">
                  <Calendar className="h-4 w-4 shrink-0 text-muted-foreground mt-0.5" />
                  <div>
                    <p className="text-xs text-muted-foreground">Client Since</p>
                    <p className="font-medium">{formatDate(client.created_at)}</p>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Stats Grid — pairs (2 cols on all sizes) */}
        <div className="grid grid-cols-2 xl:grid-cols-3 gap-3 content-start">
          <StatCard icon={Wrench}     accent="blue"   label="Total Services"  value={totalServices} />
          <StatCard icon={Receipt}    accent="purple" label="Total Revenue"   value={formatCurrency(totalRevenue)} />
          <StatCard icon={Receipt}    accent="muted"  label="Main Stall"      value={formatCurrency(totalMainRev)} />
          <StatCard icon={Receipt}    accent="muted"  label="Sub Stall"       value={formatCurrency(totalSubRev)} />
          <StatCard icon={DollarSign} accent="green"  label="Total Paid"      value={formatCurrency(totalPaid)} valueClass="text-success" />
          <StatCard
            icon={Wallet}
            accent={totalBalance > 0 ? "red" : "muted"}
            label="Balance Due"
            value={formatCurrency(totalBalance)}
            valueClass={totalBalance > 0 ? "text-destructive" : "text-muted-foreground"}
          />
        </div>
      </div>

      {/* ── Tabs ── */}
      <Tabs defaultValue="services" className="space-y-4">
        <TabsList>
          <TabsTrigger value="services" className="gap-2">
            <Wrench className="h-4 w-4" />
            Services
            <Badge variant="outline" className="text-xs ml-1">{totalServices}</Badge>
          </TabsTrigger>
          <TabsTrigger value="sales" className="gap-2">
            <ShoppingCart className="h-4 w-4" />
            Sales
            <Badge variant="outline" className="text-xs ml-1">{salesTransactions.length}</Badge>
          </TabsTrigger>
          <TabsTrigger value="payments" className="gap-2">
            <CreditCard className="h-4 w-4" />
            Payments
            <Badge variant="outline" className="text-xs ml-1">{allPayments.length}</Badge>
          </TabsTrigger>
          <TabsTrigger value="units" className="gap-2">
            <Wind className="h-4 w-4" />
            Units
            <Badge variant="outline" className="text-xs ml-1">{airconUnits.length}</Badge>
          </TabsTrigger>
        </TabsList>

        {/* ════ Services Tab ════ */}
        <TabsContent value="services">
          <DataTable
              title={isArchivedView ? "Archived Services" : "Service History"}
              localData={isArchivedView ? archivedServices : services}
              columns={isArchivedView ? archivedServiceColumns : serviceColumns}
              isLoading={isArchivedView ? archivedQuery.isLoading : servicesLoading}
              filterFn={isArchivedView ? undefined : serviceFilterFn}
              hideSearch={isArchivedView}
              searchPlaceholder="Search services…"
              emptyTitle={
                isArchivedView
                  ? "No archived services for this client."
                  : "No services found for this client."
              }
              onRowClick={isArchivedView ? undefined : handleViewService}
              toolbar={
                <div className="flex items-center gap-2">
                  <ArchiveToggle
                    isArchived={isArchivedView}
                    onToggle={setIsArchivedView}
                    archivedCount={archivedQuery.data?.count}
                  />
                  {canManage && !isArchivedView && (
                    <Button size="sm" onClick={() => openCreateService()}>
                      <Plus className="mr-2 h-4 w-4" />New Service
                    </Button>
                  )}
                </div>
              }
            />
        </TabsContent>

        {/* ════ Sales Tab ════ */}
        <TabsContent value="sales">
          <DataTable
              title="Sales Transactions"
              localData={salesTransactions}
              columns={salesColumns}
              isLoading={salesLoading}
              filterFn={salesFilterFn}
              searchPlaceholder="Search OR #, items, stall…"
              emptyTitle="No sales transactions for this client."
              onRowClick={openSalesView}
            />
        </TabsContent>

        {/* ════ Payments Tab ════ */}
        <TabsContent value="payments">
          <DataTable
              title="Payment History"
              localData={allPayments as PaymentRowType[]}
              columns={paymentColumns}
              isLoading={servicesLoading}
              filterFn={paymentFilterFn}
              searchPlaceholder="Search service #, method…"
              emptyTitle="No payments found for this client."
              onRowClick={(payment) => {
                const svc = services.find((s) => s.id === payment.service_id)
                if (svc) handleViewService(svc)
              }}
            />
        </TabsContent>

        {/* ════ Units Tab ════ */}
        <TabsContent value="units">
          <DataTable
              title="Aircon Units"
              localData={airconUnits}
              columns={unitColumns}
              isLoading={unitsLoading}
              filterFn={unitFilterFn}
              searchPlaceholder="Search serial, model, brand…"
              emptyTitle="No aircon units found for this client."
              onRowClick={openUnitDetail}
            />
        </TabsContent>
      </Tabs>

      {/* ── Sheets & Dialogs ── */}

      {detailsOpen && selectedService && (
        <EntitySheet
          className="sm:min-w-4xl md:min-w-5xl xl:min-w-6xl"
          open={detailsOpen}
          onClose={handleCloseDetails}
          title={`Service SVC-${String(selectedService.id).padStart(4, "0")}`}
          description={`Created ${new Date(selectedService.created_at).toLocaleDateString("en-PH", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}`}
          entity={detailService}
          renderForm={() => (
            <ServiceDetail
              service={detailService || selectedService}
              onRefresh={async () => {
                await refetchService()
                await refetchServices()
              }}
            />
          )}
        />
      )}

      <EntitySheet<SalesTransaction>
        className="sm:min-w-2xl md:min-w-3xl xl:min-w-4xl"
        open={salesViewSheet.open}
        onClose={closeSalesView}
        entity={salesViewSheet.entity}
        title="Transaction Details"
        description="View detailed information about this sales transaction."
        renderForm={({ onClose, entity }) =>
          entity ? <SalesTransactionDetails entity={entity} onClose={onClose} /> : null
        }
      />

      <EntitySheet<AirconUnits>
        className="sm:min-w-2xl md:min-w-3xl xl:min-w-4xl"
        open={unitDetailSheet.open}
        onClose={closeUnitDetail}
        entity={unitDetailSheet.entity}
        title="Unit Details"
        description={unitDetailSheet.entity ? `${unitDetailSheet.entity.model?.brand?.name ?? ""} ${unitDetailSheet.entity.model?.name ?? ""} — SN: ${unitDetailSheet.entity.serial_number}` : ""}
        renderForm={({ onClose, entity }) =>
          entity ? <AirconUnitDetails unit={entity} onClose={onClose} /> : null
        }
      />

      <EntitySheet
        className="sm:min-w-2xl md:min-w-3xl xl:min-w-4xl"
        open={createServiceSheet.open}
        onClose={closeCreateService}
        title="Create New Service"
        description={`New service for ${client.full_name}`}
        entity={null}
        renderForm={({ onClose, forceClose }) => (
          <ServiceFormWizard
            onClose={onClose}
            forceClose={forceClose}
            defaultClientId={Number(clientId)}
          />
        )}
        withCloseConfirmation
      />

      <ConfirmDialog
        open={!!archiveTarget}
        onConfirm={() => {
          if (archiveTarget) {
            deleteService.mutate(archiveTarget.id, {
              onSuccess: () => {
                setArchiveTarget(null)
                refetchServices()
              },
            })
          }
        }}
        onCancel={() => setArchiveTarget(null)}
        title="Archive service?"
        description={`SVC-${String(archiveTarget?.id ?? 0).padStart(4, "0")} will be archived. You can restore it later.`}
        Icon={Archive}
        confirmText="Archive"
        variant="warning"
      />
    </Wrapper>
  )
}
