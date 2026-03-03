"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  useStallStocks,
  useStockRoomStocks,
} from "@/lib/queries/inventory/useStocks"
import {
  AlertTriangle,
  ArrowRight,
  Package,
  PackageX,
  Warehouse,
} from "lucide-react"
import Link from "next/link"
import { useMemo } from "react"

type AlertItem = {
  name: string
  sku: string
  quantity: number
  threshold: number
  location: string
}

export function InventoryReorderAlerts() {
  const { data: stallData } = useStallStocks({ limit: 100 })
  const { data: stockRoomData } = useStockRoomStocks({ limit: 100 })

  const { outOfStock, lowStock } = useMemo(() => {
    const items: AlertItem[] = []

    // Stall stocks
    for (const stock of stallData?.results ?? []) {
      items.push({
        name: stock.item?.name ?? "Unknown",
        sku: stock.item?.sku ?? "",
        quantity: stock.available_quantity ?? stock.quantity ?? 0,
        threshold: stock.low_stock_threshold ?? 0,
        location: stock.stall?.name ?? "Stall",
      })
    }

    // Stockroom stocks
    for (const stock of stockRoomData?.results ?? []) {
      items.push({
        name: stock.item?.name ?? "Unknown",
        sku: stock.item?.sku ?? "",
        quantity: stock.quantity ?? 0,
        threshold: stock.low_stock_threshold ?? 0,
        location: "Stockroom",
      })
    }

    const outOfStock = items.filter((i) => i.quantity <= 0)
    const lowStock = items.filter(
      (i) => i.quantity > 0 && i.threshold > 0 && i.quantity <= i.threshold,
    )

    return { outOfStock, lowStock }
  }, [stallData, stockRoomData])

  const total = outOfStock.length + lowStock.length

  if (total === 0) {
    return (
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <Package className="size-4" />
            Inventory Alerts
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center py-6 text-center">
            <div className="rounded-full bg-emerald-100 dark:bg-emerald-900/30 p-3 mb-3">
              <Package className="size-5 text-emerald-600" />
            </div>
            <p className="text-sm font-medium">All stock levels are healthy</p>
            <p className="text-xs text-muted-foreground mt-1">
              No items need reordering
            </p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <Package className="size-4" />
          Inventory Alerts
          <span className="ml-auto text-xs font-normal text-muted-foreground">
            {total} alert{total !== 1 ? "s" : ""}
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Out of stock */}
        {outOfStock.length > 0 && (
          <div className="rounded-lg border border-red-200 dark:border-red-800 bg-red-50/50 dark:bg-red-900/10 p-3">
            <div className="flex items-center gap-2 mb-2">
              <PackageX className="size-4 text-red-600" />
              <span className="text-sm font-semibold text-red-700 dark:text-red-400">
                Out of Stock ({outOfStock.length})
              </span>
            </div>
            <div className="space-y-1.5">
              {outOfStock.slice(0, 5).map((item, i) => (
                <div
                  key={`oos-${i}`}
                  className="flex items-center justify-between text-xs"
                >
                  <span className="text-red-800 dark:text-red-300 truncate max-w-[60%]">
                    {item.name}
                  </span>
                  <span className="text-red-600 dark:text-red-400 shrink-0">
                    {item.location}
                  </span>
                </div>
              ))}
              {outOfStock.length > 5 && (
                <p className="text-xs text-red-500">
                  +{outOfStock.length - 5} more
                </p>
              )}
            </div>
          </div>
        )}

        {/* Low stock */}
        {lowStock.length > 0 && (
          <div className="rounded-lg border border-amber-200 dark:border-amber-800 bg-amber-50/50 dark:bg-amber-900/10 p-3">
            <div className="flex items-center gap-2 mb-2">
              <AlertTriangle className="size-4 text-amber-600" />
              <span className="text-sm font-semibold text-amber-700 dark:text-amber-400">
                Low Stock ({lowStock.length})
              </span>
            </div>
            <div className="space-y-1.5">
              {lowStock.slice(0, 5).map((item, i) => (
                <div
                  key={`low-${i}`}
                  className="flex items-center justify-between text-xs"
                >
                  <span className="text-amber-800 dark:text-amber-300 truncate max-w-[50%]">
                    {item.name}
                  </span>
                  <span className="text-amber-600 dark:text-amber-400 shrink-0">
                    {item.quantity} / {item.threshold} · {item.location}
                  </span>
                </div>
              ))}
              {lowStock.length > 5 && (
                <p className="text-xs text-amber-500">
                  +{lowStock.length - 5} more
                </p>
              )}
            </div>
          </div>
        )}

        {/* Link to inventory */}
        <Link
          href="/inventory/stocks/stockroom"
          className="flex items-center gap-1.5 text-xs text-primary hover:underline underline-offset-4"
        >
          <Warehouse className="size-3.5" />
          View full inventory
          <ArrowRight className="size-3" />
        </Link>
      </CardContent>
    </Card>
  )
}
