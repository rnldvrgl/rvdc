"use client"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { useDateParamsFromForm } from "@/lib/hooks/useDateParamsFromForm"
import {
  useCashFlow,
  useGetSummary,
  useTopClients,
  useTopSellingItems,
} from "@/lib/queries/analytics/useGetAnalytics"
import { ExportColumn, exportToCSV } from "@/lib/utils/export"
import { formatDate } from "@/lib/utils/helpers/date"
import {
  CreditCard,
  DollarSign,
  Download,
  Package,
  ShoppingCart,
  TrendingDown,
  TrendingUp,
  Users,
  Wrench,
} from "lucide-react"

function peso(v: string | number) {
  return `₱${Number(v).toLocaleString("en-PH", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`
}

function displayDate(d: string | Date | null | undefined) {
  if (!d) return "—"
  return formatDate(typeof d === "string" ? new Date(d) : d, "MMM dd, yyyy")
}

export function SummaryReport() {
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
      <div className="grid md:grid-cols-2 2xl:grid-cols-4 gap-4">
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
      label: "Main Stall (Services)",
      value: peso(summary?.main_stall_service_revenue ?? 0),
      icon: Wrench,
      color: "text-violet-500",
    },
    {
      label: "Sub Stall (Services)",
      value: peso(summary?.sub_stall_service_revenue ?? 0),
      icon: Wrench,
      color: "text-violet-400",
    },
    {
      label: "Total Expenses",
      value: peso(summary?.total_expense ?? 0),
      icon: TrendingDown,
      color: "text-rose-600",
    },
    {
      label: "Unit Cost (Aircon)",
      value: peso(summary?.unit_cost_deduction ?? 0),
      icon: Package,
      color: "text-rose-500",
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
      <div className="grid md:grid-cols-2 2xl:grid-cols-4 gap-4">
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
