'use client'

import { ComboBox } from '@/components/custom/inputs/ComboBox'
import { Button } from '@/components/ui/button'
import { FormLabel } from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Item, ItemEntry } from '@/lib/constants/interface'
import { formatCurrency } from '@/lib/utils/helpers'
import { Plus, Trash2 } from 'lucide-react'

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
        ? { final_price_per_unit: Number(allItems[0].retail_price) }
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
                ? { final_price_per_unit: Number(newItem.retail_price) }
                : {}),
            }
          : itm,
      ),
    )
  }

  const handleRemove = (idx: number) => {
    onChange(items.filter((_, i) => i !== idx))
  }

  const grandTotal = items.reduce((sum, itm) => {
    const retailPrice = Number(itm.item.retail_price) || 0
    const effectivePrice = allowPriceChange
      ? itm.final_price_per_unit ?? retailPrice
      : retailPrice
    return sum + itm.quantity * effectivePrice
  }, 0)

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

      <div className="hidden md:block">
        <div className="border rounded-xl overflow-hidden shadow-sm">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted">
                <TableHead className="w-1/3">Item</TableHead>
                <TableHead className="w-20">Qty</TableHead>
                {allowPriceChange && (
                  <TableHead className="w-28">Discounted</TableHead>
                )}
                <TableHead className="w-24">Retail</TableHead>
                <TableHead className="w-28 text-right">Total</TableHead>
                <TableHead className="w-8"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {items.length > 0 ? (
                <>
                  {items.map((itm, idx) => {
                    const retailPrice = Number(itm.item.retail_price) || 0
                    const effectivePrice = allowPriceChange
                      ? itm.final_price_per_unit ?? retailPrice
                      : retailPrice
                    const lineTotal = itm.quantity * effectivePrice
                    return (
                      <TableRow
                        key={idx}
                        className="hover:bg-muted/50 transition-colors"
                      >
                        <TableCell>
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
                        </TableCell>
                        <TableCell>
                          <Input
                            type="number"
                            min={1}
                            value={itm.quantity}
                            onChange={(e) =>
                              handleUpdate(
                                idx,
                                'quantity',
                                parseInt(e.target.value) || 1,
                              )
                            }
                            disabled={disabled}
                            className="w-full"
                          />
                        </TableCell>
                        {allowPriceChange && (
                          <TableCell>
                            <Input
                              type="number"
                              min={0}
                              value={itm.final_price_per_unit ?? retailPrice}
                              onChange={(e) =>
                                handleUpdate(
                                  idx,
                                  'final_price_per_unit',
                                  parseFloat(e.target.value) || 0,
                                )
                              }
                              disabled={disabled}
                              className="w-full"
                              placeholder="Price"
                            />
                          </TableCell>
                        )}
                        <TableCell className="text-muted-foreground">
                          {formatCurrency(retailPrice)}
                        </TableCell>
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
                      colSpan={allowPriceChange ? 4 : 3}
                      className="text-right"
                    >
                      Grand Total:
                    </TableCell>
                    <TableCell className="text-right font-bold">
                      {formatCurrency(grandTotal)}
                    </TableCell>
                    <TableCell></TableCell>
                  </TableRow>
                </>
              ) : (
                <TableRow>
                  <TableCell
                    colSpan={allowPriceChange ? 6 : 5}
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

      <div className="md:hidden space-y-4">
        {items.length > 0 ? (
          <>
            {items.map((itm, idx) => {
              const retailPrice = Number(itm.item.retail_price) || 0
              const effectivePrice = allowPriceChange
                ? itm.final_price_per_unit ?? retailPrice
                : retailPrice
              const lineTotal = itm.quantity * effectivePrice
              return (
                <div
                  key={idx}
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
                  <div className="flex gap-4">
                    <Input
                      type="number"
                      min={1}
                      value={itm.quantity}
                      onChange={(e) =>
                        handleUpdate(
                          idx,
                          'quantity',
                          parseInt(e.target.value) || 1,
                        )
                      }
                      disabled={disabled}
                      className="w-full"
                    />
                    {allowPriceChange && (
                      <Input
                        type="number"
                        min={0}
                        value={itm.final_price_per_unit ?? retailPrice}
                        onChange={(e) =>
                          handleUpdate(
                            idx,
                            'final_price_per_unit',
                            parseFloat(e.target.value) || 0,
                          )
                        }
                        disabled={disabled}
                        className="w-full"
                        placeholder="Price"
                      />
                    )}
                  </div>
                  <div className="flex justify-between text-sm text-muted-foreground">
                    <span>Retail: {formatCurrency(retailPrice)}</span>
                    <span>
                      Total:{' '}
                      <span className="font-semibold text-foreground">
                        {formatCurrency(lineTotal)}
                      </span>
                    </span>
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
