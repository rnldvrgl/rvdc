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
import { Expense } from "@/lib/constants/interface"
import { useDateParamsFromForm } from "@/lib/hooks/useDateParamsFromForm"
import { useExpenses } from "@/lib/queries/useExpenses"
import { ExportColumn, exportToCSV } from "@/lib/utils/export"
import { formatDate } from "@/lib/utils/helpers/date"
import { Download } from "lucide-react"

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

export function ExpensesReport() {
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
