"use client"

import { ComboBox } from "@/components/custom/inputs/ComboBox"
import { ConfirmDialog } from "@/components/custom/shared/ConfirmDialog"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { ApplianceItemUsed, Item, Stock } from "@/lib/constants/interface"
import { PaginatedResult } from "@/lib/constants/types"
import { useApiQuery } from "@/lib/hooks/useApiQuery"
import { useApplianceItemMutations } from "@/lib/mutations/services/useApplianceItemMutations"
import { useApplianceItems } from "@/lib/queries/services/useApplianceItems"
import { useItemChoices } from "@/lib/queries/useChoices"
import { cn, formatCurrency } from "@/lib/utils/helpers"
import { useQueryClient } from "@tanstack/react-query"
import { Edit, Info, Package, Plus, Trash2 } from "lucide-react"
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
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false)
  const [itemToDelete, setItemToDelete] = useState<number | null>(null)
  const [discountValue, setDiscountValue] = useState("")
  const [discountReason, setDiscountReason] = useState("")
  const [isFree, setIsFree] = useState(false)
  const [isCustom, setIsCustom] = useState(false)
  const [customDescription, setCustomDescription] = useState("")
  const [customPrice, setCustomPrice] = useState("")

  const { data: partsUsed = [], isLoading } = useApplianceItems(applianceId)

  // Fetch all items for selection (unpaginated)
  const { data: itemsData, isLoading: itemsLoading } = useItemChoices()

  const { addItem, updateItem, deleteItem } = useApplianceItemMutations()

  const items: Item[] = itemsData ?? []
  const selectedItem = items.find((i) => i.id === selectedItemId)

  // Transform items to ComboBox options
  const itemOptions = items.map((item) => ({
    value: item.id,
    label: `${item.name} — ${item.sku} • ${formatCurrency(item.retail_price)}`,
  }))

  // Fetch stock info for the selected item (to show availability)
  const { data: stockData } = useApiQuery<PaginatedResult<Stock>>({
    queryKey: ["stall-stocks", "item", selectedItemId],
    url: "/inventory/stocks/",
    params: { item: selectedItemId, limit: 1 },
    enabled: !!selectedItemId,
  })
  const selectedItemStock = stockData?.results?.[0]

  const handleSavePart = async () => {
    if (isCustom) {
      if (!customDescription.trim() || !customPrice || !quantity) {
        toast.error("Please fill in description, price, and quantity")
        return
      }
    } else {
      if (!selectedItemId || !quantity) {
        toast.error("Please fill in all fields")
        return
      }
    }

    const qty = parseFloat(quantity)
    if (isNaN(qty) || qty <= 0) {
      toast.error("Quantity must be greater than 0")
      return
    }
    const isDecimalUnit =
      selectedItem && ["kg", "ft"].includes(selectedItem.unit_of_measure)
    const roundedQty =
      isCustom || isDecimalUnit
        ? Math.round(qty * 100) / 100
        : Math.round(qty) || 1

    const basePayload = {
      appliance: applianceId,
      quantity: roundedQty,
      is_free: isFree,
      discount_amount:
        !isFree && discountValue
          ? Math.round(parseFloat(discountValue || "0") * 100) / 100
          : 0,
      discount_percentage: 0,
      discount_reason: isFree ? undefined : discountReason || undefined,
    }

    const payload = isCustom
      ? {
          ...basePayload,
          item: null,
          custom_description: customDescription.trim(),
          custom_price: Math.round(parseFloat(customPrice) * 100) / 100,
        }
      : { ...basePayload, item: selectedItemId }

    const resetForm = () => {
      setDialogOpen(false)
      setEditingPartId(null)
      setSelectedItemId(null)
      setQuantity("1")
      setIsFree(false)
      setIsCustom(false)
      setCustomDescription("")
      setCustomPrice("")
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
    const partIsCustom = !part.item && !!part.custom_description
    setIsCustom(partIsCustom)
    if (partIsCustom) {
      setSelectedItemId(null)
      setCustomDescription(part.custom_description || "")
      setCustomPrice(part.custom_price?.toString() || "")
    } else {
      setSelectedItemId(part.item)
      setCustomDescription("")
      setCustomPrice("")
    }
    setQuantity(part.quantity.toString())
    setIsFree(part.is_free || false)

    // Set discount values
    if (part.discount_amount && parseFloat(part.discount_amount) > 0) {
      setDiscountValue(part.discount_amount)
    } else {
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
        <CardHeader className="flex flex-row items-center justify-between px-0 pb-3">
          <CardTitle className="text-sm flex items-center gap-1.5 text-muted-foreground">
            <Package className="h-3.5 w-3.5" />
            <span className="font-medium uppercase tracking-wide">
              Parts Used
            </span>
            {partsUsed.length > 0 && (
              <span className="text-xs font-normal">({partsUsed.length})</span>
            )}
          </CardTitle>
          {!disabled && (
            <Button
              size="sm"
              variant="outline"
              onClick={() => setDialogOpen(true)}
              disabled={disabled}
              className="h-7 text-xs"
            >
              <Plus className="h-3 w-3 mr-1" />
              Add Part
            </Button>
          )}
        </CardHeader>
        <CardContent className="px-0">
          {partsUsed.length === 0 ? (
            <div className="text-center py-6">
              <Package className="h-6 w-6 mx-auto text-muted-foreground/40 mb-2" />
              <p className="text-xs text-muted-foreground">
                No parts added yet
              </p>
            </div>
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
                        <div className="flex items-center gap-2">
                          <span>{part.item_name}</span>
                          {!part.item && part.custom_description && (
                            <Badge
                              variant="secondary"
                              className="text-xs"
                            >
                              Custom
                            </Badge>
                          )}
                          {part.is_free && (
                            <Badge
                              variant="success"
                              className="text-xs"
                            >
                              FREE
                            </Badge>
                          )}
                          {part.stock_request_status === "pending" && (
                            <Badge
                              variant="warning"
                              className="text-xs"
                            >
                              Stock Pending
                            </Badge>
                          )}
                          {part.stock_request_status === "approved" && (
                            <Badge
                              variant="success"
                              className="text-xs"
                            >
                              Stock Approved
                            </Badge>
                          )}
                          {part.stock_request_status === "declined" && (
                            <Badge
                              variant="destructive"
                              className="text-xs"
                            >
                              Stock Declined
                            </Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        {part.quantity}
                      </TableCell>
                      <TableCell className="text-right">
                        {part.is_free ? (
                          <Badge
                            variant="success"
                            className="text-xs"
                          >
                            FREE
                          </Badge>
                        ) : part.discount_amount &&
                          parseFloat(part.discount_amount) > 0 ? (
                          <div className="flex flex-col items-end gap-1">
                            <span className="line-through text-xs text-muted-foreground">
                              {formatCurrency(part.item_price || 0)}
                            </span>
                            <span className="text-green-600">
                              {formatCurrency(
                                part.discounted_price || part.item_price || 0,
                              )}
                            </span>
                          </div>
                        ) : (
                          formatCurrency(part.item_price || 0)
                        )}
                      </TableCell>
                      <TableCell className="text-right font-semibold">
                        <div className="flex flex-col items-end gap-1">
                          <span>{formatCurrency(part.line_total)}</span>
                          {!part.is_free &&
                            part.discount_amount &&
                            parseFloat(part.discount_amount) > 0 && (
                              <span className="text-xs text-green-600">
                                ₱{part.discount_amount} off
                              </span>
                            )}
                        </div>
                      </TableCell>
                      {!disabled && (
                        <TableCell>
                          <div className="flex gap-1">
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button
                                  size="icon"
                                  variant="ghost"
                                  onClick={() => handleEditPart(part)}
                                  disabled={disabled}
                                >
                                  <Edit className="h-4 w-4" />
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>
                                <p>Edit part quantity or apply discount</p>
                              </TooltipContent>
                            </Tooltip>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button
                                  size="icon"
                                  variant="ghost"
                                  onClick={() => handleDeletePart(part.id)}
                                  disabled={disabled}
                                >
                                  <Trash2 className="h-4 w-4 text-destructive" />
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>
                                <p>Remove part and return to stock</p>
                              </TooltipContent>
                            </Tooltip>
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
            setIsCustom(false)
            setCustomDescription("")
            setCustomPrice("")
            setQuantity("1")
            setIsFree(false)
            setDiscountValue("")
            setDiscountReason("")
          }
        }}
      >
        <DialogContent className="max-w-sm md:max-w-md">
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

          <div className="space-y-4 py-4 px-1">
            {/* Custom / Inventory Toggle */}
            <div className="flex items-center space-x-2">
              <Checkbox
                id="parts_is_custom"
                checked={isCustom}
                onCheckedChange={(checked) => {
                  setIsCustom(checked === true)
                  if (checked) {
                    setSelectedItemId(null)
                  } else {
                    setCustomDescription("")
                    setCustomPrice("")
                  }
                }}
                className="cursor-pointer"
              />
              <Label
                htmlFor="parts_is_custom"
                className="text-sm font-medium cursor-pointer"
              >
                Custom Item (not in inventory)
              </Label>
            </div>

            {isCustom ? (
              <div className="space-y-3">
                <div className="space-y-2">
                  <Label>Description</Label>
                  <Input
                    value={customDescription}
                    onChange={(e) => setCustomDescription(e.target.value)}
                    placeholder="e.g., Drain hose, mounting bracket..."
                  />
                </div>
                <div className="space-y-2">
                  <Label>Price per Unit (₱)</Label>
                  <Input
                    type="number"
                    min="0"
                    step="0.01"
                    value={customPrice}
                    onChange={(e) => setCustomPrice(e.target.value)}
                    placeholder="0.00"
                  />
                </div>
              </div>
            ) : (
              <>
                <div className="space-y-2">
                  <Label>Item</Label>
                  <ComboBox
                    options={itemOptions}
                    value={selectedItemId}
                    onChange={(value) =>
                      setSelectedItemId(value as number | null)
                    }
                    placeholder="Select item..."
                    searchPlaceholder="Search items..."
                    disabled={itemsLoading}
                  />
                </div>

                {/* Stock availability info for selected item */}
                {selectedItem && selectedItemStock && (
                  <div className="rounded-md border bg-muted/50 p-3 space-y-1">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">
                        Available Stock:
                      </span>
                      <span
                        className={cn(
                          "font-semibold",
                          selectedItemStock.status === "no_stock" &&
                            "text-red-600",
                          selectedItemStock.status === "low_stock" &&
                            "text-amber-600",
                          selectedItemStock.status === "high_stock" &&
                            "text-green-600",
                        )}
                      >
                        {selectedItemStock.available_quantity}{" "}
                        {selectedItem.unit_of_measure}
                      </span>
                    </div>
                    {Number(selectedItem.waste_tolerance_percentage) > 0 && (
                      <div className="flex items-center justify-between text-xs text-amber-600">
                        <span>Waste Tolerance:</span>
                        <span>±{selectedItem.waste_tolerance_percentage}%</span>
                      </div>
                    )}
                    {selectedItemStock.status === "no_stock" && (
                      <p className="text-xs text-red-600 font-medium">
                        ⚠ No stock available
                      </p>
                    )}
                    {selectedItemStock.status === "low_stock" && (
                      <p className="text-xs text-amber-600">⚠ Low stock</p>
                    )}
                  </div>
                )}
              </>
            )}

            <div className="space-y-2">
              <div className="flex items-center gap-1.5">
                <Label>Quantity</Label>
                {selectedItem && selectedItem.unit_of_measure === "kg" && (
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Info className="size-3.5 text-muted-foreground hover:text-foreground transition-colors cursor-help" />
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
                )}
              </div>
              <Input
                type="number"
                min={
                  selectedItem && selectedItem.unit_of_measure === "kg"
                    ? "0.25"
                    : selectedItem && selectedItem.unit_of_measure === "ft"
                      ? "0.01"
                      : "1"
                }
                step={
                  selectedItem &&
                  ["kg", "ft"].includes(selectedItem.unit_of_measure)
                    ? "any"
                    : "1"
                }
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                onBlur={() => {
                  if (
                    !selectedItem ||
                    ["kg", "ft"].includes(selectedItem.unit_of_measure)
                  )
                    return
                  const parsed = parseFloat(quantity)
                  if (!isNaN(parsed) && parsed > 0) {
                    setQuantity(String(Math.round(parsed) || 1))
                  }
                }}
                placeholder={
                  selectedItem &&
                  ["kg", "ft"].includes(selectedItem.unit_of_measure)
                    ? `Enter quantity (${selectedItem.unit_of_measure})`
                    : "Enter quantity"
                }
              />
              {selectedItem &&
                ["kg", "ft"].includes(selectedItem.unit_of_measure) && (
                  <p className="text-xs text-muted-foreground">
                    Supports decimal values (e.g., 2.5{" "}
                    {selectedItem.unit_of_measure})
                  </p>
                )}
            </div>

            {/* Is Free Checkbox */}
            <div className="flex items-center space-x-2">
              <Checkbox
                id="parts_is_free"
                checked={isFree}
                onCheckedChange={(checked) => {
                  setIsFree(checked === true)
                  // Clear discounts when marking as free
                  if (checked === true) {
                    setDiscountValue("")
                    setDiscountReason("")
                  }
                }}
                className="cursor-pointer"
              />
              <Label
                htmlFor="parts_is_free"
                className="text-sm font-medium cursor-pointer"
              >
                Part is Free (Warranty/Complementary)
              </Label>
            </div>

            {/* Discount Section */}
            <div className="space-y-3 pt-3 border-t">
              <Label className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Item Discount (Optional)
              </Label>
              {isFree ? (
                <p className="text-xs text-muted-foreground">
                  Discount not applicable for free parts
                </p>
              ) : (
                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-2">
                    <Label className="text-xs">Amount (₱)</Label>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Input
                          type="number"
                          min="0"
                          step="1"
                          value={discountValue}
                          onChange={(e) => setDiscountValue(e.target.value)}
                          placeholder="0"
                        />
                      </TooltipTrigger>
                      <TooltipContent>
                        Enter discount in peso amount
                      </TooltipContent>
                    </Tooltip>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-xs">Reason</Label>
                    <Input
                      placeholder="Optional"
                      value={discountReason}
                      onChange={(e) => setDiscountReason(e.target.value)}
                    />
                  </div>
                </div>
              )}
            </div>

            {(selectedItemId || isCustom) && (
              <div className="rounded-lg border bg-muted/30 p-3 text-sm space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Subtotal</span>
                  <span className="font-semibold text-primary">
                    {formatCurrency(
                      (isCustom
                        ? parseFloat(customPrice || "0")
                        : Number(
                            items.find((i) => i.id === selectedItemId)
                              ?.retail_price || 0,
                          )) * parseFloat(quantity || "0"),
                    )}
                  </span>
                </div>
                {discountValue && parseFloat(discountValue) > 0 && (
                  <>
                    <div className="flex items-center justify-between border-t pt-2">
                      <span className="text-green-600">Discount</span>
                      <span className="text-sm text-green-600">
                        -₱{discountValue}
                      </span>
                    </div>
                    <div className="flex items-center justify-between border-t pt-2">
                      <span className="font-medium">Final Cost</span>
                      <span className="font-bold text-primary">
                        {formatCurrency(
                          (() => {
                            const unitPrice = isCustom
                              ? parseFloat(customPrice || "0")
                              : Number(
                                  items.find((i) => i.id === selectedItemId)
                                    ?.retail_price || 0,
                                )
                            const subtotal =
                              unitPrice * parseFloat(quantity || "0")
                            const discount = parseFloat(discountValue)
                            return subtotal - discount
                          })(),
                        )}
                      </span>
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
              disabled={
                addItem.isPending ||
                updateItem.isPending ||
                (isCustom
                  ? !customDescription.trim() || !customPrice || !quantity
                  : !selectedItemId || !quantity)
              }
            >
              {(addItem.isPending || updateItem.isPending) && (
                <span className="mr-2 size-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
              )}
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
