"use client"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Skeleton } from "@/components/ui/skeleton"
import { Stock, StockRoomStock } from "@/lib/constants/interface"
import { useStallStocks, useStockRoomStocks } from "@/lib/queries/inventory/useStocks"
import { Search } from "lucide-react"
import { useState } from "react"
import PullOutForm from "./PullOutForm"
import RestockForm from "./RestockForm"
import StockAuditDialog from "./StockAuditDialog"
import StockRoomAuditDialog from "./StockRoomAuditDialog"

interface StockOperationDialogProps {
  operation: "restock" | "audit" | "pullout"
  type: "stall" | "stock_room"
  onClose: () => void
}

export default function StockOperationDialog({
  operation,
  type,
  onClose,
}: StockOperationDialogProps) {
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedStock, setSelectedStock] = useState<Stock | StockRoomStock | null>(null)

  const { data: stallData, isLoading: stallLoading } = useStallStocks({
    search: searchQuery || undefined,
    limit: 10,
    page: 1,
  })

  const { data: stockroomData, isLoading: stockroomLoading } = useStockRoomStocks({
    search: searchQuery || undefined,
    limit: 10,
    page: 1,
  })

  const stocks = type === "stall" ? stallData?.results || [] : stockroomData?.results || []
  const isLoading = type === "stall" ? stallLoading : stockroomLoading

  const handleStockSelect = (stock: Stock | StockRoomStock) => {
    setSelectedStock(stock)
  }

  // If stock is selected, show the operation form
  if (selectedStock) {
    if (operation === "restock") {
      return (
        <RestockForm
          stock={selectedStock}
          type={type}
          onClose={onClose}
        />
      )
    }
    if (operation === "audit") {
      if (type === "stall") {
        return (
          <div className="space-y-4">
            <StockAuditDialog
              open={true}
              onClose={onClose}
              stock={selectedStock as Stock}
            />
          </div>
        )
      } else {
        return (
          <div className="space-y-4">
            <StockRoomAuditDialog
              open={true}
              onClose={onClose}
              stock={selectedStock as StockRoomStock}
            />
          </div>
        )
      }
    }
    if (operation === "pullout" && type === "stall") {
      return (
        <PullOutForm
          stock={selectedStock as Stock}
          onClose={onClose}
        />
      )
    }
  }

  // Show stock selector
  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-lg font-semibold mb-2">
          Select {type === "stall" ? "Stall Stock" : "Stockroom Item"}
        </h3>
        <p className="text-sm text-muted-foreground mb-4">
          Search and select{" "}
          {type === "stall" ? "a stall stock item" : "a stockroom item"} to{" "}
          {operation === "restock" && "add quantity"}
          {operation === "audit" && "audit"}
          {operation === "pullout" && "pull out"}
        </p>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search by item name, SKU, or category..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-9"
        />
      </div>

      <div className="border rounded-lg divide-y max-h-96 overflow-auto">
        {isLoading ? (
          Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="p-3 space-y-2">
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-3 w-1/2" />
            </div>
          ))
        ) : stocks.length === 0 ? (
          <div className="p-8 text-center text-muted-foreground">
            {searchQuery ? "No items found" : "No stock items available"}
          </div>
        ) : (
          stocks.map((stock) => {
            const isStallStock = "stall" in stock && stock.stall !== null && stock.stall !== undefined
            const stallName = isStallStock && typeof stock.stall === "object" && stock.stall && "name" in stock.stall 
              ? (stock.stall as { name: string }).name 
              : null
            
            return (
              <button
                key={stock.id}
                onClick={() => handleStockSelect(stock)}
                className="w-full p-3 text-left hover:bg-muted/50 transition-colors"
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">
                      {stock.item?.name || "Unknown Item"}
                    </p>
                    <div className="flex items-center gap-2 mt-1">
                      {stallName && (
                        <span className="text-xs text-muted-foreground">
                          {stallName}
                        </span>
                      )}
                      <span className="text-xs text-muted-foreground">
                        Qty: {stock.quantity || 0}
                      </span>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-sm font-semibold">
                      ₱{stock.item?.retail_price || "0.00"}
                    </span>
                  </div>
                </div>
              </button>
            )
          })
        )}
      </div>

      <div className="flex justify-end gap-2 pt-2">
        <Button variant="outline" onClick={onClose}>
          Cancel
        </Button>
      </div>
    </div>
  )
}
