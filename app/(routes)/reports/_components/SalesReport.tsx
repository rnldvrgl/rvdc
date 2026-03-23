"use client"

import { Badge } from "@/components/ui/badge"
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
import { useSalesTransactions } from "@/lib/queries/sales/useSalesTransactions"
import { formatDate } from "@/lib/utils/helpers/date"
import { useMemo } from "react"

function peso(v: string | number) {
  return `₱${Number(v).toLocaleString("en-PH", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`
}

function displayDate(d: string | Date | null | undefined) {
  if (!d) return "—"
  return formatDate(typeof d === "string" ? new Date(d) : d, "MMMM dd, yyyy")
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

  return (
    <div className="space-y-6">
      {/* Summary cards */}
      <div className="grid grid-cols-2 md:grid-cols-2 2xl:grid-cols-4 gap-2 sm:gap-4">
        <Card>
          <CardContent className="p-3 sm:p-5">
            <p className="text-xs sm:text-sm text-muted-foreground">
              Transactions
            </p>
            <p className="text-lg sm:text-2xl font-bold">
              {transactions.length}
            </p>
            <p className="text-[10px] sm:text-xs text-muted-foreground mt-0.5 sm:mt-1">
              {active.length} active · {voided.length} voided
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-3 sm:p-5">
            <p className="text-xs sm:text-sm text-muted-foreground">
              Total Sales
            </p>
            <p className="text-lg sm:text-2xl font-bold">{peso(totalSales)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-3 sm:p-5">
            <p className="text-xs sm:text-sm text-muted-foreground">
              Collected
            </p>
            <p className="text-lg sm:text-2xl font-bold text-success">
              {peso(totalPaid)}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-3 sm:p-5">
            <p className="text-xs sm:text-sm text-muted-foreground">
              Outstanding
            </p>
            <p className="text-lg sm:text-2xl font-bold text-amber-600">
              {peso(outstanding)}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Table + export */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">
            Sales Transactions ({transactions.length})
          </CardTitle>
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
