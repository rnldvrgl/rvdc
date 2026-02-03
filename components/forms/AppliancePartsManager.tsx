"use client"

import { ConfirmDialog } from "@/components/custom/shared/ConfirmDialog"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { ApplianceItemUsed } from "@/lib/constants/interface"
import { useDebounce } from "@/lib/hooks/useDebounce"
import { useApplianceItemMutations } from "@/lib/mutations/services/useApplianceItemMutations"
import { useItems } from "@/lib/queries/inventory/useItems"
import { useApplianceItems } from "@/lib/queries/services/useApplianceItems"
import { cn, formatCurrency } from "@/lib/utils/helpers"
import { useQueryClient } from "@tanstack/react-query"
import {
  Check,
  ChevronsUpDown,
  Edit,
  Package,
  Plus,
  Trash2,
} from "lucide-react"
import { useState } from "react"
import { toast } from "sonner"

interface AppliancePartsManagerProps {
  applianceId: number
  disabled?: boolean
  onUpdate?: () => void | Promise<void>
}

export default function AppliancePartsManager({
  applianceId,
  disabled = false,
  onUpdate,
}: AppliancePartsManagerProps) {
  const queryClient = useQueryClient()
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingPartId, setEditingPartId] = useState<number | null>(null)
  const [selectedItemId, setSelectedItemId] = useState<number | null>(null)
  const [quantity, setQuantity] = useState("1")
  const [itemSearch, setItemSearch] = useState("")
  const debouncedSearch = useDebounce(itemSearch, 500)
  const [itemComboOpen, setItemComboOpen] = useState(false)
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false)
  const [itemToDelete, setItemToDelete] = useState<number | null>(null)
  const [discountType, setDiscountType] = useState<
    "none" | "percentage" | "fixed"
  >("none")
  const [discountValue, setDiscountValue] = useState("")
  const [discountReason, setDiscountReason] = useState("")

  const { data: partsUsed = [], isLoading } = useApplianceItems(applianceId)

  // Fetch items with search
  const { data: itemsData, isLoading: itemsLoading } = useItems({
    page: 1,
    limit: 20,
    search: debouncedSearch,
  })

  const { addItem, updateItem, deleteItem } = useApplianceItemMutations()

  const items = itemsData?.results || []
  const selectedItem = items.find((i) => i.id === selectedItemId)

  const handleSavePart = async () => {
    if (!selectedItemId || !quantity) {
      toast.error("Please fill in all fields")
      return
    }

    const qty = parseInt(quantity)
    if (qty <= 0) {
      toast.error("Quantity must be greater than 0")
      return
    }

    const payload = {
      appliance: applianceId,
      item: selectedItemId,
      quantity: qty,
      discount_amount:
        discountType === "fixed" ? parseFloat(discountValue || "0") : 0,
      discount_percentage:
        discountType === "percentage" ? parseFloat(discountValue || "0") : 0,
      discount_reason: discountReason || undefined,
    }

    const resetForm = () => {
      setDialogOpen(false)
      setEditingPartId(null)
      setSelectedItemId(null)
      setQuantity("1")
      setDiscountType("none")
      setDiscountValue("")
      setDiscountReason("")
    }

    try {
      if (editingPartId) {
        // Update existing part
        await updateItem.mutateAsync({ id: editingPartId, data: payload })
      } else {
        // Add new part
        await addItem.mutateAsync(payload)
      }

      resetForm()

      // Small delay for backend to recalculate totals
      await new Promise((resolve) => setTimeout(resolve, 150))

      // Invalidate all service-related queries to mark them as stale
      await queryClient.invalidateQueries({
        queryKey: ["service"],
      })
      await queryClient.invalidateQueries({
        queryKey: ["service-appliances"],
      })
      await queryClient.invalidateQueries({
        queryKey: ["appliance-items"],
      })

      // Trigger parent refresh which will refetch with fresh data
      if (onUpdate) {
        await onUpdate()
      }
    } catch {
      // error is handled by mutation
    }
  }

  const handleEditPart = (part: ApplianceItemUsed) => {
    setEditingPartId(part.id)
    setSelectedItemId(part.item)
    setQuantity(part.quantity.toString())

    // Set discount values
    if (part.discount_percentage && parseFloat(part.discount_percentage) > 0) {
      setDiscountType("percentage")
      setDiscountValue(part.discount_percentage)
    } else if (part.discount_amount && parseFloat(part.discount_amount) > 0) {
      setDiscountType("fixed")
      setDiscountValue(part.discount_amount)
    } else {
      setDiscountType("none")
      setDiscountValue("")
    }

    setDiscountReason(part.discount_reason || "")
    setDialogOpen(true)
  }

  const handleDeletePart = (id: number) => {
    setItemToDelete(id)
    setDeleteConfirmOpen(true)
  }

  const confirmDelete = async () => {
    if (itemToDelete) {
      try {
        await deleteItem.mutateAsync({ id: itemToDelete, applianceId })

        setItemToDelete(null)
        setDeleteConfirmOpen(false)

        // Small delay for backend to recalculate totals
        await new Promise((resolve) => setTimeout(resolve, 150))

        // Invalidate all service-related queries to mark them as stale
        await queryClient.invalidateQueries({
          queryKey: ["service"],
        })
        await queryClient.invalidateQueries({
          queryKey: ["service-appliances"],
        })
        await queryClient.invalidateQueries({
          queryKey: ["appliance-items"],
        })

        // Trigger parent refresh which will refetch with fresh data
        if (onUpdate) {
          await onUpdate()
        }
      } catch {
        // error is handled by mutation
      }
    }
  }

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6">
          <p className="text-sm text-muted-foreground">Loading parts...</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <>
      <Card className="bg-transparent border-0 p-0">
        <CardHeader className="flex flex-row items-center justify-between px-0">
          <CardTitle className="text-base flex items-center gap-2">
            <Package className="h-4 w-4" />
            Parts Used
          </CardTitle>
          {!disabled && (
            <Button
              size="sm"
              onClick={() => setDialogOpen(true)}
              disabled={disabled}
            >
              <Plus className="h-4 w-4 mr-1" />
              Add Part
            </Button>
          )}
        </CardHeader>
        <CardContent className="px-0">
          {partsUsed.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">
              No parts added yet
            </p>
          ) : (
            <div className="border rounded-lg overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Item</TableHead>
                    <TableHead className="text-right">Qty</TableHead>
                    <TableHead className="text-right">Unit Price</TableHead>
                    <TableHead className="text-right">Total</TableHead>
                    {!disabled && (
                      <TableHead className="w-[100px]">Actions</TableHead>
                    )}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {partsUsed.map((part) => (
                    <TableRow key={part.id}>
                      <TableCell className="font-medium">
                        {part.item_name}
                      </TableCell>
                      <TableCell className="text-right">
                        {part.quantity}
                      </TableCell>
                      <TableCell className="text-right">
                        {(part.discount_amount &&
                          parseFloat(part.discount_amount) > 0) ||
                        (part.discount_percentage &&
                          parseFloat(part.discount_percentage) > 0) ? (
                          <div className="flex flex-col items-end gap-1">
                            <span className="line-through text-xs text-muted-foreground">
                              {formatCurrency(part.item_price)}
                            </span>
                            <span className="text-green-600">
                              {formatCurrency(
                                part.discounted_price || part.item_price,
                              )}
                            </span>
                          </div>
                        ) : (
                          formatCurrency(part.item_price)
                        )}
                      </TableCell>
                      <TableCell className="text-right font-semibold">
                        <div className="flex flex-col items-end gap-1">
                          <span>{formatCurrency(part.line_total)}</span>
                          {((part.discount_amount &&
                            parseFloat(part.discount_amount) > 0) ||
                            (part.discount_percentage &&
                              parseFloat(part.discount_percentage) > 0)) && (
                            <span className="text-xs text-green-600">
                              {part.discount_percentage &&
                              parseFloat(part.discount_percentage) > 0
                                ? `${part.discount_percentage}% off`
                                : `₱${part.discount_amount} off`}
                            </span>
                          )}
                        </div>
                      </TableCell>
                      {!disabled && (
                        <TableCell>
                          <div className="flex gap-1">
                            <Button
                              size="icon"
                              variant="ghost"
                              onClick={() => handleEditPart(part)}
                              disabled={disabled}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              size="icon"
                              variant="ghost"
                              onClick={() => handleDeletePart(part.id)}
                              disabled={disabled}
                            >
                              <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                          </div>
                        </TableCell>
                      )}
                    </TableRow>
                  ))}
                  <TableRow className="bg-muted/50">
                    <TableCell
                      colSpan={3}
                      className="text-right font-semibold"
                    >
                      Total Parts Cost:
                    </TableCell>
                    <TableCell className="text-right font-bold">
                      {formatCurrency(
                        partsUsed.reduce(
                          (sum, part) => sum + parseFloat(part.line_total),
                          0,
                        ),
                      )}
                    </TableCell>
                    {!disabled && <TableCell></TableCell>}
                  </TableRow>
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Add Part Dialog */}
      <Dialog
        open={dialogOpen}
        onOpenChange={(open) => {
          setDialogOpen(open)
          if (!open) {
            // Reset form when closing
            setEditingPartId(null)
            setSelectedItemId(null)
            setQuantity("1")
            setItemSearch("")
            setDiscountType("none")
            setDiscountValue("")
            setDiscountReason("")
          }
        }}
      >
        <DialogContent className="max-w-sm! md:max-w-md!">
          <DialogHeader>
            <DialogTitle>
              {editingPartId ? "Edit Part" : "Add Part"}
            </DialogTitle>
            <DialogDescription>
              {editingPartId
                ? "Update the part details"
                : "Select an item from inventory and specify the quantity used."}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Item</Label>
              <Popover
                open={itemComboOpen}
                onOpenChange={setItemComboOpen}
              >
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    role="combobox"
                    aria-expanded={itemComboOpen}
                    className="w-full justify-between"
                  >
                    {selectedItemId
                      ? `${selectedItem?.name} - ${selectedItem?.sku}`
                      : "Select item..."}
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent
                  className="w-full p-0"
                  align="start"
                >
                  <Command>
                    <CommandInput
                      placeholder="Search items..."
                      value={itemSearch}
                      onValueChange={setItemSearch}
                    />
                    <CommandList>
                      <CommandEmpty>
                        {itemsLoading ? "Loading..." : "No items found."}
                      </CommandEmpty>
                      <CommandGroup>
                        {items.map((item) => (
                          <CommandItem
                            key={item.id}
                            value={`${item.name} ${item.sku}`}
                            onSelect={() => {
                              setSelectedItemId(item.id)
                              setItemComboOpen(false)
                            }}
                          >
                            <Check
                              className={cn(
                                "mr-2 h-4 w-4",
                                selectedItemId === item.id
                                  ? "opacity-100"
                                  : "opacity-0",
                              )}
                            />
                            <div className="flex flex-col">
                              <span className="font-medium">{item.name}</span>
                              <span className="text-xs text-muted-foreground">
                                {item.sku} • {formatCurrency(item.retail_price)}
                              </span>
                            </div>
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>
            </div>

            <div className="space-y-2">
              <Label>Quantity</Label>
              <Input
                type="number"
                min="1"
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                placeholder="Enter quantity"
              />
            </div>

            {/* Discount Section */}
            <div className="space-y-3 pt-2 border-t">
              <Label className="text-sm font-semibold">
                Item Discount (Optional)
              </Label>
              <div className="grid grid-cols-3 gap-2">
                <div className="space-y-2">
                  <Label className="text-xs">Type</Label>
                  <Select
                    value={discountType}
                    onValueChange={(value: "none" | "percentage" | "fixed") =>
                      setDiscountType(value)
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">None</SelectItem>
                      <SelectItem value="percentage">%</SelectItem>
                      <SelectItem value="fixed">₱</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label className="text-xs">Amount</Label>
                  <Input
                    type="number"
                    min="0"
                    step="0.01"
                    value={discountValue}
                    onChange={(e) => setDiscountValue(e.target.value)}
                    disabled={discountType === "none"}
                    placeholder="0"
                  />
                </div>

                <div className="space-y-2">
                  <Label className="text-xs">Reason</Label>
                  <Input
                    placeholder="Optional"
                    value={discountReason}
                    onChange={(e) => setDiscountReason(e.target.value)}
                    disabled={discountType === "none"}
                  />
                </div>
              </div>
            </div>

            {selectedItemId && (
              <div className="rounded-lg bg-muted p-3 text-sm space-y-2">
                <div>
                  <p className="font-semibold">Subtotal:</p>
                  <p className="text-lg font-bold text-primary">
                    {formatCurrency(
                      Number(
                        items.find((i) => i.id === selectedItemId)
                          ?.retail_price || 0,
                      ) * parseInt(quantity || "0"),
                    )}
                  </p>
                </div>
                {discountType !== "none" && discountValue && (
                  <>
                    <div className="border-t pt-2">
                      <p className="font-semibold text-green-600">Discount:</p>
                      <p className="text-sm">
                        {discountType === "percentage"
                          ? `${discountValue}% off`
                          : `-${formatCurrency(parseFloat(discountValue))}`}
                      </p>
                    </div>
                    <div className="border-t pt-2">
                      <p className="font-semibold">Final Cost:</p>
                      <p className="text-lg font-bold text-primary">
                        {formatCurrency(
                          (() => {
                            const subtotal =
                              Number(
                                items.find((i) => i.id === selectedItemId)
                                  ?.retail_price || 0,
                              ) * parseInt(quantity || "0")
                            const discount =
                              discountType === "percentage"
                                ? (subtotal * parseFloat(discountValue)) / 100
                                : parseFloat(discountValue)
                            return subtotal - discount
                          })(),
                        )}
                      </p>
                    </div>
                  </>
                )}
              </div>
            )}
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setDialogOpen(false)
                setEditingPartId(null)
              }}
            >
              Cancel
            </Button>
            <Button
              onClick={handleSavePart}
              disabled={!selectedItemId || !quantity}
            >
              {editingPartId ? "Update Part" : "Add Part"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={deleteConfirmOpen}
        onCancel={() => setDeleteConfirmOpen(false)}
        onConfirm={confirmDelete}
        title="Remove Part"
        description="Are you sure you want to remove this part? This will return the quantity to stock."
        confirmText="Remove"
        cancelText="Cancel"
      />
    </>
  )
}
