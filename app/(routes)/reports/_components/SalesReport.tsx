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
import { SalesTransaction } from "@/lib/constants/interface"
import { useDateParamsFromForm } from "@/lib/hooks/useDateParamsFromForm"
import { useSalesTransactions } from "@/lib/queries/sales/useSalesTransactions"
import { ExportColumn, exportToCSV } from "@/lib/utils/export"
import { formatDate } from "@/lib/utils/helpers/date"
import { Download } from "lucide-react"
import { useMemo } from "react"

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

export function SalesReport() {
  const { start_date, end_date, stall } = useDateParamsFromForm()
  const { data: salesData, isLoading } = useSalesTransactions({
    limit: 100,
    start_date,
    end_date,
    filter: stall ? { stall: String(stall) } : undefined,
  })

  const transactions = useMemo(() => salesData?.results ?? [], [salesData])

  const { active, voided, totalSales, totalPaid, outstanding } = useMemo(() => {
    const active = transactions.filter((t) => !t.voided)
    const voided = transactions.filter((t) => t.voided)
    const totalSales = active.reduce(
      (s, t) => s + Number(t.computed_total ?? 0),
      0,
    )
    const totalPaid = active.reduce((s, t) => s + Number(t.total_paid ?? 0), 0)
    return {
      active,
      voided,
      totalSales,
      totalPaid,
      outstanding: totalSales - totalPaid,
    }
  }, [transactions])

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
