'use client'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Item } from '@/lib/constants/interface'
import { formatCurrency } from '@/lib/utils/helpers'
import { Plus, Trash2 } from 'lucide-react'

type ItemQuantity = {
  item: Item
  quantity: number
  finalPricePerUnit?: number
}

export default function ItemQuantitySelector({
  items,
  allItems,
  onChange,
  disabled,
  allowPriceChange,
}: {
  items: ItemQuantity[]
  allItems: Item[]
  onChange: (items: ItemQuantity[]) => void
  disabled?: boolean
  allowPriceChange?: boolean
}) {
  const handleAdd = () => {
    const defaultItem = allItems[0]
    const newItem: ItemQuantity = {
      item: defaultItem,
      quantity: 1,
      ...(allowPriceChange
        ? { finalPricePerUnit: Number(defaultItem.retail_price) }
        : {}),
    }
    onChange([...items, newItem])
  }

  const handleUpdate = <K extends keyof ItemQuantity>(
    idx: number,
    key: K,
    value: ItemQuantity[K],
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
                ? { finalPricePerUnit: Number(newItem.retail_price) }
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
    const retailPrice = Number(itm.item.retail_price)
    const effectivePrice = allowPriceChange
      ? itm.finalPricePerUnit ?? retailPrice
      : retailPrice
    return sum + itm.quantity * effectivePrice
  }, 0)

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center mb-3">
        <h3 className="font-semibold text-base">Selected Items</h3>
        <Button
          type="button"
          size="sm"
          onClick={handleAdd}
          disabled={disabled}
          className="flex items-center gap-1"
        >
          <Plus className="size-4" />
          Add Item
        </Button>
      </div>

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
                  const retailPrice = Number(itm.item.retail_price)
                  const effectivePrice = allowPriceChange
                    ? itm.finalPricePerUnit ?? retailPrice
                    : retailPrice
                  const lineTotal = itm.quantity * effectivePrice

                  return (
                    <TableRow
                      key={idx}
                      className="hover:bg-muted/50 transition-colors"
                    >
                      <TableCell>
                        <Select
                          value={itm.item.id.toString()}
                          onValueChange={(val) => {
                            const found = allItems.find(
                              (c) => c.id.toString() === val,
                            )
                            if (found) handleUpdateItem(idx, found)
                          }}
                          disabled={disabled}
                        >
                          <SelectTrigger className="w-full">
                            <SelectValue placeholder="Select Item" />
                          </SelectTrigger>
                          <SelectContent>
                            {allItems.map((c) => (
                              <SelectItem
                                key={c.id}
                                value={c.id.toString()}
                              >
                                {c.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
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
                            value={itm.finalPricePerUnit ?? retailPrice}
                            onChange={(e) =>
                              handleUpdate(
                                idx,
                                'finalPricePerUnit',
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
  )
}
