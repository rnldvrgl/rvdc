"use client"

import DateRangePicker from "@/components/custom/inputs/DateRangePicker"
import PageHeader from "@/components/custom/shared/PageHeader"
import { Wrapper } from "@/components/custom/shared/Wrapper"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useDateParamsFromForm } from "@/lib/hooks/useDateParamsFromForm"
import {
  useCashFlow,
  useGetSummary,
  useTopClients,
  useTopSellingItems,
} from "@/lib/queries/analytics/useGetAnalytics"
import { useStalls } from "@/lib/queries/inventory/useStalls"
import { useSalesTransactions } from "@/lib/queries/sales/useSalesTransactions"
import { useServices } from "@/lib/queries/services/useServices"
import { useExpenses } from "@/lib/queries/useExpenses"
import { ExportColumn, exportToCSV } from "@/lib/utils/export"

import { formatDate } from "@/lib/utils/helpers/date"
import {
  CreditCard,
  DollarSign,
  Download,
  FileSpreadsheet,
  Package,
  ShoppingCart,
  Store,
  TrendingDown,
  TrendingUp,
  Users,
  Wrench,
} from "lucide-react"
import { FormProvider, useForm, useFormContext } from "react-hook-form"

import { Expense, SalesTransaction, Service } from "@/lib/constants/interface"

// ── Helper ─────────────────────────────────────────────

function peso(v: string | number) {
  return `₱${Number(v).toLocaleString("en-PH", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`
}

/** Friendly display date (e.g. "Jan 15, 2025") */
function displayDate(d: string | Date | null | undefined) {
  if (!d) return "—"
  return formatDate(typeof d === "string" ? new Date(d) : d, "MMM dd, yyyy")
}

// ── Stall Filter ───────────────────────────────────────

function StallFilter({ stalls }: { stalls: { id: number; name: string }[] }) {
  const form = useFormContext()

  return (
    <Select
      onValueChange={(v) =>
        form.setValue("stall", v === "all" ? undefined : Number(v))
      }
    >
      <SelectTrigger className="w-[180px]">
        <Store className="size-4 mr-2 text-muted-foreground" />
        <SelectValue placeholder="All Stalls" />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="all">All Stalls</SelectItem>
        {stalls.map((s) => (
          <SelectItem
            key={s.id}
            value={String(s.id)}
          >
            {s.name}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}

// ── Page ───────────────────────────────────────────────

/** Name of the stall that owns services (case-insensitive match) */
const SERVICES_STALL_NAME = "main"

export default function ReportsPage() {
  const thirtyDaysAgo = new Date()
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

  const { data: stallData } = useStalls({ limit: 50 })
  const stalls = stallData?.results ?? []

  const form = useForm({
    defaultValues: {
      range: { from: thirtyDaysAgo, to: new Date() },
      stall: undefined as number | undefined,
    },
  })

  const selectedStallId = form.watch("stall")
  const selectedStallName = stalls.find((s) => s.id === selectedStallId)?.name
  const showServicesTab =
    selectedStallId === undefined ||
    selectedStallName?.toLowerCase() === SERVICES_STALL_NAME

  return (
    <FormProvider {...form}>
      <Wrapper>
        <PageHeader
          icon={FileSpreadsheet}
          title="Reports & Export"
          description="View financial reports, performance analytics, and export data to CSV."
          breadcrumbs={["Dashboard", "Reports"]}
          actionButton={
            <div className="flex items-center gap-2 flex-wrap">
              <StallFilter stalls={stalls} />
              <DateRangePicker classNames="mx-auto" />
            </div>
          }
        />

        <Tabs
          defaultValue="summary"
          className="space-y-6"
        >
          <TabsList className="w-full md:w-auto">
            <TabsTrigger value="summary">Summary</TabsTrigger>
            <TabsTrigger value="sales">Sales</TabsTrigger>
            <TabsTrigger value="expenses">Expenses</TabsTrigger>
            {showServicesTab ? (
              <TabsTrigger value="services">Services</TabsTrigger>
            ) : null}
          </TabsList>

          <TabsContent value="summary">
            <SummaryReport />
          </TabsContent>
          <TabsContent value="sales">
            <SalesReport />
          </TabsContent>
          <TabsContent value="expenses">
            <ExpensesReport />
          </TabsContent>
          <TabsContent value="services">
            <ServicesReport />
          </TabsContent>
        </Tabs>
      </Wrapper>
    </FormProvider>
  )
}

// ── Summary Tab ────────────────────────────────────────

function SummaryReport() {
  const { start_date, end_date, stall } = useDateParamsFromForm()
  const { data: summary, isLoading } = useGetSummary({
    start_date,
    end_date,
    stall,
  })
  const { data: cashFlow } = useCashFlow({ start_date, end_date, stall })
  const { data: topItems } = useTopSellingItems({
    start_date,
    end_date,
    stall,
    limit: 10,
  })
  const { data: topClients } = useTopClients({
    start_date,
    end_date,
    stall,
    limit: 10,
  })

  if (isLoading) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <Card key={i}>
            <CardContent className="p-6">
              <div className="h-4 w-24 bg-muted rounded animate-pulse mb-2" />
              <div className="h-8 w-32 bg-muted rounded animate-pulse" />
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  const kpis = [
    {
      label: "Total Revenue",
      value: peso(summary?.total_revenue ?? 0),
      icon: DollarSign,
      color: "text-emerald-600",
    },
    {
      label: "Total Sales",
      value: peso(summary?.total_sales ?? 0),
      icon: ShoppingCart,
      color: "text-blue-600",
    },
    {
      label: "Service Revenue",
      value: peso(summary?.service_revenue ?? 0),
      icon: Wrench,
      color: "text-violet-600",
    },
    {
      label: "Total Expenses",
      value: peso(summary?.total_expense ?? 0),
      icon: TrendingDown,
      color: "text-rose-600",
    },
    {
      label: "Net Income",
      value: peso(summary?.net_income ?? 0),
      icon: TrendingUp,
      color: "text-emerald-600",
    },
    {
      label: "Outstanding",
      value: peso(summary?.total_outstanding ?? 0),
      icon: CreditCard,
      color: "text-amber-600",
    },
    {
      label: "Total Clients",
      value: String(summary?.total_clients ?? 0),
      icon: Users,
      color: "text-indigo-600",
    },
    {
      label: "Inventory Alerts",
      value: String(summary?.inventory_alerts ?? 0),
      icon: Package,
      color: "text-orange-600",
    },
  ]

  const handleExportSummary = () => {
    if (!cashFlow?.length) return
    const cols: ExportColumn<(typeof cashFlow)[0]>[] = [
      { header: "Date", accessor: (r) => displayDate(r.date) },
      { header: "Income", accessor: (r) => r.income },
      { header: "Expense", accessor: (r) => r.expense },
      {
        header: "Net",
        accessor: (r) => Number(r.income) - Number(r.expense),
      },
    ]
    exportToCSV(cashFlow, cols, `cash-flow-report-${start_date}-${end_date}`)
  }

  return (
    <div className="space-y-6">
      {/* KPI grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {kpis.map((kpi) => (
          <Card key={kpi.label}>
            <CardContent className="p-5">
              <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                <kpi.icon className={`size-4 ${kpi.color}`} />
                {kpi.label}
              </div>
              <p className="text-xl font-bold">{kpi.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Top selling + Top clients side by side */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top selling items */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-3">
            <CardTitle className="text-base">Top Selling Items</CardTitle>
            {topItems && topItems.length > 0 && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  const cols: ExportColumn<(typeof topItems)[0]>[] = [
                    { header: "Item", accessor: (r) => r.item },
                    { header: "Quantity", accessor: (r) => r.quantity },
                  ]
                  exportToCSV(
                    topItems,
                    cols,
                    `top-items-${start_date}-${end_date}`,
                  )
                }}
              >
                <Download className="size-4 mr-1.5" />
                CSV
              </Button>
            )}
          </CardHeader>
          <CardContent>
            {topItems?.length ? (
              <div className="space-y-3">
                {topItems.map((item, i) => (
                  <div
                    key={i}
                    className="flex items-center justify-between"
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-xs text-muted-foreground font-mono w-5 text-right">
                        {i + 1}.
                      </span>
                      <span className="text-sm font-medium">
                        {item.item || "Manual / Labor"}
                      </span>
                    </div>
                    <Badge variant="secondary">{item.quantity} sold</Badge>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground text-center py-8">
                No data for this period.
              </p>
            )}
          </CardContent>
        </Card>

        {/* Top clients */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-3">
            <CardTitle className="text-base">Top Clients</CardTitle>
            {topClients && topClients.length > 0 && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  const cols: ExportColumn<(typeof topClients)[0]>[] = [
                    { header: "Client", accessor: (r) => r.client },
                    { header: "Total Spent", accessor: (r) => r.total_spent },
                  ]
                  exportToCSV(
                    topClients,
                    cols,
                    `top-clients-${start_date}-${end_date}`,
                  )
                }}
              >
                <Download className="size-4 mr-1.5" />
                CSV
              </Button>
            )}
          </CardHeader>
          <CardContent>
            {topClients?.length ? (
              <div className="space-y-3">
                {topClients.map((client, i) => (
                  <div
                    key={i}
                    className="flex items-center justify-between"
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-xs text-muted-foreground font-mono w-5 text-right">
                        {i + 1}.
                      </span>
                      <span className="text-sm font-medium">
                        {client.client}
                      </span>
                    </div>
                    <span className="text-sm font-semibold">
                      {peso(client.total_spent)}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground text-center py-8">
                No data for this period.
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Cash flow export */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-3">
          <CardTitle className="text-base">Cash Flow Summary</CardTitle>
          <Button
            variant="outline"
            size="sm"
            onClick={handleExportSummary}
            disabled={!cashFlow?.length}
          >
            <Download className="size-4 mr-1.5" />
            Export Cash Flow
          </Button>
        </CardHeader>
        <CardContent>
          {cashFlow?.length ? (
            <div className="border rounded-lg overflow-x-auto max-h-80">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/50">
                    <TableHead>Date</TableHead>
                    <TableHead className="text-right">Income</TableHead>
                    <TableHead className="text-right">Expense</TableHead>
                    <TableHead className="text-right">Net</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {cashFlow.map((row, i) => {
                    const net = Number(row.income) - Number(row.expense)
                    return (
                      <TableRow key={i}>
                        <TableCell className="text-sm">
                          {displayDate(row.date)}
                        </TableCell>
                        <TableCell className="text-right text-sm text-emerald-600">
                          {peso(row.income)}
                        </TableCell>
                        <TableCell className="text-right text-sm text-rose-600">
                          {peso(row.expense)}
                        </TableCell>
                        <TableCell
                          className={`text-right text-sm font-semibold ${
                            net >= 0 ? "text-emerald-600" : "text-rose-600"
                          }`}
                        >
                          {peso(net)}
                        </TableCell>
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground text-center py-8">
              No cash flow data for this period.
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

// ── Sales Tab ──────────────────────────────────────────

function SalesReport() {
  const { start_date, end_date, stall } = useDateParamsFromForm()
  const { data: salesData, isLoading } = useSalesTransactions({
    limit: 1000,
    start_date,
    end_date,
    filter: stall ? { stall: String(stall) } : undefined,
  })

  const transactions = salesData?.results ?? []
  const active = transactions.filter((t) => !t.voided)
  const voided = transactions.filter((t) => t.voided)

  const totalSales = active.reduce(
    (s, t) => s + Number(t.computed_total ?? 0),
    0,
  )
  const totalPaid = active.reduce((s, t) => s + Number(t.total_paid ?? 0), 0)
  const outstanding = totalSales - totalPaid

  const handleExport = () => {
    const cols: ExportColumn<SalesTransaction>[] = [
      { header: "ID", accessor: (r) => r.id },
      {
        header: "Date",
        accessor: (r) => displayDate(r.created_at),
      },
      { header: "Client", accessor: (r) => r.client?.full_name ?? "" },
      { header: "Stall", accessor: (r) => r.stall?.name ?? "" },
      { header: "Items", accessor: (r) => r.items?.length ?? 0 },
      { header: "Total", accessor: (r) => Number(r.computed_total ?? 0) },
      { header: "Paid", accessor: (r) => Number(r.total_paid ?? 0) },
      { header: "Status", accessor: (r) => r.payment_status },
      { header: "Voided", accessor: (r) => (r.voided ? "Yes" : "No") },
    ]
    exportToCSV(transactions, cols, `sales-report-${start_date}-${end_date}`)
  }

  return (
    <div className="space-y-6">
      {/* Summary cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-5">
            <p className="text-sm text-muted-foreground">Transactions</p>
            <p className="text-2xl font-bold">{transactions.length}</p>
            <p className="text-xs text-muted-foreground mt-1">
              {active.length} active · {voided.length} voided
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5">
            <p className="text-sm text-muted-foreground">Total Sales</p>
            <p className="text-2xl font-bold">{peso(totalSales)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5">
            <p className="text-sm text-muted-foreground">Collected</p>
            <p className="text-2xl font-bold text-emerald-600">
              {peso(totalPaid)}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5">
            <p className="text-sm text-muted-foreground">Outstanding</p>
            <p className="text-2xl font-bold text-amber-600">
              {peso(outstanding)}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Table + export */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-3">
          <CardTitle className="text-base">
            Sales Transactions ({transactions.length})
          </CardTitle>
          <Button
            variant="outline"
            size="sm"
            onClick={handleExport}
            disabled={!transactions.length}
          >
            <Download className="size-4 mr-1.5" />
            Export CSV
          </Button>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-2">
              {Array.from({ length: 5 }).map((_, i) => (
                <div
                  key={i}
                  className="h-10 bg-muted rounded animate-pulse"
                />
              ))}
            </div>
          ) : transactions.length ? (
            <div className="border rounded-lg overflow-x-auto max-h-96">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/50">
                    <TableHead>ID</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Client</TableHead>
                    <TableHead>Stall</TableHead>
                    <TableHead className="text-right">Total</TableHead>
                    <TableHead className="text-right">Paid</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {transactions.map((tx) => (
                    <TableRow
                      key={tx.id}
                      className={
                        tx.voided ? "opacity-50 line-through" : undefined
                      }
                    >
                      <TableCell className="font-mono text-sm">
                        #{String(tx.id).padStart(4, "0")}
                      </TableCell>
                      <TableCell className="text-sm">
                        {displayDate(tx.created_at)}
                      </TableCell>
                      <TableCell className="text-sm">
                        {tx.client?.full_name ?? "Walk-in"}
                      </TableCell>
                      <TableCell className="text-sm">
                        {tx.stall?.name ?? "—"}
                      </TableCell>
                      <TableCell className="text-right text-sm font-semibold">
                        {peso(tx.computed_total ?? 0)}
                      </TableCell>
                      <TableCell className="text-right text-sm">
                        {peso(tx.total_paid ?? 0)}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={
                            tx.voided
                              ? "destructive"
                              : tx.payment_status === "paid"
                                ? "success"
                                : "secondary"
                          }
                          className="text-xs"
                        >
                          {tx.voided
                            ? "Voided"
                            : tx.payment_status.toUpperCase()}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground text-center py-8">
              No transactions found for this period.
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

// ── Expenses Tab ───────────────────────────────────────

function ExpensesReport() {
  const { start_date, end_date, stall } = useDateParamsFromForm()
  const { data: expenseData, isLoading } = useExpenses({
    limit: 1000,
    start_date,
    end_date,
    filter: stall ? { stall: String(stall) } : undefined,
  })

  const expenses = expenseData?.results ?? []
  const totalExpenses = expenses.reduce(
    (s, e) => s + Number(e.total_price ?? 0),
    0,
  )
  const paidExpenses = expenses.reduce(
    (s, e) => s + Number(e.paid_amount ?? 0),
    0,
  )

  // Group by category
  const byCategory = expenses.reduce(
    (acc, exp) => {
      const cat = exp.category_data?.name ?? "Uncategorized"
      acc[cat] = (acc[cat] ?? 0) + Number(exp.total_price ?? 0)
      return acc
    },
    {} as Record<string, number>,
  )
  const categories = Object.entries(byCategory)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)

  const handleExport = () => {
    const cols: ExportColumn<Expense>[] = [
      { header: "ID", accessor: (r) => r.id },
      {
        header: "Date",
        accessor: (r) => displayDate(r.expense_date),
      },
      { header: "Category", accessor: (r) => r.category_data?.name ?? "" },
      { header: "Description", accessor: (r) => r.description ?? "" },
      { header: "Vendor", accessor: (r) => r.vendor ?? "" },
      { header: "Total", accessor: (r) => Number(r.total_price ?? 0) },
      { header: "Paid", accessor: (r) => Number(r.paid_amount ?? 0) },
      { header: "Method", accessor: (r) => r.payment_method ?? "" },
      { header: "Status", accessor: (r) => r.payment_status ?? "" },
    ]
    exportToCSV(expenses, cols, `expenses-report-${start_date}-${end_date}`)
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-5">
            <p className="text-sm text-muted-foreground">Total Expenses</p>
            <p className="text-2xl font-bold text-rose-600">
              {peso(totalExpenses)}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5">
            <p className="text-sm text-muted-foreground">Total Paid</p>
            <p className="text-2xl font-bold">{peso(paidExpenses)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5">
            <p className="text-sm text-muted-foreground">Entries</p>
            <p className="text-2xl font-bold">{expenses.length}</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Category breakdown */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">By Category</CardTitle>
          </CardHeader>
          <CardContent>
            {categories.length ? (
              <div className="space-y-3">
                {categories.map(([cat, amount]) => (
                  <div
                    key={cat}
                    className="flex items-center justify-between"
                  >
                    <span className="text-sm">{cat}</span>
                    <span className="text-sm font-semibold">
                      {peso(amount)}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground text-center py-4">
                No data.
              </p>
            )}
          </CardContent>
        </Card>

        {/* Expense table */}
        <Card className="lg:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between pb-3">
            <CardTitle className="text-base">
              Expense Records ({expenses.length})
            </CardTitle>
            <Button
              variant="outline"
              size="sm"
              onClick={handleExport}
              disabled={!expenses.length}
            >
              <Download className="size-4 mr-1.5" />
              Export CSV
            </Button>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-2">
                {Array.from({ length: 5 }).map((_, i) => (
                  <div
                    key={i}
                    className="h-10 bg-muted rounded animate-pulse"
                  />
                ))}
              </div>
            ) : expenses.length ? (
              <div className="border rounded-lg overflow-x-auto max-h-96">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/50">
                      <TableHead>Date</TableHead>
                      <TableHead>Category</TableHead>
                      <TableHead>Description</TableHead>
                      <TableHead className="text-right">Amount</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {expenses.map((exp) => (
                      <TableRow key={exp.id}>
                        <TableCell className="text-sm">
                          {displayDate(exp.expense_date)}
                        </TableCell>
                        <TableCell className="text-sm">
                          {exp.category_data?.name ?? "—"}
                        </TableCell>
                        <TableCell className="text-sm max-w-48 truncate">
                          {exp.description ?? "—"}
                        </TableCell>
                        <TableCell className="text-right text-sm font-semibold">
                          {peso(exp.total_price ?? 0)}
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant={exp.is_paid ? "success" : "secondary"}
                            className="text-xs"
                          >
                            {exp.payment_status?.toUpperCase() ?? "UNPAID"}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground text-center py-8">
                No expenses found for this period.
              </p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

// ── Services Tab ───────────────────────────────────────

function ServicesReport() {
  const { start_date, end_date, stall } = useDateParamsFromForm()
  const { data: serviceData, isLoading } = useServices({
    limit: 1000,
    start_date,
    end_date,
    filter: stall ? { main_stall: String(stall) } : undefined,
  })

  const services = serviceData?.results ?? []
  const totalRevenue = services.reduce(
    (s, svc) => s + Number(svc.total_revenue ?? 0),
    0,
  )
  const totalCost = services.reduce(
    (s, svc) => s + Number(svc.total_cost ?? 0),
    0,
  )
  const totalPaid = services.reduce(
    (s, svc) => s + Number(svc.total_paid ?? 0),
    0,
  )

  const byStatus = services.reduce(
    (acc, svc) => {
      const st = svc.status ?? "unknown"
      acc[st] = (acc[st] ?? 0) + 1
      return acc
    },
    {} as Record<string, number>,
  )

  const handleExport = () => {
    const cols: ExportColumn<Service>[] = [
      { header: "ID", accessor: (r) => r.id },
      { header: "Client", accessor: (r) => r.client?.full_name ?? "" },
      { header: "Type", accessor: (r) => r.service_type ?? "" },
      { header: "Mode", accessor: (r) => r.service_mode ?? "" },
      { header: "Status", accessor: (r) => r.status ?? "" },
      { header: "Revenue", accessor: (r) => Number(r.total_revenue ?? 0) },
      { header: "Cost", accessor: (r) => Number(r.total_cost ?? 0) },
      { header: "Paid", accessor: (r) => Number(r.total_paid ?? 0) },
      { header: "Balance Due", accessor: (r) => Number(r.balance_due ?? 0) },
      {
        header: "Payment Status",
        accessor: (r) => r.payment_status ?? "",
      },
    ]
    exportToCSV(services, cols, `services-report-${start_date}-${end_date}`)
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-5">
            <p className="text-sm text-muted-foreground">Total Services</p>
            <p className="text-2xl font-bold">{services.length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5">
            <p className="text-sm text-muted-foreground">Revenue</p>
            <p className="text-2xl font-bold text-emerald-600">
              {peso(totalRevenue)}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5">
            <p className="text-sm text-muted-foreground">Costs</p>
            <p className="text-2xl font-bold text-rose-600">
              {peso(totalCost)}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5">
            <p className="text-sm text-muted-foreground">Collected</p>
            <p className="text-2xl font-bold">{peso(totalPaid)}</p>
          </CardContent>
        </Card>
      </div>

      {/* Status breakdown */}
      {Object.keys(byStatus).length > 0 && (
        <div className="flex flex-wrap gap-2">
          {Object.entries(byStatus)
            .sort((a, b) => b[1] - a[1])
            .map(([status, count]) => (
              <Badge
                key={status}
                variant="outline"
                className="text-sm py-1"
              >
                {status}: {count}
              </Badge>
            ))}
        </div>
      )}

      {/* Table */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-3">
          <CardTitle className="text-base">
            Service Records ({services.length})
          </CardTitle>
          <Button
            variant="outline"
            size="sm"
            onClick={handleExport}
            disabled={!services.length}
          >
            <Download className="size-4 mr-1.5" />
            Export CSV
          </Button>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-2">
              {Array.from({ length: 5 }).map((_, i) => (
                <div
                  key={i}
                  className="h-10 bg-muted rounded animate-pulse"
                />
              ))}
            </div>
          ) : services.length ? (
            <div className="border rounded-lg overflow-x-auto max-h-96">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/50">
                    <TableHead>ID</TableHead>
                    <TableHead>Client</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Revenue</TableHead>
                    <TableHead className="text-right">Paid</TableHead>
                    <TableHead>Payment</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {services.map((svc) => (
                    <TableRow key={svc.id}>
                      <TableCell className="font-mono text-sm">
                        #{String(svc.id).padStart(4, "0")}
                      </TableCell>
                      <TableCell className="text-sm">
                        {svc.client?.full_name ?? "—"}
                      </TableCell>
                      <TableCell className="text-sm capitalize">
                        {svc.service_type ?? "—"}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant="outline"
                          className="text-xs capitalize"
                        >
                          {svc.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right text-sm font-semibold">
                        {peso(svc.total_revenue ?? 0)}
                      </TableCell>
                      <TableCell className="text-right text-sm">
                        {peso(svc.total_paid ?? 0)}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={
                            svc.payment_status === "paid"
                              ? "success"
                              : "secondary"
                          }
                          className="text-xs"
                        >
                          {svc.payment_status?.toUpperCase() ?? "—"}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground text-center py-8">
              No services found for this period.
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
