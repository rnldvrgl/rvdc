"use client"

import { ListCardSkeleton } from "@/components/custom/shared/skeletons"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useSalesTransactions } from "@/lib/queries/sales/useSalesTransactions"
import { format } from "date-fns"
import { DollarSign } from "lucide-react"

export function RecentTransactions() {
  const { data: transactions, isLoading } = useSalesTransactions()

  const recentTransactions = transactions?.results?.slice(0, 5) || []

  if (isLoading) {
    return <ListCardSkeleton rows={5} />
  }

  if (recentTransactions.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <DollarSign className="size-5" />
            Recent Transactions
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            No recent transactions
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base flex items-center gap-2">
          <DollarSign className="size-5" />
          Recent Transactions
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {recentTransactions.map((transaction) => (
            <div
              key={transaction.id}
              className="p-3 rounded-lg border hover:bg-muted/50 transition-colors"
            >
              <div className="flex items-center justify-between mb-1">
                <p className="text-sm font-medium">
                  {transaction.client?.full_name || "Walk-in Client"}
                </p>
                <Badge
                  variant={
                    transaction.payment_status === "paid"
                      ? "default"
                      : transaction.payment_status === "partial"
                        ? "secondary"
                        : "destructive"
                  }
                  className="text-xs"
                >
                  {transaction.payment_status}
                </Badge>
              </div>
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span>
                  {format(new Date(transaction.created_at), "MMM dd, yyyy")}
                </span>
                <span className="font-medium">
                  ₱{transaction.computed_total?.toLocaleString()}
                </span>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
