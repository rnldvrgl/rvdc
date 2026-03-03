"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  useStallStocks,
  useStockRoomStocks,
} from "@/lib/queries/inventory/useStocks"
import { ArrowRight, Package, Store, Warehouse } from "lucide-react"
import Link from "next/link"
import { useMemo } from "react"

type AlertItem = {
  name: string
  sku: string
  quantity: number
  threshold: number
}

export function InventoryReorderAlerts() {
  const { data: stallData } = useStallStocks({ limit: 100 })
  const { data: stockRoomData } = useStockRoomStocks({ limit: 100 })

  const {
    stallOutOfStock,
    stallLowStock,
    stockRoomOutOfStock,
    stockRoomLowStock,
  } = useMemo(() => {
    const stallItems: AlertItem[] = []
    const stockRoomItems: AlertItem[] = []

    // Stall stocks
    for (const stock of stallData?.results ?? []) {
      stallItems.push({
        name: stock.item?.name ?? "Unknown",
        sku: stock.item?.sku ?? "",
        quantity: stock.available_quantity ?? stock.quantity ?? 0,
        threshold: stock.low_stock_threshold ?? 0,
      })
    }

    // Stockroom stocks
    for (const stock of stockRoomData?.results ?? []) {
      stockRoomItems.push({
        name: stock.item?.name ?? "Unknown",
        sku: stock.item?.sku ?? "",
        quantity: stock.quantity ?? 0,
        threshold: stock.low_stock_threshold ?? 0,
      })
    }

    const stallOutOfStock = stallItems.filter((i) => i.quantity <= 0)
    const stallLowStock = stallItems.filter(
      (i) => i.quantity > 0 && i.threshold > 0 && i.quantity <= i.threshold,
    )

    const stockRoomOutOfStock = stockRoomItems.filter((i) => i.quantity <= 0)
    const stockRoomLowStock = stockRoomItems.filter(
      (i) => i.quantity > 0 && i.threshold > 0 && i.quantity <= i.threshold,
    )

    return {
      stallOutOfStock,
      stallLowStock,
      stockRoomOutOfStock,
      stockRoomLowStock,
    }
  }, [stallData, stockRoomData])

  const total =
    stallOutOfStock.length +
    stallLowStock.length +
    stockRoomOutOfStock.length +
    stockRoomLowStock.length

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
        {/* Stockroom Out of Stock */}
        {stockRoomOutOfStock.length > 0 && (
          <Link
            href="/inventory/stocks/stockroom?status=no_stock"
            className="block"
          >
            <div className="rounded-lg border border-red-200 dark:border-red-800 bg-red-50/50 dark:bg-red-900/10 p-3 hover:bg-red-100/50 dark:hover:bg-red-900/20 transition-colors cursor-pointer">
              <div className="flex items-center gap-2 mb-2">
                <Warehouse className="size-4 text-red-600" />
                <span className="text-sm font-semibold text-red-700 dark:text-red-400">
                  Stockroom - Out of Stock ({stockRoomOutOfStock.length})
                </span>
                <ArrowRight className="size-3.5 ml-auto text-red-600" />
              </div>
              <div className="space-y-1.5">
                {stockRoomOutOfStock.slice(0, 3).map((item, i) => (
                  <div
                    key={`sr-oos-${i}`}
                    className="flex items-center justify-between text-xs"
                  >
                    <span className="text-red-800 dark:text-red-300 truncate max-w-[70%]">
                      {item.name}
                    </span>
                    <span className="text-red-600 dark:text-red-400 shrink-0 font-medium">
                      0 units
                    </span>
                  </div>
                ))}
                {stockRoomOutOfStock.length > 3 && (
                  <p className="text-xs text-red-500 font-medium">
                    +{stockRoomOutOfStock.length - 3} more items
                  </p>
                )}
              </div>
            </div>
          </Link>
        )}

        {/* Stockroom Low Stock */}
        {stockRoomLowStock.length > 0 && (
          <Link
            href="/inventory/stocks/stockroom?status=low_stock"
            className="block"
          >
            <div className="rounded-lg border border-amber-200 dark:border-amber-800 bg-amber-50/50 dark:bg-amber-900/10 p-3 hover:bg-amber-100/50 dark:hover:bg-amber-900/20 transition-colors cursor-pointer">
              <div className="flex items-center gap-2 mb-2">
                <Warehouse className="size-4 text-amber-600" />
                <span className="text-sm font-semibold text-amber-700 dark:text-amber-400">
                  Stockroom - Low Stock ({stockRoomLowStock.length})
                </span>
                <ArrowRight className="size-3.5 ml-auto text-amber-600" />
              </div>
              <div className="space-y-1.5">
                {stockRoomLowStock.slice(0, 3).map((item, i) => (
                  <div
                    key={`sr-low-${i}`}
                    className="flex items-center justify-between text-xs"
                  >
                    <span className="text-amber-800 dark:text-amber-300 truncate max-w-[50%]">
                      {item.name}
                    </span>
                    <span className="text-amber-600 dark:text-amber-400 shrink-0 font-medium">
                      {item.quantity} / {item.threshold}
                    </span>
                  </div>
                ))}
                {stockRoomLowStock.length > 3 && (
                  <p className="text-xs text-amber-500 font-medium">
                    +{stockRoomLowStock.length - 3} more items
                  </p>
                )}
              </div>
            </div>
          </Link>
        )}

        {/* Stall Out of Stock */}
        {stallOutOfStock.length > 0 && (
          <Link
            href="/inventory/stocks/stall?status=no_stock"
            className="block"
          >
            <div className="rounded-lg border border-red-200 dark:border-red-800 bg-red-50/50 dark:bg-red-900/10 p-3 hover:bg-red-100/50 dark:hover:bg-red-900/20 transition-colors cursor-pointer">
              <div className="flex items-center gap-2 mb-2">
                <Store className="size-4 text-red-600" />
                <span className="text-sm font-semibold text-red-700 dark:text-red-400">
                  Stall - Out of Stock ({stallOutOfStock.length})
                </span>
                <ArrowRight className="size-3.5 ml-auto text-red-600" />
              </div>
              <div className="space-y-1.5">
                {stallOutOfStock.slice(0, 3).map((item, i) => (
                  <div
                    key={`st-oos-${i}`}
                    className="flex items-center justify-between text-xs"
                  >
                    <span className="text-red-800 dark:text-red-300 truncate max-w-[70%]">
                      {item.name}
                    </span>
                    <span className="text-red-600 dark:text-red-400 shrink-0 font-medium">
                      0 units
                    </span>
                  </div>
                ))}
                {stallOutOfStock.length > 3 && (
                  <p className="text-xs text-red-500 font-medium">
                    +{stallOutOfStock.length - 3} more items
                  </p>
                )}
              </div>
            </div>
          </Link>
        )}

        {/* Stall Low Stock */}
        {stallLowStock.length > 0 && (
          <Link
            href="/inventory/stocks/stall?status=low_stock"
            className="block"
          >
            <div className="rounded-lg border border-amber-200 dark:border-amber-800 bg-amber-50/50 dark:bg-amber-900/10 p-3 hover:bg-amber-100/50 dark:hover:bg-amber-900/20 transition-colors cursor-pointer">
              <div className="flex items-center gap-2 mb-2">
                <Store className="size-4 text-amber-600" />
                <span className="text-sm font-semibold text-amber-700 dark:text-amber-400">
                  Stall - Low Stock ({stallLowStock.length})
                </span>
                <ArrowRight className="size-3.5 ml-auto text-amber-600" />
              </div>
              <div className="space-y-1.5">
                {stallLowStock.slice(0, 3).map((item, i) => (
                  <div
                    key={`st-low-${i}`}
                    className="flex items-center justify-between text-xs"
                  >
                    <span className="text-amber-800 dark:text-amber-300 truncate max-w-[50%]">
                      {item.name}
                    </span>
                    <span className="text-amber-600 dark:text-amber-400 shrink-0 font-medium">
                      {item.quantity} / {item.threshold}
                    </span>
                  </div>
                ))}
                {stallLowStock.length > 3 && (
                  <p className="text-xs text-amber-500 font-medium">
                    +{stallLowStock.length - 3} more items
                  </p>
                )}
              </div>
            </div>
          </Link>
        )}
      </CardContent>
    </Card>
  )
}
