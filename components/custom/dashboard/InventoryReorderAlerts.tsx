"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  useStallStocks,
  useStallStockStatusCounts,
  useStockRoomStocks,
  useStockRoomStatusCounts,
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
  // Fetch accurate counts from backend
  const { data: stallCounts } = useStallStockStatusCounts()
  const { data: stockRoomCounts } = useStockRoomStatusCounts()

  // Fetch filtered items for preview (only first 3 needed per category)
  const { data: stallNoStockData } = useStallStocks({
    limit: 3,
    filter: { status: "no_stock" },
  })
  const { data: stallLowStockData } = useStallStocks({
    limit: 3,
    filter: { status: "low_stock" },
  })
  const { data: srNoStockData } = useStockRoomStocks({
    limit: 3,
    filter: { status: "no_stock" },
  })
  const { data: srLowStockData } = useStockRoomStocks({
    limit: 3,
    filter: { status: "low_stock" },
  })

  const {
    stallOutOfStockItems,
    stallLowStockItems,
    stockRoomOutOfStockItems,
    stockRoomLowStockItems,
  } = useMemo(() => {
    const toAlertItems = (
      results: { item?: { name?: string; sku?: string }; available_quantity?: number; quantity?: number; low_stock_threshold?: number }[] | undefined,
      useAvailable = false,
    ): AlertItem[] =>
      (results ?? []).map((stock) => ({
        name: stock.item?.name ?? "Unknown",
        sku: stock.item?.sku ?? "",
        quantity: useAvailable
          ? (stock.available_quantity ?? stock.quantity ?? 0)
          : (stock.quantity ?? 0),
        threshold: stock.low_stock_threshold ?? 0,
      }))

    return {
      stallOutOfStockItems: toAlertItems(stallNoStockData?.results, true),
      stallLowStockItems: toAlertItems(stallLowStockData?.results, true),
      stockRoomOutOfStockItems: toAlertItems(srNoStockData?.results),
      stockRoomLowStockItems: toAlertItems(srLowStockData?.results),
    }
  }, [stallNoStockData, stallLowStockData, srNoStockData, srLowStockData])

  // Use backend counts (accurate across all pages)
  const stallNoStockCount = stallCounts?.no_stock ?? 0
  const stallLowStockCount = stallCounts?.low_stock ?? 0
  const srNoStockCount = stockRoomCounts?.no_stock ?? 0
  const srLowStockCount = stockRoomCounts?.low_stock ?? 0

  const total =
    stallNoStockCount + stallLowStockCount + srNoStockCount + srLowStockCount

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
          <div className="flex items-center justify-center gap-3 py-4 text-center">
            <Package className="size-5 text-muted-foreground/50" />
            <p className="text-sm text-muted-foreground">
              All stock levels are healthy
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
        {srNoStockCount > 0 && (
          <Link
            href="/inventory/stocks/stockroom?status=no_stock"
            className="block"
          >
            <div className="rounded-lg border border-red-200 dark:border-red-800 bg-red-50/50 dark:bg-red-900/10 p-3 hover:bg-red-100/50 dark:hover:bg-red-900/20 transition-colors cursor-pointer">
              <div className="flex items-center gap-2 mb-2">
                <Warehouse className="size-4 text-red-600" />
                <span className="text-sm font-semibold text-red-700 dark:text-red-400">
                  Stockroom - Out of Stock ({srNoStockCount})
                </span>
                <ArrowRight className="size-3.5 ml-auto text-red-600" />
              </div>
              <div className="space-y-1.5">
                {stockRoomOutOfStockItems.map((item, i) => (
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
                {srNoStockCount > 3 && (
                  <p className="text-xs text-red-500 font-medium">
                    +{srNoStockCount - 3} more items
                  </p>
                )}
              </div>
            </div>
          </Link>
        )}

        {/* Stockroom Low Stock */}
        {srLowStockCount > 0 && (
          <Link
            href="/inventory/stocks/stockroom?status=low_stock"
            className="block"
          >
            <div className="rounded-lg border border-amber-200 dark:border-amber-800 bg-amber-50/50 dark:bg-amber-900/10 p-3 hover:bg-amber-100/50 dark:hover:bg-amber-900/20 transition-colors cursor-pointer">
              <div className="flex items-center gap-2 mb-2">
                <Warehouse className="size-4 text-amber-600" />
                <span className="text-sm font-semibold text-amber-700 dark:text-amber-400">
                  Stockroom - Low Stock ({srLowStockCount})
                </span>
                <ArrowRight className="size-3.5 ml-auto text-amber-600" />
              </div>
              <div className="space-y-1.5">
                {stockRoomLowStockItems.map((item, i) => (
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
                {srLowStockCount > 3 && (
                  <p className="text-xs text-amber-500 font-medium">
                    +{srLowStockCount - 3} more items
                  </p>
                )}
              </div>
            </div>
          </Link>
        )}

        {/* Stall Out of Stock */}
        {stallNoStockCount > 0 && (
          <Link
            href="/inventory/stocks/stall?status=no_stock"
            className="block"
          >
            <div className="rounded-lg border border-red-200 dark:border-red-800 bg-red-50/50 dark:bg-red-900/10 p-3 hover:bg-red-100/50 dark:hover:bg-red-900/20 transition-colors cursor-pointer">
              <div className="flex items-center gap-2 mb-2">
                <Store className="size-4 text-red-600" />
                <span className="text-sm font-semibold text-red-700 dark:text-red-400">
                  Stall - Out of Stock ({stallNoStockCount})
                </span>
                <ArrowRight className="size-3.5 ml-auto text-red-600" />
              </div>
              <div className="space-y-1.5">
                {stallOutOfStockItems.map((item, i) => (
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
                {stallNoStockCount > 3 && (
                  <p className="text-xs text-red-500 font-medium">
                    +{stallNoStockCount - 3} more items
                  </p>
                )}
              </div>
            </div>
          </Link>
        )}

        {/* Stall Low Stock */}
        {stallLowStockCount > 0 && (
          <Link
            href="/inventory/stocks/stall?status=low_stock"
            className="block"
          >
            <div className="rounded-lg border border-amber-200 dark:border-amber-800 bg-amber-50/50 dark:bg-amber-900/10 p-3 hover:bg-amber-100/50 dark:hover:bg-amber-900/20 transition-colors cursor-pointer">
              <div className="flex items-center gap-2 mb-2">
                <Store className="size-4 text-amber-600" />
                <span className="text-sm font-semibold text-amber-700 dark:text-amber-400">
                  Stall - Low Stock ({stallLowStockCount})
                </span>
                <ArrowRight className="size-3.5 ml-auto text-amber-600" />
              </div>
              <div className="space-y-1.5">
                {stallLowStockItems.map((item, i) => (
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
                {stallLowStockCount > 3 && (
                  <p className="text-xs text-amber-500 font-medium">
                    +{stallLowStockCount - 3} more items
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
