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
import { RECENT_ITEMS_KEY, MAX_RECENT_ITEMS } from "@/lib/constants/general"
import { Item, ItemEntry } from "@/lib/constants/interface"
import { formatCurrency } from "@/lib/utils/currency"
import { cn } from "@/lib/utils/helpers"
import { AlertTriangle, Info, Minus, PackagePlus, Pencil, Plus, Star, X } from "lucide-react"
import { useCallback, useEffect, useMemo, useState } from "react"



// ── Theme helpers ────────────────────────────────────────────────────────────
const tint = (cssVar: string, pct = 12) =>
    `color-mix(in srgb, var(${cssVar}) ${pct}%, transparent)`

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
    onAddStock,
}: {
    items: ItemEntry[]
    allItems: Item[]
    onChange: (items: ItemEntry[]) => void
    disabled?: boolean
    allowPriceChange?: boolean
    stockMap?: Map<number, number>
    untrackedItemIds?: Set<number>
    onAddStock?: (itemId: number) => void
}) {
    const trackedItems = useMemo(
        () =>
            allItems.filter(
                (item) => item.is_tracked && !(untrackedItemIds?.has(item.id) ?? false),
            ),
        [allItems, untrackedItemIds],
    )

    const customItems = useMemo(
        () =>
            allItems.filter(
                (item) => !item.is_tracked || (untrackedItemIds?.has(item.id) ?? false),
            ),
        [allItems, untrackedItemIds],
    )

    const handleAdd = () => {
        if (trackedItems.length === 0) return
        const newItem: ItemEntry = {
            item: trackedItems[0],
            quantity: 1,
            ...(allowPriceChange
                ? {
                    final_price_per_unit: Number(trackedItems[0].retail_price),
                    print_price_per_unit: Number(trackedItems[0].retail_price),
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
                                print_price_per_unit: Number(newItem.retail_price),
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

    const [editingQty, setEditingQty] = useState<Record<number, string>>({})
    const [newlyAddedIdx, setNewlyAddedIdx] = useState<number | null>(null)
    const [recentIds, setRecentIds] = useState<number[]>([])

    useEffect(() => {
        setRecentIds(getRecentItemIds())
    }, [])

    const recentItems = recentIds
        .map((id) => trackedItems.find((item) => item.id === id))
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
                        const isMissingName = isCustom && !(itm.description ?? "").trim()
                        const isZeroPrice =
                            !isCustom && allowPriceChange && retail > 0 && effective === 0

                        const cardStyle = isMissingName
                            ? { borderColor: tint("--destructive", 55), backgroundColor: tint("--destructive", 8) }
                            : isOverStock
                                ? { borderColor: tint("--warning", 50), backgroundColor: tint("--warning", 10) }
                                : isCustom
                                    ? { borderColor: tint("--primary", 45), backgroundColor: tint("--primary", 8) }
                                    : undefined

                        return (
                            <div
                                key={(itm.item?.id ?? "custom") + "-" + idx}
                                className={`rounded-lg border p-3 space-y-2 transition-colors ${!isOverStock && !isCustom ? "hover:bg-muted/30" : ""
                                    }`}
                                style={cardStyle}
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
                                                    options={customItems
                                                        .map((c) => ({
                                                            label: `${c.name} — ${formatCurrency(c.retail_price)}`,
                                                            value: c.id.toString(),
                                                        }))}
                                                    placeholder="Select custom item or type below..."
                                                    searchPlaceholder="Search custom items..."
                                                />
                                                <div className="flex items-center gap-2">
                                                    <div className="flex items-center gap-1.5 shrink-0">
                                                        <Pencil className="size-3.5" style={{ color: isMissingName ? "var(--destructive)" : "var(--primary)" }} />
                                                        <span
                                                            className="text-[10px] font-medium uppercase tracking-wide"
                                                            style={{ color: isMissingName ? "var(--destructive)" : "var(--primary)" }}
                                                        >
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
                                                        className={cn(
                                                            "h-8",
                                                            isMissingName && "border-destructive focus-visible:ring-destructive/40",
                                                        )}
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
                                                            ? `${c.name} (Custom)`
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
                                                step={"any"}
                                                value={editingQty[idx] ?? itm.quantity}
                                                onChange={(e) => {
                                                    setEditingQty((prev) => ({
                                                        ...prev,
                                                        [idx]: e.target.value,
                                                    }))
                                                }}
                                                onWheel={(e) => e.preventDefault()}
                                                onBlur={() => {
                                                    const raw = editingQty[idx]
                                                    if (raw !== undefined) {
                                                        const min = stepAmount(itm.item)
                                                        const parsed = parseFloat(raw)
                                                        const rounded =
                                                            parsed > 0
                                                                ? Math.max(min, Math.round(parsed * 100) / 100)
                                                                : min
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
                                                    onWheel={(e) => e.preventDefault()}
                                                    disabled={disabled}
                                                    className={cn(
                                                        "h-8",
                                                        isZeroPrice && "border-warning focus-visible:ring-warning/40",
                                                    )}
                                                />
                                            </div>

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
                                                    onWheel={(e) => e.preventDefault()}
                                                    disabled={disabled}
                                                    className="h-8"
                                                />
                                            </div>
                                        </>
                                    )}

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
                                    isMissingName ||
                                    isZeroPrice ||
                                    allowPriceChange) && (
                                        <div className="flex items-center gap-3 flex-wrap text-xs text-muted-foreground">
                                            {isMissingName && (
                                                <span
                                                    className="flex items-center gap-0.5 font-medium"
                                                    style={{ color: "var(--destructive)" }}
                                                >
                                                    <AlertTriangle className="size-3" />
                                                    Name required
                                                </span>
                                            )}
                                            {isUntracked ? (
                                                <span
                                                    className="font-medium"
                                                    style={{ color: "color-mix(in srgb, var(--primary) 80%, transparent)" }}
                                                >
                                                    Custom
                                                </span>
                                            ) : availableStock !== undefined ? (
                                                <span
                                                    style={
                                                        availableStock <= 0
                                                            ? { color: "var(--destructive)", fontWeight: 500 }
                                                            : availableStock <= 5
                                                                ? { color: "var(--warning)" }
                                                                : undefined
                                                    }
                                                >
                                                    Stock: {availableStock}
                                                </span>
                                            ) : null}
                                            {isOverStock && (
                                                <span
                                                    className="flex items-center gap-0.5"
                                                    style={{ color: "var(--warning)" }}
                                                >
                                                    <AlertTriangle className="size-3" />
                                                    Exceeds stock
                                                </span>
                                            )}
                                            {isZeroPrice && (
                                                <span
                                                    className="flex items-center gap-0.5"
                                                    style={{ color: "var(--warning)" }}
                                                >
                                                    <AlertTriangle className="size-3" />
                                                    Selling for ₱0
                                                </span>
                                            )}
                                            {!isUntracked && availableStock !== undefined && availableStock <= 0 && onAddStock && itm.item && (
                                                <TooltipProvider>
                                                    <Tooltip>
                                                        <TooltipTrigger asChild>
                                                            <Button
                                                                type="button"
                                                                variant="outline"
                                                                size="sm"
                                                                className="h-5 px-1.5 text-[10px]"
                                                                style={{
                                                                    borderColor: tint("--warning", 40),
                                                                    color: "var(--warning)",
                                                                }}
                                                                onClick={() => onAddStock(itm.item!.id)}
                                                            >
                                                                <PackagePlus className="size-3 mr-0.5" />
                                                                Add Stock
                                                            </Button>
                                                        </TooltipTrigger>
                                                        <TooltipContent>
                                                            <p>Directly add stall stock for this item</p>
                                                        </TooltipContent>
                                                    </Tooltip>
                                                </TooltipProvider>
                                            )}
                                            {isDuplicate && (
                                                <span
                                                    className="flex items-center gap-0.5"
                                                    style={{ color: "var(--warning)" }}
                                                >
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
                                className="flex-1 border-dashed"
                                style={{
                                    borderColor: tint("--primary", 40),
                                    color: "var(--primary)",
                                }}
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
