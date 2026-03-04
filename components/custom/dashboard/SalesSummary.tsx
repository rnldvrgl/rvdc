"use client"

import { StatCardSkeleton } from "@/components/custom/shared/skeletons"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useDateParamsFromForm } from "@/lib/hooks/useDateParamsFromForm"
import { useGetSummary } from "@/lib/queries/analytics/useGetAnalytics"
import { DollarSign, TrendingUp } from "lucide-react"

export function SalesSummary() {
  const { start_date, end_date, stall } = useDateParamsFromForm()
  const { data: summary, isLoading } = useGetSummary({
    start_date,
    end_date,
    stall,
  })

  if (isLoading) {
    return <StatCardSkeleton rows={3} />
  }

  const totalSales = summary?.total_sales || 0
  const totalExpense = summary?.total_expense || 0
  const unitCost = summary?.unit_cost_deduction || 0
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

          {unitCost > 0 && (
            <div className="p-3 rounded-lg border">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs text-muted-foreground">
                  Unit Cost (Aircon)
                </span>
              </div>
              <p className="text-lg font-semibold text-rose-500">
                ₱{unitCost.toLocaleString()}
              </p>
            </div>
          )}

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
              <div className="flex items-center justify-between text-xs md:text-sm">
                <span className="text-muted-foreground">Total Clients</span>
                <span className="font-medium">
                  {summary.total_clients || 0}
                </span>
              </div>
              <div className="flex items-center justify-between text-xs md:text-sm">
                <span className="text-muted-foreground">Low Stock Items</span>
                <span className="font-medium text-amber-600">
                  {summary.low_stock_items || 0}
                </span>
              </div>
              <div className="flex items-center justify-between text-xs md:text-sm">
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
