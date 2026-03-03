"use client"

import { ComboBox } from "@/components/custom/inputs/ComboBox"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { Item, ItemEntry } from "@/lib/constants/interface"
import { formatCurrency } from "@/lib/utils/helpers"
import { AlertTriangle, Minus, Plus, X } from "lucide-react"

export default function ItemQuantitySelector({
  items,
  allItems,
  onChange,
  disabled,
  required = false,
  allowPriceChange,
  stockMap,
}: {
  items: ItemEntry[]
  allItems: Item[]
  onChange: (items: ItemEntry[]) => void
  disabled?: boolean
  allowPriceChange?: boolean
  required?: boolean
  /** Map of item_id -> available_quantity for stock display */
  stockMap?: Map<number, number>
}) {
  const handleAdd = () => {
    if (allItems.length === 0) return
    const newItem: ItemEntry = {
      item: allItems[0],
      quantity: 1,
      ...(allowPriceChange
        ? {
            final_price_per_unit: Number(allItems[0].retail_price),
            print_price_per_unit: Number(allItems[0].retail_price),
          }
        : {}),
    }
    onChange([...items, newItem])
  }

  /** Check if an item is duplicated in the list */
  const getDuplicateIndices = () => {
    const seen = new Map<number, number[]>()
    items.forEach((itm, idx) => {
      const id = itm.item.id
      if (!seen.has(id)) seen.set(id, [])
      seen.get(id)!.push(idx)
    })
    const dupes = new Set<number>()
    seen.forEach((indices) => {
      if (indices.length > 1) indices.forEach((i) => dupes.add(i))
    })
    return dupes
  }
  const duplicateIndices = getDuplicateIndices()

  /** Get available stock for an item */
  const getAvailableStock = (itemId: number): number | undefined => {
    return stockMap?.get(itemId)
  }

  const handleUpdate = <K extends keyof ItemEntry>(
    idx: number,
    key: K,
    value: ItemEntry[K],
  ) => {
    onChange(
      items.map((itm, i) => (i === idx ? { ...itm, [key]: value } : itm)),
    )
  }

  const handleUpdateItem = (idx: number, newItem: Item) => {
    onChange(
      items.map((itm, i) =>
        i === idx
          ? {
              ...itm,
              item: newItem,
              ...(allowPriceChange
                ? {
                    final_price_per_unit: Number(newItem.retail_price),
                    print_price_per_unit: Number(newItem.retail_price), // NEW
                  }
                : {}),
            }
          : itm,
      ),
    )
  }

  const handleRemove = (idx: number) => {
    onChange(items.filter((_, i) => i !== idx))
  }

  const getPrices = (itm: ItemEntry) => {
    const retail = Number(itm.item.retail_price) || 0
    const wholesale = Number(itm.item.wholesale_price) || 0
    const technician = Number(itm.item.technician_price) || 0
    const effective = allowPriceChange
      ? (itm.final_price_per_unit ?? retail)
      : retail
    return { retail, wholesale, technician, effective }
  }

  const grandTotal = items.reduce((sum, itm) => {
    const { effective } = getPrices(itm)
    return sum + itm.quantity * effective
  }, 0)

  return (
    <div className="space-y-2">
      {items.length > 0 ? (
        <div className="space-y-2">
          {items.map((itm, idx) => {
            const { retail, wholesale, technician, effective } = getPrices(itm)
            const lineTotal = itm.quantity * effective
            const availableStock = getAvailableStock(itm.item.id)
            const isOverStock =
              availableStock !== undefined && itm.quantity > availableStock
            const isDuplicate = duplicateIndices.has(idx)
            return (
              <div
                key={itm.item.id + "-" + idx}
                className={`rounded-lg border p-3 space-y-2 transition-colors ${
                  isOverStock
                    ? "border-amber-400/60 dark:border-amber-600/40 bg-amber-50/30 dark:bg-amber-950/10"
                    : "hover:bg-muted/30"
                }`}
              >
                {/* Row 1: Item selector + remove */}
                <div className="flex items-center gap-2">
                  <div className="flex-1 min-w-0">
                    <ComboBox
                      disabled={disabled}
                      onChange={(val) => {
                        const found = allItems.find(
                          (c) => c.id.toString() === val,
                        )
                        if (found) handleUpdateItem(idx, found)
                      }}
                      value={itm.item.id.toString()}
                      options={allItems.map((c) => {
                        const stock = getAvailableStock(c.id)
                        return {
                          label:
                            stock !== undefined
                              ? `${c.name} (${stock})`
                              : c.name,
                          value: c.id.toString(),
                        }
                      })}
                      placeholder="Select item"
                    />
                  </div>
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="size-7 shrink-0 text-muted-foreground hover:text-destructive"
                          onClick={() => handleRemove(idx)}
                          disabled={disabled}
                        >
                          <X className="size-3.5" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent side="left">
                        <p>Remove item</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>

                {/* Row 2: Qty + Prices + Total */}
                <div className="flex items-start gap-2 flex-wrap sm:flex-nowrap">
                  {/* Quantity stepper */}
                  <div className="space-y-1">
                    <span className="text-[10px] text-muted-foreground uppercase tracking-wide">
                      Qty
                    </span>
                    <div className="flex items-center">
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              type="button"
                              variant="outline"
                              size="icon"
                              className="size-8 rounded-r-none"
                              onClick={() =>
                                handleUpdate(
                                  idx,
                                  "quantity",
                                  Math.max(1, itm.quantity - 1),
                                )
                              }
                              disabled={disabled || itm.quantity <= 1}
                            >
                              <Minus className="size-3" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>Decrease quantity</p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                      <Input
                        type="number"
                        min={1}
                        value={itm.quantity}
                        onChange={(e) =>
                          handleUpdate(
                            idx,
                            "quantity",
                            parseInt(e.target.value) || 1,
                          )
                        }
                        className="h-8 w-14 rounded-none border-x-0 text-center [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                        disabled={disabled}
                      />
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              type="button"
                              variant="outline"
                              size="icon"
                              className="size-8 rounded-l-none"
                              onClick={() =>
                                handleUpdate(idx, "quantity", itm.quantity + 1)
                              }
                              disabled={disabled}
                            >
                              <Plus className="size-3" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>Increase quantity</p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </div>
                  </div>

                  {allowPriceChange && (
                    <>
                      {/* Sell price */}
                      <div className="space-y-1 w-28">
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <span className="text-[10px] text-muted-foreground uppercase tracking-wide cursor-help">
                                Sell
                              </span>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>Discounted selling price charged to client</p>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                        <Input
                          type="number"
                          min={0}
                          step="0.01"
                          value={itm.final_price_per_unit ?? retail}
                          onChange={(e) =>
                            handleUpdate(
                              idx,
                              "final_price_per_unit",
                              parseFloat(e.target.value) || 0,
                            )
                          }
                          disabled={disabled}
                          className="h-8"
                        />
                      </div>

                      {/* Print price */}
                      <div className="space-y-1 w-28">
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <span className="text-[10px] text-muted-foreground uppercase tracking-wide cursor-help">
                                Print
                              </span>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>Price printed on the receipt</p>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                        <Input
                          type="number"
                          min={0}
                          step="0.01"
                          value={
                            itm.print_price_per_unit ?? itm.item.retail_price
                          }
                          onChange={(e) =>
                            handleUpdate(
                              idx,
                              "print_price_per_unit",
                              parseFloat(e.target.value) || 0,
                            )
                          }
                          disabled={disabled}
                          className="h-8"
                        />
                      </div>
                    </>
                  )}

                  {/* Line total (pushed right) */}
                  <div className="space-y-1 ml-auto text-right">
                    <span className="text-[10px] text-muted-foreground uppercase tracking-wide">
                      Total
                    </span>
                    <p className="h-8 flex items-center justify-end font-semibold text-sm tabular-nums">
                      {formatCurrency(lineTotal)}
                    </p>
                  </div>
                </div>

                {/* Row 3: Indicators */}
                {(availableStock !== undefined ||
                  isDuplicate ||
                  isOverStock ||
                  allowPriceChange) && (
                  <div className="flex items-center gap-3 flex-wrap text-xs text-muted-foreground">
                    {availableStock !== undefined && (
                      <span
                        className={
                          availableStock <= 0
                            ? "text-destructive font-medium"
                            : availableStock <= 5
                              ? "text-amber-600 dark:text-amber-400"
                              : ""
                        }
                      >
                        Stock: {availableStock}
                      </span>
                    )}
                    {isOverStock && (
                      <span className="text-amber-600 dark:text-amber-400 flex items-center gap-0.5">
                        <AlertTriangle className="size-3" />
                        Exceeds stock
                      </span>
                    )}
                    {isDuplicate && (
                      <span className="text-amber-600 dark:text-amber-400 flex items-center gap-0.5">
                        <AlertTriangle className="size-3" />
                        Duplicate
                      </span>
                    )}
                    {allowPriceChange && (
                      <span>
                        R: {formatCurrency(retail)} · W:{" "}
                        {formatCurrency(wholesale)} · T:{" "}
                        {formatCurrency(technician)}
                      </span>
                    )}
                  </div>
                )}
              </div>
            )
          })}

          {/* Grand total */}
          <div className="flex justify-end pt-1 pr-3">
            <span className="text-sm font-semibold tabular-nums">
              Total: {formatCurrency(grandTotal)}
            </span>
          </div>
        </div>
      ) : (
        <div className="py-6 text-center text-sm text-muted-foreground border border-dashed rounded-lg">
          No items added yet
        </div>
      )}

      {/* Add button */}
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="w-full border-dashed"
              onClick={handleAdd}
              disabled={disabled || allItems.length === 0}
            >
              <Plus className="size-3.5 mr-1.5" />
              Add Item
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>Add a new item to the transaction</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    </div>
  )
}
