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
import { AlertTriangle, Info, Minus, Pencil, Plus, Star, X } from "lucide-react"
import { useCallback, useEffect, useState } from "react"

const RECENT_ITEMS_KEY = "rvdc_recent_sale_items"
const MAX_RECENT_ITEMS = 8

function getRecentItemIds(): number[] {
  try {
    const stored = localStorage.getItem(RECENT_ITEMS_KEY)
    return stored ? JSON.parse(stored) : []
  } catch {
    return []
  }
}

function addRecentItemId(id: number) {
  const recent = getRecentItemIds().filter((i) => i !== id)
  recent.unshift(id)
  localStorage.setItem(
    RECENT_ITEMS_KEY,
    JSON.stringify(recent.slice(0, MAX_RECENT_ITEMS)),
  )
}

export default function ItemQuantitySelector({
  items,
  allItems,
  onChange,
  disabled,
  allowPriceChange,
  stockMap,
  untrackedItemIds,
}: {
  items: ItemEntry[]
  allItems: Item[]
  onChange: (items: ItemEntry[]) => void
  disabled?: boolean
  allowPriceChange?: boolean
  /** Map of item_id -> available_quantity for stock display */
  stockMap?: Map<number, number>
  /** Set of item IDs that have track_stock=false (skip stock display) */
  untrackedItemIds?: Set<number>
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
    setNewlyAddedIdx(items.length)
    onChange([...items, newItem])
  }

  const handleAddCustom = () => {
    const customItem: ItemEntry = {
      item: null,
      description: "",
      quantity: 1,
      final_price_per_unit: 0,
    }
    onChange([...items, customItem])
  }

  /** Check if an item is duplicated in the list */
  const getDuplicateIndices = () => {
    const seen = new Map<number, number[]>()
    items.forEach((itm, idx) => {
      if (!itm.item) return
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
    if (idx === newlyAddedIdx) setNewlyAddedIdx(null)
    addRecentItemId(newItem.id)
    setRecentIds(getRecentItemIds())
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

  // Track which quantity inputs are being actively edited (so we don't override user typing)
  const [editingQty, setEditingQty] = useState<Record<number, string>>({})

  // Track previously-added item index so we can auto-open its ComboBox
  const [newlyAddedIdx, setNewlyAddedIdx] = useState<number | null>(null)

  // Recent items for quick-add grid
  const [recentIds, setRecentIds] = useState<number[]>([])
  useEffect(() => {
    setRecentIds(getRecentItemIds())
  }, [])

  const recentItems = recentIds
    .map((id) => allItems.find((item) => item.id === id))
    .filter((item): item is Item => !!item)

  const handleQuickAdd = useCallback(
    (item: Item) => {
      const newItem: ItemEntry = {
        item,
        quantity: 1,
        ...(allowPriceChange
          ? {
              final_price_per_unit: Number(item.retail_price),
              print_price_per_unit: Number(item.retail_price),
            }
          : {}),
      }
      addRecentItemId(item.id)
      setRecentIds(getRecentItemIds())
      onChange([...items, newItem])
    },
    [items, onChange, allowPriceChange],
  )

  const allowsDecimal = (item: Item | null) =>
    !!item && ["kg", "ft"].includes(item.unit_of_measure)
  const stepAmount = (item: Item | null) => {
    if (!item) return 1
    if (item.unit_of_measure === "kg") return 0.25
    if (item.unit_of_measure === "ft") return 0.5
    return 1
  }

  const getPrices = (itm: ItemEntry) => {
    if (!itm.item) {
      const effective = itm.final_price_per_unit ?? 0
      return { retail: 0, wholesale: 0, technician: 0, effective }
    }
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
            const isCustom = !itm.item
            const { retail, wholesale, technician, effective } = getPrices(itm)
            const lineTotal = itm.quantity * effective
            const availableStock = itm.item
              ? getAvailableStock(itm.item.id)
              : undefined
            const isUntracked = itm.item
              ? (!itm.item.is_tracked || (untrackedItemIds?.has(itm.item.id) ?? false))
              : false
            const isOverStock =
              !isUntracked &&
              availableStock !== undefined &&
              itm.quantity > availableStock
            const isDuplicate = duplicateIndices.has(idx)
            return (
              <div
                key={(itm.item?.id ?? "custom") + "-" + idx}
                className={`rounded-lg border p-3 space-y-2 transition-colors ${
                  isOverStock
                    ? "border-amber-400/60 dark:border-amber-600/40 bg-amber-50/30 dark:bg-amber-950/10"
                    : isCustom
                      ? "border-violet-300/60 dark:border-violet-600/40 bg-violet-50/20 dark:bg-violet-950/10"
                      : "hover:bg-muted/30"
                }`}
              >
                {/* Row 1: Item selector / Custom description + remove */}
                <div className="flex items-center gap-2">
                  <div className="flex-1 min-w-0">
                    {isCustom ? (
                      <div className="space-y-2">
                        <ComboBox
                          disabled={disabled}
                          onChange={(val) => {
                            if (!val) return
                            const found = allItems.find(
                              (c) => c.id.toString() === val,
                            )
                            if (found) {
                              onChange(
                                items.map((it, i) =>
                                  i === idx
                                    ? {
                                        ...it,
                                        description: found.name,
                                        final_price_per_unit:
                                          Number(found.retail_price) || 0,
                                        print_price_per_unit:
                                          Number(found.retail_price) || 0,
                                      }
                                    : it,
                                ),
                              )
                            }
                          }}
                          value=""
                          options={allItems
                            .filter(
                              (c) =>
                                !c.is_tracked ||
                                (untrackedItemIds?.has(c.id) ?? false),
                            )
                            .map((c) => ({
                              label: `${c.name} — ${formatCurrency(c.retail_price)}`,
                              value: c.id.toString(),
                            }))}
                          placeholder="Select untracked item or type below..."
                          searchPlaceholder="Search untracked items..."
                        />
                        <div className="flex items-center gap-2">
                          <div className="flex items-center gap-1.5 shrink-0">
                            <Pencil className="size-3.5 text-violet-500" />
                            <span className="text-[10px] font-medium text-violet-600 dark:text-violet-400 uppercase tracking-wide">
                              Name
                            </span>
                          </div>
                          <Input
                            placeholder="e.g. Motor Rewind"
                            value={itm.description ?? ""}
                            onChange={(e) =>
                              handleUpdate(idx, "description", e.target.value)
                            }
                            disabled={disabled}
                            className="h-8"
                          />
                        </div>
                      </div>
                    ) : (
                      <ComboBox
                        disabled={disabled}
                        onChange={(val) => {
                          const found = allItems.find(
                            (c) => c.id.toString() === val,
                          )
                          if (found) handleUpdateItem(idx, found)
                        }}
                        value={itm.item?.id.toString() ?? ""}
                        options={allItems.map((c) => {
                          const isItemUntracked =
                            untrackedItemIds?.has(c.id) ?? false
                          const stock = getAvailableStock(c.id)
                          return {
                            label: isItemUntracked
                              ? `${c.name} (Untracked)`
                              : stock !== undefined
                                ? `${c.name} (${stock})`
                                : c.name,
                            value: c.id.toString(),
                          }
                        })}
                        placeholder="Select item"
                        autoOpen={idx === newlyAddedIdx}
                      />
                    )}
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
                <div className="flex items-end gap-2 flex-wrap sm:flex-nowrap">
                  {/* Quantity stepper */}
                  <div className="space-y-1">
                    <div className="flex items-center gap-1">
                      <span className="text-[10px] text-muted-foreground uppercase tracking-wide">
                        Qty
                      </span>
                      {itm.item?.unit_of_measure === "kg" && (
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Info className="size-3 text-muted-foreground hover:text-foreground transition-colors cursor-help" />
                            </TooltipTrigger>
                            <TooltipContent
                              side="right"
                              className="max-w-[200px]"
                            >
                              <div className="space-y-1.5">
                                <p className="font-semibold text-xs">
                                  Fraction to Decimal:
                                </p>
                                <div className="grid grid-cols-2 gap-x-3 gap-y-0.5 text-xs">
                                  <span>1/4 kg</span>
                                  <span className="font-mono">= 0.25</span>
                                  <span>1/2 kg</span>
                                  <span className="font-mono">= 0.5</span>
                                  <span>3/4 kg</span>
                                  <span className="font-mono">= 0.75</span>
                                  <span>1 kg</span>
                                  <span className="font-mono">= 1</span>
                                </div>
                              </div>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      )}
                    </div>
                    <div className="flex items-center">
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              type="button"
                              variant="outline"
                              size="icon"
                              className="size-8 rounded-r-none"
                              onClick={() => {
                                const step = stepAmount(itm.item)
                                const newVal = Math.max(
                                  step,
                                  Math.round((itm.quantity - step) * 100) / 100,
                                )
                                handleUpdate(idx, "quantity", newVal)
                                setEditingQty((prev) => {
                                  const next = { ...prev }
                                  delete next[idx]
                                  return next
                                })
                              }}
                              disabled={
                                disabled || itm.quantity <= stepAmount(itm.item)
                              }
                            >
                              <Minus className="size-3" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>Decrease by {stepAmount(itm.item)}</p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                      <Input
                        type="number"
                        min={
                          itm.item?.unit_of_measure === "kg"
                            ? 0.25
                            : itm.item?.unit_of_measure === "ft"
                              ? 0.01
                              : 1
                        }
                        step={allowsDecimal(itm.item) ? "any" : "1"}
                        value={editingQty[idx] ?? itm.quantity}
                        onChange={(e) => {
                          setEditingQty((prev) => ({
                            ...prev,
                            [idx]: e.target.value,
                          }))
                        }}
                        onBlur={() => {
                          const raw = editingQty[idx]
                          if (raw !== undefined) {
                            const parsed = parseFloat(raw)
                            const rounded = allowsDecimal(itm.item)
                              ? parsed > 0
                                ? Math.round(parsed * 100) / 100
                                : 0.01
                              : parsed > 0
                                ? Math.round(parsed) || 1
                                : 1
                            handleUpdate(idx, "quantity", rounded)
                            setEditingQty((prev) => {
                              const next = { ...prev }
                              delete next[idx]
                              return next
                            })
                          }
                        }}
                        className="h-8 w-16 rounded-none border-x-0 text-center [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
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
                              onClick={() => {
                                const step = stepAmount(itm.item)
                                const newVal =
                                  Math.round((itm.quantity + step) * 100) / 100
                                handleUpdate(idx, "quantity", newVal)
                                setEditingQty((prev) => {
                                  const next = { ...prev }
                                  delete next[idx]
                                  return next
                                })
                              }}
                              disabled={disabled}
                            >
                              <Plus className="size-3" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>Increase by {stepAmount(itm.item)}</p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </div>
                  </div>

                  {(allowPriceChange || isCustom) && (
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
                            itm.print_price_per_unit ??
                            itm.final_price_per_unit ??
                            (itm.item ? Number(itm.item.retail_price) : 0)
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
                  isUntracked ||
                  isDuplicate ||
                  isOverStock ||
                  allowPriceChange) && (
                  <div className="flex items-center gap-3 flex-wrap text-xs text-muted-foreground">
                    {isUntracked ? (
                      <span className="text-violet-600 dark:text-violet-400 font-medium">
                        Untracked
                      </span>
                    ) : availableStock !== undefined ? (
                      <span
                        className={
                          availableStock <= 0
                            ? "text-destructive font-medium"
                            : availableStock <= 5
                              ? "text-warning"
                              : ""
                        }
                      >
                        Stock: {availableStock}
                      </span>
                    ) : null}
                    {isOverStock && (
                      <span className="text-warning flex items-center gap-0.5">
                        <AlertTriangle className="size-3" />
                        Exceeds stock
                      </span>
                    )}
                    {isDuplicate && (
                      <span className="text-warning flex items-center gap-0.5">
                        <AlertTriangle className="size-3" />
                        Duplicate
                      </span>
                    )}
                    {allowPriceChange && !isCustom && (
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

      {/* Recent items quick-add */}
      {recentItems.length > 0 && !disabled && (
        <div className="space-y-1.5">
          <span className="text-[10px] text-muted-foreground uppercase tracking-wide flex items-center gap-1">
            <Star className="size-3" />
            Recent
          </span>
          <div className="flex flex-wrap gap-1.5">
            {recentItems.map((item) => {
              const stock = stockMap?.get(item.id)
              const isUntracked = untrackedItemIds?.has(item.id) ?? false
              return (
                <Button
                  key={item.id}
                  type="button"
                  variant="outline"
                  size="sm"
                  className="h-7 text-xs px-2.5"
                  onClick={() => handleQuickAdd(item)}
                >
                  {item.name}
                  {!isUntracked && stock !== undefined && (
                    <span className="ml-1 text-muted-foreground">
                      ({stock})
                    </span>
                  )}
                </Button>
              )
            })}
          </div>
        </div>
      )}

      {/* Add buttons */}
      <div className="flex gap-2">
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="flex-1 border-dashed"
                onClick={handleAdd}
                disabled={disabled || allItems.length === 0}
              >
                <Plus className="size-3.5 mr-1.5" />
                Add Item
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Add an inventory item</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="flex-1 border-dashed border-violet-300 dark:border-violet-700 text-violet-600 dark:text-violet-400 hover:bg-violet-50 dark:hover:bg-violet-950/30"
                onClick={handleAddCustom}
                disabled={disabled}
              >
                <Pencil className="size-3.5 mr-1.5" />
                Custom Item
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Add a non-inventory item (e.g. Motor Rewind)</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>
    </div>
  )
}
