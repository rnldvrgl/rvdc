"use client"

import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  useStallStocks,
  useStallStockStatusCounts,
  useStockRoomStatusCounts,
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

export function InventoryReorderAlerts({
  stallOnly = false,
}: {
  stallOnly?: boolean
}) {
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
      results:
        | {
            item?: { name?: string; sku?: string }
            available_quantity?: number
            quantity?: number
            low_stock_threshold?: number
          }[]
        | undefined,
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
  const srNoStockCount = stallOnly ? 0 : (stockRoomCounts?.no_stock ?? 0)
  const srLowStockCount = stallOnly ? 0 : (stockRoomCounts?.low_stock ?? 0)

  const total =
    stallNoStockCount + stallLowStockCount + srNoStockCount + srLowStockCount

  if (total === 0) {
    return (
      <Card className="h-full min-w-0">
        <CardHeader className="pb-3 px-4 sm:px-6">
          <CardTitle className="text-sm sm:text-base flex items-center gap-2 min-w-0">
            <div className="p-1.5 sm:p-2 rounded-lg bg-primary/10 shrink-0">
              <Package className="size-4 text-primary" />
            </div>
            <span className="truncate">Inventory Alerts</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="px-4 sm:px-6">
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
    <Card className="h-full min-w-0">
      <CardHeader className="pb-3 px-4 sm:px-6">
        <CardTitle className="text-sm sm:text-base flex items-center gap-2 min-w-0">
          <div className="p-1.5 sm:p-2 rounded-lg bg-primary/10 shrink-0">
            <Package className="size-4 text-primary" />
          </div>
          <span className="truncate">Inventory Alerts</span>
          <Badge
            variant="destructive"
            className="ml-auto text-xs shrink-0"
          >
            {total}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2 px-4 sm:px-6">
        {srNoStockCount > 0 && (
          <Link
            href="/inventory/stocks/stockroom?status=no_stock"
            className="group block"
          >
            <div className="flex items-center gap-2 sm:gap-3 p-2 sm:p-2.5 rounded-lg border hover:bg-muted/50 transition-all">
              <div className="p-1.5 rounded-md bg-red-100 dark:bg-red-950/50 shrink-0">
                <Warehouse className="size-3.5 text-destructive" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">Stockroom · Out of Stock</p>
                <p className="text-xs text-muted-foreground mt-0.5 truncate">
                  {stockRoomOutOfStockItems
                    .map((i) => i.name)
                    .slice(0, 2)
                    .join(", ")}
                  {srNoStockCount > 2 && ` +${srNoStockCount - 2} more`}
                </p>
              </div>
              <Badge
                variant="destructive"
                className="shrink-0 text-xs"
              >
                {srNoStockCount}
              </Badge>
              <ArrowRight className="size-3.5 text-muted-foreground shrink-0 transition-transform duration-200 group-hover:translate-x-0.5" />
            </div>
          </Link>
        )}

        {srLowStockCount > 0 && (
          <Link
            href="/inventory/stocks/stockroom?status=low_stock"
            className="group block"
          >
            <div className="flex items-center gap-2 sm:gap-3 p-2 sm:p-2.5 rounded-lg border hover:bg-muted/50 transition-all">
              <div className="p-1.5 rounded-md bg-amber-100 dark:bg-amber-950/50 shrink-0">
                <Warehouse className="size-3.5 text-warning" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">Stockroom · Low Stock</p>
                <p className="text-xs text-muted-foreground mt-0.5 truncate">
                  {stockRoomLowStockItems
                    .map((i) => i.name)
                    .slice(0, 2)
                    .join(", ")}
                  {srLowStockCount > 2 && ` +${srLowStockCount - 2} more`}
                </p>
              </div>
              <Badge
                variant="outline"
                className="shrink-0 text-xs border-amber-200 text-warning dark:border-amber-800"
              >
                {srLowStockCount}
              </Badge>
              <ArrowRight className="size-3.5 text-muted-foreground shrink-0 transition-transform duration-200 group-hover:translate-x-0.5" />
            </div>
          </Link>
        )}

        {stallNoStockCount > 0 && (
          <Link
            href="/inventory/stocks/stall?status=no_stock"
            className="group block"
          >
            <div className="flex items-center gap-2 sm:gap-3 p-2 sm:p-2.5 rounded-lg border hover:bg-muted/50 transition-all">
              <div className="p-1.5 rounded-md bg-red-100 dark:bg-red-950/50 shrink-0">
                <Store className="size-3.5 text-destructive" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">Stall · Out of Stock</p>
                <p className="text-xs text-muted-foreground mt-0.5 truncate">
                  {stallOutOfStockItems
                    .map((i) => i.name)
                    .slice(0, 2)
                    .join(", ")}
                  {stallNoStockCount > 2 && ` +${stallNoStockCount - 2} more`}
                </p>
              </div>
              <Badge
                variant="destructive"
                className="shrink-0 text-xs"
              >
                {stallNoStockCount}
              </Badge>
              <ArrowRight className="size-3.5 text-muted-foreground shrink-0 transition-transform duration-200 group-hover:translate-x-0.5" />
            </div>
          </Link>
        )}

        {stallLowStockCount > 0 && (
          <Link
            href="/inventory/stocks/stall?status=low_stock"
            className="group block"
          >
            <div className="flex items-center gap-2 sm:gap-3 p-2 sm:p-2.5 rounded-lg border hover:bg-muted/50 transition-all">
              <div className="p-1.5 rounded-md bg-amber-100 dark:bg-amber-950/50 shrink-0">
                <Store className="size-3.5 text-warning" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">Stall · Low Stock</p>
                <p className="text-xs text-muted-foreground mt-0.5 truncate">
                  {stallLowStockItems
                    .map((i) => i.name)
                    .slice(0, 2)
                    .join(", ")}
                  {stallLowStockCount > 2 && ` +${stallLowStockCount - 2} more`}
                </p>
              </div>
              <Badge
                variant="outline"
                className="shrink-0 text-xs border-amber-200 text-warning dark:border-amber-800"
              >
                {stallLowStockCount}
              </Badge>
              <ArrowRight className="size-3.5 text-muted-foreground shrink-0 transition-transform duration-200 group-hover:translate-x-0.5" />
            </div>
          </Link>
        )}
      </CardContent>
    </Card>
  )
}
