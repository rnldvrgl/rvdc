"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useGetSummary } from "@/lib/queries/analytics/useGetAnalytics"
import { DollarSign, TrendingUp } from "lucide-react"

export function SalesSummary() {
  const { data: summary, isLoading } = useGetSummary({})

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <DollarSign className="size-5" />
            Sales Summary
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-4">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary" />
          </div>
        </CardContent>
      </Card>
    )
  }

  const totalSales = summary?.total_sales || 0
  const totalExpense = summary?.total_expense || 0
  const netIncome = summary?.net_income || 0

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base flex items-center gap-2">
          <DollarSign className="size-5" />
          Sales Summary
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="p-3 rounded-lg border bg-green-50/50 dark:bg-green-900/10">
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs text-muted-foreground">Total Sales</span>
              <TrendingUp className="size-4 text-green-600" />
            </div>
            <p className="text-2xl font-bold text-green-600">
              ₱{totalSales.toLocaleString()}
            </p>
          </div>

          <div className="p-3 rounded-lg border">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs text-muted-foreground">
                Total Expenses
              </span>
            </div>
            <p className="text-lg font-semibold">
              ₱{totalExpense.toLocaleString()}
            </p>
          </div>

          <div className="p-3 rounded-lg border">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs text-muted-foreground">Net Income</span>
            </div>
            <p className="text-lg font-semibold">
              ₱{netIncome.toLocaleString()}
            </p>
          </div>

          {summary && (
            <div className="pt-3 border-t space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground">Total Clients</span>
                <span className="font-medium">
                  {summary.total_clients || 0}
                </span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground">Low Stock Items</span>
                <span className="font-medium text-amber-600">
                  {summary.low_stock_items || 0}
                </span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground">Out of Stock</span>
                <span className="font-medium text-red-600">
                  {summary.no_stock_items || 0}
                </span>
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
