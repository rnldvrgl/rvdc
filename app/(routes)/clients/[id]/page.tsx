"use client"

import { ArchiveToggle } from "@/components/custom/shared/ArchiveToggle"
import { ConfirmDialog } from "@/components/custom/shared/ConfirmDialog"
import EntitySheet from "@/components/custom/shared/EntitySheet"
import PageHeader from "@/components/custom/shared/PageHeader"
import { Wrapper } from "@/components/custom/shared/Wrapper"
import { SalesTransactionDetails } from "@/components/details/SalesTransactionDetails"
import ServiceFormWizard from "@/components/forms/ServiceFormWizard"
import ServiceDetail from "@/components/services/ServiceDetail"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Skeleton } from "@/components/ui/skeleton"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import type {
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
import { formatCurrency } from "@/lib/utils/currency"
import { getBadgeVariant } from "@/lib/utils/helpers"
import {
    getServiceModeLabel,
    getServiceStatusLabel,
    getServiceTypeBadgeClass,
    getServiceTypeLabel,
} from "@/lib/utils/helpers/service"
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
    Wrench,
} from "lucide-react"
import { useParams, useRouter } from "next/navigation"
import { useState } from "react"

const paymentStatusLabels: Record<string, string> = {
  unpaid: "Unpaid",
  partial: "Partially Paid",
  paid: "Paid",
  refunded: "Refunded",
  "n/a": "N/A",
}

const paymentTypeLabels: Record<string, string> = {
  cash: "Cash",
  gcash: "GCash",
  credit: "Credit Card",
  debit: "Debit Card",
  cheque: "Cheque",
}

function formatDate(dateStr: string) {
  try {
    return format(new Date(dateStr), "MMM dd, yyyy")
  } catch {
    return dateStr
  }
}

function formatDateTime(dateStr: string) {
  try {
    return format(new Date(dateStr), "MMM dd, yyyy hh:mm a")
  } catch {
    return dateStr
  }
}

function getInitials(name: string) {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2)
}

export default function ClientDetailPage() {
  const params = useParams()
  const router = useRouter()
  const clientId = params.id as string
  const { role } = useCurrentUser()
  const canManageServices = role === "admin" || role === "manager"

  const { data: client, isLoading: clientLoading } = useClient(clientId)
  const {
    data: servicesData,
    isLoading: servicesLoading,
    refetch: refetchServices,
  } = useServices({
    filter: { client: clientId },
    limit: 100,
  })

  const { data: salesData, isLoading: salesLoading } = useSalesTransactions({
    filter: { client: clientId },
    limit: 100,
  })

  // Service detail sheet state
  const [selectedService, setSelectedService] = useState<Service | null>(null)
  const [detailsOpen, setDetailsOpen] = useState(false)
  const { data: detailService, refetch: refetchService } = useService(
    selectedService?.id,
  )

  // Sales transaction detail sheet state
  const {
    entityState: salesViewSheet,
    openEntity: openSalesView,
    closeEntity: closeSalesView,
  } = useEntitySheet<SalesTransaction>()

  // Service management state
  const {
    entityState: createServiceSheet,
    openEntity: openCreateService,
    closeEntity: closeCreateService,
  } = useEntitySheet()
  const [archiveTarget, setArchiveTarget] = useState<Service | null>(null)
  const [isArchivedView, setIsArchivedView] = useState(false)
  const { deleteService } = useServiceMutations()
  const { archivedQuery, restoreItem } = useArchive<Service>(
    "services/services/",
    "services",
    { filter: { client: clientId }, limit: 100 },
    isArchivedView,
  )

  const archivedServices = archivedQuery.data?.results ?? []

  const services = servicesData?.results ?? []
  const salesTransactions = salesData?.results ?? []

  // Collect all related_transaction IDs from services to exclude from standalone sales
  const serviceRelatedTransactionIds = new Set(
    services
      .flatMap((s: Service) => [
        s.related_transaction,
        s.related_sub_transaction,
      ])
      .filter((id): id is number => id != null),
  )

  // Filter out sales transactions that belong to services
  const standaloneSalesTransactions = salesTransactions.filter(
    (t: SalesTransaction) => !serviceRelatedTransactionIds.has(t.id),
  )

  // Collect all payments from all services
  const allPayments: (ServicePayment & {
    service_id: number
    service_type: string
    received_by_name?: string
  })[] = []
  services.forEach((service: Service) => {
    service.payments?.forEach((payment) => {
      allPayments.push({
        ...payment,
        service_id: service.id,
        service_type: service.service_type,
        received_by_name: (payment as unknown as Record<string, unknown>)
          .received_by_name as string | undefined,
      })
    })
  })
  allPayments.sort(
    (a, b) =>
      new Date(b.payment_date).getTime() - new Date(a.payment_date).getTime(),
  )

  // Summary stats (Services)
  const totalServices = services.length
  const serviceRevenue = services.reduce(
    (sum: number, s: Service) => sum + parseFloat(s.total_revenue || "0"),
    0,
  )
  const serviceMainRevenue = services.reduce(
    (sum: number, s: Service) => sum + parseFloat(s.main_stall_revenue || "0"),
    0,
  )
  const serviceSubRevenue = services.reduce(
    (sum: number, s: Service) => sum + parseFloat(s.sub_stall_revenue || "0"),
    0,
  )
  const servicePaid = services.reduce(
    (sum: number, s: Service) => sum + parseFloat(s.total_paid || "0"),
    0,
  )
  const serviceBalance = services.reduce(
    (sum: number, s: Service) => sum + parseFloat(s.balance_due || "0"),
    0,
  )

  // Summary stats (Sales) - using only standalone sales, excluding service-related transactions
  const salesRevenue = standaloneSalesTransactions.reduce(
    (sum: number, t: SalesTransaction) =>
      sum + parseFloat(String(t.computed_total || "0")),
    0,
  )
  const salesPaid = standaloneSalesTransactions.reduce(
    (sum: number, t: SalesTransaction) => {
      const paid =
        t.payments?.reduce(
          (pSum, p) => pSum + parseFloat(String(p.amount || "0")),
          0,
        ) || 0
      return sum + paid
    },
    0,
  )
  const salesBalance = salesRevenue - salesPaid

  // Standalone sales stall breakdown
  const salesMainRevenue = standaloneSalesTransactions
    .filter((t) => t.stall?.name?.toLowerCase().includes("main"))
    .reduce(
      (sum: number, t: SalesTransaction) =>
        sum + parseFloat(String(t.computed_total || "0")),
      0,
    )
  const salesSubRevenue = standaloneSalesTransactions
    .filter((t) => t.stall?.name?.toLowerCase().includes("sub"))
    .reduce(
      (sum: number, t: SalesTransaction) =>
        sum + parseFloat(String(t.computed_total || "0")),
      0,
    )

  // Combined totals
  const totalRevenue = serviceRevenue + salesRevenue
  const totalPaid = servicePaid + salesPaid
  const totalBalance = serviceBalance + salesBalance
  const totalMainRevenue = serviceMainRevenue + salesMainRevenue
  const totalSubRevenue = serviceSubRevenue + salesSubRevenue

  const handleViewService = (service: Service) => {
    setSelectedService(service)
    setDetailsOpen(true)
  }

  const handleCloseDetails = () => {
    setDetailsOpen(false)
    setSelectedService(null)
  }

  if (clientLoading) {
    return (
      <Wrapper>
        <div className="space-y-6">
          <Skeleton className="h-10 w-48" />
          <Skeleton className="h-32 w-full" />
          <Skeleton className="h-64 w-full" />
        </div>
      </Wrapper>
    )
  }

  if (!client) {
    return (
      <Wrapper>
        <div className="flex flex-col items-center justify-center py-20 space-y-4">
          <p className="text-muted-foreground">Client not found</p>
          <Button
            variant="outline"
            onClick={() => router.push("/clients")}
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Clients
          </Button>
        </div>
      </Wrapper>
    )
  }

  const address = [
    client.address,
    client.barangay,
    client.city,
    client.province,
  ]
    .filter(Boolean)
    .join(", ")

  return (
    <Wrapper>
      <PageHeader
        icon={User}
        title={client.full_name}
        breadcrumbs={["Clients", { label: client.full_name }]}
        actionButton={
          <Button
            variant="outline"
            size="sm"
            onClick={() => router.push("/clients")}
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Button>
        }
      />

      {/* Client Details */}
      <Card>
        <CardContent className="flex items-start gap-4">
          <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary text-xl font-bold">
            {getInitials(client.full_name)}
          </div>
          <div className="flex flex-col gap-1.5 text-sm text-muted-foreground">
            {client.is_blocklisted && (
              <Badge
                variant="destructive"
                className="gap-1 w-fit"
              >
                <Ban className="h-3 w-3" />
                Blocklisted
              </Badge>
            )}
            {client.contact_number && (
              <span className="flex items-center gap-1.5">
                <Phone className="h-3.5 w-3.5 shrink-0" />
                {client.contact_number}
              </span>
            )}
            {address && (
              <span className="flex items-center gap-1.5">
                <MapPin className="h-3.5 w-3.5 shrink-0" />
                {address}
              </span>
            )}
            {client.created_at && (
              <span className="flex items-center gap-1.5">
                <Calendar className="h-3.5 w-3.5 shrink-0" />
                Client since {formatDate(client.created_at)}
              </span>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <Card>
          <CardContent className="flex items-center gap-3 p-4">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-blue-500/10">
              <Wrench className="h-4 w-4 text-blue-500" />
            </div>
            <div className="min-w-0">
              <p className="text-xs text-muted-foreground">Services</p>
              <p className="text-lg font-semibold leading-none truncate">
                {totalServices}
              </p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-3 p-4">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-purple-500/10">
              <Receipt className="h-4 w-4 text-purple-500" />
            </div>
            <div className="min-w-0">
              <p className="text-xs text-muted-foreground">Revenue</p>
              <p className="text-lg font-semibold leading-none truncate">
                {formatCurrency(totalRevenue)}
              </p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground mb-1">Main Stall</p>
            <p className="text-base font-semibold leading-none truncate">
              {formatCurrency(totalMainRevenue)}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground mb-1">Sub Stall</p>
            <p className="text-base font-semibold leading-none truncate">
              {formatCurrency(totalSubRevenue)}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-3 p-4">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-green-500/10">
              <DollarSign className="h-4 w-4 text-success" />
            </div>
            <div className="min-w-0">
              <p className="text-xs text-muted-foreground">Paid</p>
              <p className="text-lg font-semibold leading-none truncate text-success">
                {formatCurrency(totalPaid)}
              </p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-3 p-4">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-red-500/10">
              <Wallet className="h-4 w-4 text-destructive" />
            </div>
            <div className="min-w-0">
              <p className="text-xs text-muted-foreground">Balance</p>
              <p
                className={`text-lg font-semibold leading-none truncate ${totalBalance > 0 ? "text-destructive" : "text-muted-foreground"}`}
              >
                {formatCurrency(totalBalance)}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Services, Sales & Payments Tabs */}
      <Tabs
        defaultValue="services"
        className="space-y-4"
      >
        <TabsList>
          <TabsTrigger
            value="services"
            className="gap-2"
          >
            <Wrench className="h-4 w-4" />
            Services ({totalServices})
          </TabsTrigger>
          <TabsTrigger
            value="sales"
            className="gap-2"
          >
            <ShoppingCart className="h-4 w-4" />
            Sales ({salesTransactions.length})
          </TabsTrigger>
          <TabsTrigger
            value="payments"
            className="gap-2"
          >
            <CreditCard className="h-4 w-4" />
            Payments ({allPayments.length})
          </TabsTrigger>
        </TabsList>

        {/* Services Tab */}
        <TabsContent value="services">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0">
              <div>
                <CardTitle className="text-base">Service History</CardTitle>
                <CardDescription>
                  {isArchivedView
                    ? "Archived services for this client"
                    : "All services requested by this client"}
                </CardDescription>
              </div>
              <div className="flex items-center gap-2">
                <ArchiveToggle
                  isArchived={isArchivedView}
                  onToggle={setIsArchivedView}
                  archivedCount={archivedQuery.data?.count}
                />
                {canManageServices && !isArchivedView && (
                  <Button
                    size="sm"
                    onClick={() => openCreateService()}
                  >
                    <Plus className="mr-2 h-4 w-4" />
                    New Service
                  </Button>
                )}
              </div>
            </CardHeader>
            <CardContent className="px-2 pb-2 pt-0">
              {isArchivedView ? (
                archivedQuery.isLoading ? (
                  <div className="space-y-3 p-4">
                    {[1, 2, 3].map((i) => (
                      <Skeleton
                        key={i}
                        className="h-10 w-full"
                      />
                    ))}
                  </div>
                ) : archivedServices.length === 0 ? (
                  <div className="py-12 text-center text-muted-foreground">
                    No archived services for this client.
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-20">ID</TableHead>
                        <TableHead>Type</TableHead>
                        <TableHead className="hidden sm:table-cell">
                          Mode
                        </TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="hidden md:table-cell">
                          Date
                        </TableHead>
                        <TableHead className="text-right">Total</TableHead>
                        <TableHead className="w-10" />
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {archivedServices.map((service: Service) => (
                        <TableRow key={service.id}>
                          <TableCell className="font-medium">
                            #{String(service.id).padStart(4, "0")}
                          </TableCell>
                          <TableCell>
                            <Badge
                              variant="outline"
                              className={`text-xs ${getServiceTypeBadgeClass(service.service_type)}`}
                            >
                              {getServiceTypeLabel(service.service_type)}
                            </Badge>
                          </TableCell>
                          <TableCell className="hidden sm:table-cell">
                            <Badge
                              variant="outline"
                              className="text-xs"
                            >
                              {getServiceModeLabel(service.service_mode)}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Badge
                              variant={getBadgeVariant(service.status)}
                              className="text-xs"
                            >
                              {getServiceStatusLabel(service.status)}
                            </Badge>
                          </TableCell>
                          <TableCell className="hidden md:table-cell text-muted-foreground text-sm">
                            {formatDate(service.created_at)}
                          </TableCell>
                          <TableCell className="text-right font-medium">
                            {formatCurrency(service.total_revenue)}
                          </TableCell>
                          <TableCell>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="size-8"
                              onClick={() => restoreItem.mutate(service.id)}
                            >
                              <RotateCcw className="h-4 w-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )
              ) : servicesLoading ? (
                <div className="space-y-3 p-4">
                  {[1, 2, 3].map((i) => (
                    <Skeleton
                      key={i}
                      className="h-10 w-full"
                    />
                  ))}
                </div>
              ) : services.length === 0 ? (
                <div className="py-12 text-center text-muted-foreground">
                  No services found for this client.
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-20">ID</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead className="hidden sm:table-cell">
                        Mode
                      </TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="hidden md:table-cell">
                        Date
                      </TableHead>
                      <TableHead className="hidden lg:table-cell text-right">
                        Main
                      </TableHead>
                      <TableHead className="hidden lg:table-cell text-right">
                        Sub
                      </TableHead>
                      <TableHead className="text-right">Total</TableHead>
                      <TableHead className="text-right">Payment</TableHead>
                      {canManageServices && <TableHead className="w-10" />}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {services.map((service: Service) => (
                      <TableRow
                        key={service.id}
                        className="cursor-pointer"
                        onClick={() => handleViewService(service)}
                      >
                        <TableCell className="font-medium">
                          #{String(service.id).padStart(4, "0")}
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant="outline"
                            className={`text-xs ${getServiceTypeBadgeClass(service.service_type)}`}
                          >
                            {getServiceTypeLabel(service.service_type)}
                          </Badge>
                          {service.description && (
                            <p className="text-xs text-muted-foreground line-clamp-1 max-w-[200px] mt-1">
                              {service.description}
                            </p>
                          )}
                        </TableCell>
                        <TableCell className="hidden sm:table-cell">
                          <Badge
                            variant="outline"
                            className="text-xs"
                          >
                            {getServiceModeLabel(service.service_mode)}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant={getBadgeVariant(service.status)}
                            className="text-xs"
                          >
                            {getServiceStatusLabel(service.status)}
                          </Badge>
                        </TableCell>
                        <TableCell className="hidden md:table-cell text-muted-foreground text-sm">
                          {formatDate(service.created_at)}
                        </TableCell>
                        <TableCell className="hidden lg:table-cell text-right text-sm text-muted-foreground">
                          {Number(service.main_stall_revenue) > 0
                            ? formatCurrency(service.main_stall_revenue)
                            : "—"}
                        </TableCell>
                        <TableCell className="hidden lg:table-cell text-right text-sm text-muted-foreground">
                          {Number(service.sub_stall_revenue) > 0
                            ? formatCurrency(service.sub_stall_revenue)
                            : "—"}
                        </TableCell>
                        <TableCell className="text-right font-medium">
                          {formatCurrency(service.total_revenue)}
                        </TableCell>
                        <TableCell className="text-right">
                          <Badge
                            variant={getBadgeVariant(service.payment_status)}
                            className="text-xs"
                          >
                            {paymentStatusLabels[service.payment_status] ||
                              service.payment_status}
                          </Badge>
                        </TableCell>
                        {canManageServices && (
                          <TableCell>
                            <DropdownMenu>
                              <DropdownMenuTrigger
                                asChild
                                onClick={(e) => e.stopPropagation()}
                              >
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="size-8"
                                >
                                  <MoreHorizontal className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent
                                align="end"
                                onClick={(e) => e.stopPropagation()}
                              >
                                <DropdownMenuItem
                                  onClick={() => handleViewService(service)}
                                >
                                  <Wrench className="mr-2 h-4 w-4" />
                                  View Details
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  className="text-destructive"
                                  onClick={() => setArchiveTarget(service)}
                                >
                                  <Archive className="mr-2 h-4 w-4" />
                                  Archive
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </TableCell>
                        )}
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Sales Tab */}
        <TabsContent value="sales">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Sales Transactions</CardTitle>
              <CardDescription>
                All sales transactions across main and sub stall
              </CardDescription>
            </CardHeader>
            <CardContent className="px-2 pb-2 pt-0">
              {salesLoading ? (
                <div className="space-y-3 p-4">
                  {[1, 2, 3].map((i) => (
                    <Skeleton
                      key={i}
                      className="h-10 w-full"
                    />
                  ))}
                </div>
              ) : salesTransactions.length === 0 ? (
                <div className="py-12 text-center text-muted-foreground">
                  No sales transactions found for this client.
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-28">Official Receipt #</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead>Items</TableHead>
                      <TableHead className="hidden md:table-cell">
                        Stall
                      </TableHead>
                      <TableHead className="hidden sm:table-cell">
                        Source
                      </TableHead>
                      <TableHead className="text-right">Amount</TableHead>
                      <TableHead className="text-right">Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {salesTransactions.map((transaction: SalesTransaction) => {
                      const itemCount = transaction.items?.length || 0
                      const totalItems =
                        transaction.items?.reduce(
                          (sum, item) =>
                            sum + parseFloat(String(item.quantity)),
                          0,
                        ) || 0
                      const isServiceRelated = serviceRelatedTransactionIds.has(
                        transaction.id,
                      )

                      return (
                        <TableRow
                          key={transaction.id}
                          className="cursor-pointer"
                          onClick={() => openSalesView(transaction)}
                        >
                          <TableCell className="font-medium">
                            {transaction.manual_receipt_number ||
                              transaction.system_receipt_number
                                ?.slice(0, 8)
                                .toUpperCase()}
                          </TableCell>
                          <TableCell className="text-sm text-muted-foreground">
                            {formatDate(transaction.created_at)}
                          </TableCell>
                          <TableCell>
                            <div className="text-sm">
                              <span className="font-medium">
                                {itemCount} item{itemCount !== 1 ? "s" : ""}
                              </span>
                              <span className="text-muted-foreground">
                                {" "}
                                ({totalItems} qty)
                              </span>
                            </div>
                            {transaction.items &&
                              transaction.items.length > 0 && (
                                <p className="text-xs text-muted-foreground line-clamp-1 max-w-[200px] mt-0.5">
                                  {transaction.items
                                    .map((item) => {
                                      const qty = parseFloat(
                                        String(item.quantity),
                                      )
                                      const qtyDisplay =
                                        qty % 1 === 0 ? qty.toFixed(0) : qty
                                      return `${item.item?.name ?? item.description} (x${qtyDisplay})`
                                    })
                                    .join(", ")}
                                </p>
                              )}
                          </TableCell>
                          <TableCell className="hidden md:table-cell text-sm text-muted-foreground">
                            {transaction.stall?.name || "—"}
                          </TableCell>
                          <TableCell className="hidden sm:table-cell">
                            <Badge
                              variant="outline"
                              className={`text-xs ${isServiceRelated ? "border-blue-500/30 text-blue-600 dark:text-blue-400" : ""}`}
                            >
                              {isServiceRelated ? "Service" : "Walk-in"}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right font-medium">
                            {formatCurrency(transaction.computed_total || 0)}
                          </TableCell>
                          <TableCell className="text-right">
                            <Badge
                              variant={getBadgeVariant(
                                transaction.payment_status,
                              )}
                              className="text-xs"
                            >
                              {paymentStatusLabels[
                                transaction.payment_status
                              ] || transaction.payment_status}
                            </Badge>
                          </TableCell>
                        </TableRow>
                      )
                    })}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Payments Tab */}
        <TabsContent value="payments">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Payment History</CardTitle>
              <CardDescription>
                All payments across all services
              </CardDescription>
            </CardHeader>
            <CardContent className="px-2 pb-2 pt-0">
              {servicesLoading ? (
                <div className="space-y-3 p-4">
                  {[1, 2, 3].map((i) => (
                    <Skeleton
                      key={i}
                      className="h-10 w-full"
                    />
                  ))}
                </div>
              ) : allPayments.length === 0 ? (
                <div className="py-12 text-center text-muted-foreground">
                  No payments found for this client.
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>Service</TableHead>
                      <TableHead className="hidden sm:table-cell">
                        Method
                      </TableHead>
                      <TableHead className="hidden md:table-cell">
                        Received By
                      </TableHead>
                      <TableHead className="text-right">Amount</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {allPayments.map((payment) => (
                      <TableRow
                        key={payment.id}
                        className="cursor-pointer"
                        onClick={() => {
                          const svc = services.find(
                            (s: Service) => s.id === payment.service_id,
                          )
                          if (svc) handleViewService(svc)
                        }}
                      >
                        <TableCell className="text-sm">
                          {formatDateTime(payment.payment_date)}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <span className="font-medium text-sm">
                              #{String(payment.service_id).padStart(4, "0")}
                            </span>
                            <Badge
                              variant="outline"
                              className={`text-xs ${getServiceTypeBadgeClass(payment.service_type)}`}
                            >
                              {getServiceTypeLabel(payment.service_type)}
                            </Badge>
                          </div>
                        </TableCell>
                        <TableCell className="hidden sm:table-cell">
                          <Badge
                            variant="outline"
                            className="text-xs"
                          >
                            {paymentTypeLabels[payment.payment_type] ||
                              payment.payment_type}
                          </Badge>
                        </TableCell>
                        <TableCell className="hidden md:table-cell text-sm text-muted-foreground">
                          {payment.received_by_name || "—"}
                        </TableCell>
                        <TableCell className="text-right font-semibold text-success">
                          {formatCurrency(payment.amount)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Service Detail Sheet */}
      {detailsOpen && selectedService && (
        <EntitySheet
          className="sm:min-w-4xl md:min-w-5xl xl:min-w-6xl"
          open={detailsOpen}
          onClose={handleCloseDetails}
          title={`Service #${String(selectedService.id).padStart(4, "0")}`}
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

      {/* Sales Transaction Detail Sheet */}
      <EntitySheet<SalesTransaction>
        className="sm:min-w-2xl md:min-w-3xl xl:min-w-4xl"
        open={salesViewSheet.open}
        onClose={closeSalesView}
        entity={salesViewSheet.entity}
        title="Transaction Details"
        description="View detailed information about this sales transaction."
        renderForm={({ onClose, entity }) =>
          entity ? (
            <SalesTransactionDetails
              entity={entity}
              onClose={onClose}
            />
          ) : null
        }
      />

      {/* Create Service Sheet */}
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

      {/* Archive Confirm Dialog */}
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
        description={`Service #${String(archiveTarget?.id ?? 0).padStart(4, "0")} will be archived. You can restore it later.`}
        Icon={Archive}
        confirmText="Archive"
        variant="warning"
      />
    </Wrapper>
  )
}
