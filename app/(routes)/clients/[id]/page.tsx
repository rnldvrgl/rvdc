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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Skeleton } from "@/components/ui/skeleton"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import type { AirconUnits, SalesTransaction, Service } from "@/lib/constants/interface"
import { useCurrentUser } from "@/lib/hooks/useCurrentUser"
import { useEntitySheet } from "@/lib/hooks/useEntitySheet"
import { useClientMutations } from "@/lib/mutations/useClientMutations"
import { useClientFundDeposits } from "@/lib/queries/clients/useClients"
import { useService } from "@/lib/queries/services/useServices"
import { formatCurrency } from "@/lib/utils/currency"
import {
  Archive,
  ArrowLeft,
  Ban,
  Calendar,
  CreditCard,
  DollarSign,
  MapPin,
  Phone,
  Plus,
  Receipt,
  Shield,
  ShoppingCart,
  User,
  Wallet,
  Wind,
  Wrench,
} from "lucide-react"
import { useParams, useRouter } from "next/navigation"
import { useMemo, useState } from "react"
import { toast } from "sonner"
import {
  formatDate,
  fundDepositColumns,
  fundDepositFilterFn,
  getArchivedServiceColumns,
  getSalesColumns,
  getServiceColumns,
  getWarrantyClaimColumns,
  paymentColumns,
  paymentFilterFn,
  type PaymentRowType,
  salesFilterFn,
  serviceFilterFn,
  unitColumns,
  unitFilterFn,
  warrantyFilterFn,
} from "./columns"
import { StatCard } from "./StatCard"
import { useClientDetailData } from "./useClientDetailData"

// ─────────────────────────────────────────────────────────────────────────────

export default function ClientDetailPage() {
  const params = useParams()
  const router = useRouter()
  const clientId = params.id as string
  const { canManage } = useCurrentUser()
  const { addClientFundDeposit } = useClientMutations()

  // ── Data ─────────────────────────────────────────────────────────────────
  const {
    client,
    clientLoading,
    services,
    servicesLoading,
    refetchServices,
    salesTransactions,
    salesLoading,
    airconUnits,
    unitsLoading,
    allPayments,
    serviceRelatedTransactionIds,
    isArchivedView,
    setIsArchivedView,
    archivedServices,
    archivedQuery,
    restoreItem,
    deleteService,
    stats,
  } = useClientDetailData(clientId)
  const { data: fundDeposits = [], isLoading: fundDepositsLoading } =
    useClientFundDeposits(clientId)

  const [fundDialogOpen, setFundDialogOpen] = useState(false)
  const [fundAmount, setFundAmount] = useState("")
  const [fundPaymentMethod, setFundPaymentMethod] = useState<
    "cash" | "gcash" | "debit" | "credit" | "cheque"
  >("cash")
  const [fundNotes, setFundNotes] = useState("")

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

  // ── Archive confirm target ───────────────────────────────────────────────
  const [archiveTarget, setArchiveTarget] = useState<Service | null>(null)

  // ── Handlers ─────────────────────────────────────────────────────────────
  const handleViewService = (service: Service) => {
    setSelectedService(service)
    setDetailsOpen(true)
  }
  const handleCloseDetails = () => {
    setDetailsOpen(false)
    setSelectedService(null)
  }

  const handleAddFundDeposit = () => {
    const amount = parseFloat(fundAmount)
    if (isNaN(amount) || amount <= 0) {
      toast.error("Please enter a valid fund amount.")
      return
    }

    addClientFundDeposit.mutate(
      {
        id: Number(clientId),
        data: {
          amount,
          payment_method: fundPaymentMethod,
          notes: fundNotes || undefined,
          deposit_date: new Date().toISOString(),
        },
      },
      {
        onSuccess: () => {
          setFundDialogOpen(false)
          setFundAmount("")
          setFundPaymentMethod("cash")
          setFundNotes("")
        },
      },
    )
  }

  // ── Column definitions ────────────────────────────────────────────────────
  const serviceColumns = useMemo(
    () => getServiceColumns({ canManage, onViewService: handleViewService, onArchiveService: setArchiveTarget }),
    [canManage],
  )
  const archivedServiceColumns = useMemo(
    () => getArchivedServiceColumns((id) => restoreItem.mutate(id)),
    [restoreItem],
  )
  const salesColumns = useMemo(
    () => getSalesColumns(serviceRelatedTransactionIds),
    [serviceRelatedTransactionIds],
  )

  // ── Warranty claims (derived from services) ────────────────────────────
  const warrantyClaims = useMemo(
    () => services.filter((s) => s.is_complementary && (s.complementary_reason ?? "").toLowerCase().includes("warranty")),
    [services],
  )
  const warrantyClaimColumns = useMemo(
    () => getWarrantyClaimColumns(),
    [],
  )

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
            {/* Avatar + Name + blocklist badge */}
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
              <div className="flex items-start gap-2.5">
                <Wallet className="h-4 w-4 shrink-0 text-muted-foreground mt-0.5" />
                <div>
                  <p className="text-xs text-muted-foreground">Client Fund Balance</p>
                  <p className="font-semibold text-emerald-600">
                    {formatCurrency(parseFloat(client.fund_balance || "0"))}
                  </p>
                </div>
              </div>
            </div>

            {canManage && (
              <Button className="w-full" size="sm" onClick={() => setFundDialogOpen(true)}>
                <Plus className="mr-2 h-4 w-4" />
                Add Client Fund
              </Button>
            )}

            <div className="space-y-2">
              <p className="text-xs text-muted-foreground">Recent Fund Deposits</p>
              <div className="max-h-48 overflow-auto space-y-2 pr-1">
                {fundDepositsLoading ? (
                  <p className="text-xs text-muted-foreground">Loading deposits...</p>
                ) : fundDeposits.length === 0 ? (
                  <p className="text-xs text-muted-foreground">No fund deposits yet.</p>
                ) : (
                  fundDeposits.slice(0, 5).map((deposit) => (
                    <div key={deposit.id} className="rounded-md border p-2">
                      <div className="flex items-center justify-between gap-2 text-xs">
                        <span className="font-medium">
                          {formatCurrency(parseFloat(deposit.amount || "0"))}
                        </span>
                        <Badge variant="outline" className="text-[10px] capitalize">
                          {deposit.payment_method_display || deposit.payment_method}
                        </Badge>
                      </div>
                      <p className="text-[11px] text-muted-foreground mt-1">
                        {new Date(deposit.deposit_date).toLocaleString("en-PH")}
                      </p>
                    </div>
                  ))
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Stats Grid — pairs (2 cols on all sizes) */}
        <div className="grid grid-cols-2 xl:grid-cols-3 gap-3 content-start">
          <StatCard icon={Wrench}     accent="blue"   label="Total Services"  value={stats.totalServices} />
          <StatCard icon={Receipt}    accent="purple" label="Total Revenue"   value={formatCurrency(stats.totalRevenue)} />
          <StatCard icon={Receipt}    accent="muted"  label="Main Stall"      value={formatCurrency(stats.totalMainRev)} />
          <StatCard icon={Receipt}    accent="muted"  label="Sub Stall"       value={formatCurrency(stats.totalSubRev)} />
          <StatCard icon={DollarSign} accent="green"  label="Total Paid"      value={formatCurrency(stats.totalPaid)} valueClass="text-success" />
          <StatCard
            icon={Wallet}
            accent={stats.totalBalance > 0 ? "red" : "muted"}
            label="Balance Due"
            value={formatCurrency(stats.totalBalance)}
            valueClass={stats.totalBalance > 0 ? "text-destructive" : "text-muted-foreground"}
          />
        </div>
      </div>

      {/* ── Tabs ── */}
      <Tabs defaultValue="services" className="space-y-4">
        <TabsList>
          <TabsTrigger value="services" className="gap-2">
            <Wrench className="h-4 w-4" />
            Services
            <Badge variant="outline" className="text-xs ml-1">{stats.totalServices}</Badge>
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
          <TabsTrigger value="funds" className="gap-2">
            <Wallet className="h-4 w-4" />
            Client Funds
            <Badge variant="outline" className="text-xs ml-1">{fundDeposits.length}</Badge>
          </TabsTrigger>
          <TabsTrigger value="units" className="gap-2">
            <Wind className="h-4 w-4" />
            Units
            <Badge variant="outline" className="text-xs ml-1">{airconUnits.length}</Badge>
          </TabsTrigger>
          {warrantyClaims.length > 0 && (
            <TabsTrigger value="warranty" className="gap-2">
              <Shield className="h-4 w-4" />
              Warranty
              <Badge variant="outline" className="text-xs ml-1">{warrantyClaims.length}</Badge>
            </TabsTrigger>
          )}
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

        {/* ════ Client Funds Tab ════ */}
        <TabsContent value="funds">
          <DataTable
            title="Client Fund Deposits"
            localData={fundDeposits}
            columns={fundDepositColumns}
            isLoading={fundDepositsLoading}
            filterFn={fundDepositFilterFn}
            searchPlaceholder="Search method, notes, recorded by..."
            emptyTitle="No fund deposits found for this client."
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

        {/* ════ Warranty Claims Tab ════ */}
        {warrantyClaims.length > 0 && (
          <TabsContent value="warranty">
            <DataTable
              title="Warranty Claims"
              localData={warrantyClaims}
              columns={warrantyClaimColumns}
              isLoading={servicesLoading}
              filterFn={warrantyFilterFn}
              searchPlaceholder="Search service #, brand, model…"
              emptyTitle="No warranty claims for this client."
              onRowClick={handleViewService}
            />
          </TabsContent>
        )}
      </Tabs>

      <Dialog open={fundDialogOpen} onOpenChange={setFundDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Client Fund</DialogTitle>
            <DialogDescription>
              Record a deposit to this client&apos;s fund balance.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div className="space-y-2">
              <Label htmlFor="fund-amount">Amount</Label>
              <Input
                id="fund-amount"
                type="number"
                min="0"
                step="0.01"
                value={fundAmount}
                onChange={(e) => setFundAmount(e.target.value)}
                placeholder="0.00"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="fund-method">Payment Method</Label>
              <select
                id="fund-method"
                aria-label="Fund payment method"
                className="w-full rounded-md border bg-background px-3 py-2 text-sm"
                value={fundPaymentMethod}
                onChange={(e) =>
                  setFundPaymentMethod(
                    e.target.value as "cash" | "gcash" | "debit" | "credit" | "cheque",
                  )
                }
              >
                <option value="cash">Cash</option>
                <option value="gcash">GCash</option>
                <option value="debit">Debit</option>
                <option value="credit">Credit</option>
                <option value="cheque">Cheque</option>
              </select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="fund-notes">Notes (optional)</Label>
              <Input
                id="fund-notes"
                value={fundNotes}
                onChange={(e) => setFundNotes(e.target.value)}
                placeholder="e.g., Downpayment for future service"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setFundDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleAddFundDeposit}>
              Save Fund Deposit
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

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
