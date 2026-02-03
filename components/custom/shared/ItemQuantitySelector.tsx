"use client"

import { ComboBox } from "@/components/custom/inputs/ComboBox"
import { Button } from "@/components/ui/button"
import { FormLabel } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Item, ItemEntry } from "@/lib/constants/interface"
import { formatCurrency } from "@/lib/utils/helpers"
import { Plus, Trash2 } from "lucide-react"

export default function ItemQuantitySelector({
  items,
  allItems,
  onChange,
  disabled,
  required = false,
  allowPriceChange,
}: {
  items: ItemEntry[]
  allItems: Item[]
  onChange: (items: ItemEntry[]) => void
  disabled?: boolean
  allowPriceChange?: boolean
  required?: boolean
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

  const tableColSpan = allowPriceChange ? 8 : 5

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center mb-3">
        <FormLabel required={required}>Items</FormLabel>
        <Button
          type="button"
          size="sm"
          onClick={handleAdd}
          disabled={disabled || allItems.length === 0}
          className="flex items-center gap-1"
        >
          <Plus className="size-4" />
          Add Item
        </Button>
      </div>

      {/* Desktop Table */}
      <div className="hidden md:block">
        <div className="border rounded-xl overflow-hidden shadow-sm">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted">
                <TableHead className="min-w-[250px]">Item</TableHead>
                <TableHead className="min-w-[100px]">Qty</TableHead>

                <TableHead
                  className={`min-w-[140px] ${!allowPriceChange ? "hidden" : ""}`}
                >
                  Discounted Price
                </TableHead>

                <TableHead
                  className={`min-w-[140px] ${!allowPriceChange ? "hidden" : ""}`}
                >
                  Print Price
                </TableHead>

                <TableHead className="min-w-[120px]">Retail Price</TableHead>

                <TableHead
                  className={`min-w-[140px] ${!allowPriceChange ? "hidden" : ""}`}
                >
                  Wholesale Price
                </TableHead>

                <TableHead
                  className={`min-w-[140px] ${!allowPriceChange ? "hidden" : ""}`}
                >
                  Technician Price
                </TableHead>

                <TableHead className="min-w-[120px] text-right">
                  Total
                </TableHead>
                <TableHead className="w-12" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {items.length > 0 ? (
                <>
                  {items.map((itm, idx) => {
                    const { retail, wholesale, technician, effective } =
                      getPrices(itm)
                    const lineTotal = itm.quantity * effective
                    return (
                      <TableRow
                        key={itm.item.id + "-" + idx}
                        className="hover:bg-muted/50 transition-colors"
                      >
                        <TableCell>
                          <ComboBox
                            disabled={disabled}
                            onChange={(val) => {
                              const found = allItems.find(
                                (c) => c.id.toString() === val,
                              )
                              if (found) handleUpdateItem(idx, found)
                            }}
                            value={itm.item.id.toString()}
                            options={allItems.map((c) => ({
                              label: c.name,
                              value: c.id.toString(),
                            }))}
                            placeholder="Select item"
                          />
                        </TableCell>
                        <TableCell>
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
                            className="w-full"
                            disabled={disabled}
                          />
                        </TableCell>
                        {allowPriceChange && (
                          <>
                            <TableCell>
                              <Input
                                type="number"
                                min={0}
                                value={itm.final_price_per_unit ?? retail}
                                onChange={(e) =>
                                  handleUpdate(
                                    idx,
                                    "final_price_per_unit",
                                    parseFloat(e.target.value) || 0,
                                  )
                                }
                                disabled={disabled}
                                placeholder="Price"
                              />
                            </TableCell>
                            <TableCell>
                              <Input
                                type="number"
                                min={0}
                                value={
                                  itm.print_price_per_unit ??
                                  itm.item.retail_price
                                }
                                onChange={(e) =>
                                  handleUpdate(
                                    idx,
                                    "print_price_per_unit",
                                    parseFloat(e.target.value) || 0,
                                  )
                                }
                                disabled={disabled}
                                placeholder="Print Price"
                              />
                            </TableCell>
                          </>
                        )}
                        <TableCell className="text-muted-foreground">
                          {formatCurrency(retail)}
                        </TableCell>
                        {allowPriceChange && (
                          <>
                            <TableCell className="text-muted-foreground">
                              {formatCurrency(wholesale)}
                            </TableCell>
                            <TableCell className="text-muted-foreground">
                              {formatCurrency(technician)}
                            </TableCell>
                          </>
                        )}
                        <TableCell className="font-semibold text-right">
                          {formatCurrency(lineTotal)}
                        </TableCell>
                        <TableCell>
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            onClick={() => handleRemove(idx)}
                            disabled={disabled}
                          >
                            <Trash2 className="size-4 text-destructive" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    )
                  })}
                  <TableRow className="bg-muted/70 font-semibold">
                    <TableCell
                      colSpan={tableColSpan - 1}
                      className="text-right"
                    >
                      Grand Total:
                    </TableCell>
                    <TableCell className="text-right font-bold">
                      {formatCurrency(grandTotal)}
                    </TableCell>
                    <TableCell />
                  </TableRow>
                </>
              ) : (
                <TableRow>
                  <TableCell
                    colSpan={tableColSpan + 1}
                    className="text-center py-8 text-muted-foreground"
                  >
                    No items added
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      {/* Mobile Layout */}
      <div className="md:hidden space-y-4">
        {items.length > 0 ? (
          <>
            {items.map((itm, idx) => {
              const { retail, wholesale, technician, effective } =
                getPrices(itm)
              const lineTotal = itm.quantity * effective
              return (
                <div
                  key={itm.item.id + "-" + idx}
                  className="rounded-xl border p-4 shadow-sm space-y-3"
                >
                  <ComboBox
                    onChange={(val) => {
                      const found = allItems.find(
                        (c) => c.id.toString() === val,
                      )
                      if (found) handleUpdateItem(idx, found)
                    }}
                    value={itm.item.id.toString()}
                    options={allItems.map((c) => ({
                      label: c.name,
                      value: c.id.toString(),
                    }))}
                    placeholder="Select item"
                  />

                  <div className="flex flex-col gap-2">
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
                      disabled={disabled}
                      className="w-full"
                      placeholder="Quantity"
                    />

                    {allowPriceChange && (
                      <>
                        <Input
                          type="number"
                          min={0}
                          value={itm.final_price_per_unit ?? retail}
                          onChange={(e) =>
                            handleUpdate(
                              idx,
                              "final_price_per_unit",
                              parseFloat(e.target.value) || 0,
                            )
                          }
                          disabled={disabled}
                          className="w-full"
                          placeholder="Discounted Price"
                        />

                        <Input
                          type="number"
                          min={0}
                          value={itm.print_price_per_unit ?? retail}
                          onChange={(e) =>
                            handleUpdate(
                              idx,
                              "print_price_per_unit",
                              parseFloat(e.target.value) || 0,
                            )
                          }
                          disabled={disabled}
                          className="w-full"
                          placeholder="Print Price"
                        />
                      </>
                    )}
                  </div>

                  <div className="grid gap-1 text-sm text-muted-foreground">
                    <div>Retail Price: {formatCurrency(retail)}</div>
                    {allowPriceChange && (
                      <>
                        <div>Wholesale Price: {formatCurrency(wholesale)}</div>
                        <div>
                          Technician Price: {formatCurrency(technician)}
                        </div>
                      </>
                    )}
                    <div className="text-foreground font-semibold">
                      Total: {formatCurrency(lineTotal)}
                    </div>
                  </div>

                  <div className="flex justify-end">
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => handleRemove(idx)}
                      disabled={disabled}
                    >
                      <Trash2 className="size-4 text-destructive" />
                    </Button>
                  </div>
                </div>
              )
            })}
            <div className="text-right font-semibold">
              Grand Total: {formatCurrency(grandTotal)}
            </div>
          </>
        ) : (
          <div className="text-center py-8 text-muted-foreground">
            No items added
          </div>
        )}
      </div>
    </div>
  )
}
