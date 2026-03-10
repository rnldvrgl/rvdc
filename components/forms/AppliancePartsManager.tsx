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
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { ApplianceItemUsed, Stock } from "@/lib/constants/interface"
import { PaginatedResult } from "@/lib/constants/types"
import { useApiQuery } from "@/lib/hooks/useApiQuery"
import { useApplianceItemMutations } from "@/lib/mutations/services/useApplianceItemMutations"
import { useItems } from "@/lib/queries/inventory/useItems"
import { useApplianceItems } from "@/lib/queries/services/useApplianceItems"
import { cn, formatCurrency } from "@/lib/utils/helpers"
import { useQueryClient } from "@tanstack/react-query"
import { Edit, Package, Plus, Trash2 } from "lucide-react"
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
  const [discountType, setDiscountType] = useState<
    "none" | "percentage" | "fixed"
  >("none")
  const [discountValue, setDiscountValue] = useState("")
  const [discountReason, setDiscountReason] = useState("")
  const [isFree, setIsFree] = useState(false)

  const { data: partsUsed = [], isLoading } = useApplianceItems(applianceId)

  // Fetch items for selection
  const { data: itemsData, isLoading: itemsLoading } = useItems({
    page: 1,
    limit: 100,
  })

  const { addItem, updateItem, deleteItem } = useApplianceItemMutations()

  const items = itemsData?.results || []
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
    if (!selectedItemId || !quantity) {
      toast.error("Please fill in all fields")
      return
    }

    const qty = parseFloat(quantity)
    if (isNaN(qty) || qty <= 0) {
      toast.error("Quantity must be greater than 0")
      return
    }

    const payload = {
      appliance: applianceId,
      item: selectedItemId,
      quantity: Math.round(qty * 100) / 100,
      is_free: isFree,
      discount_amount:
        !isFree && discountType === "fixed"
          ? Math.round(parseFloat(discountValue || "0") * 100) / 100
          : 0,
      discount_percentage:
        !isFree && discountType === "percentage"
          ? Math.round(parseFloat(discountValue || "0") * 100) / 100
          : 0,
      discount_reason: isFree ? undefined : discountReason || undefined,
    }

    const resetForm = () => {
      setDialogOpen(false)
      setEditingPartId(null)
      setSelectedItemId(null)
      setQuantity("1")
      setIsFree(false)
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
    setIsFree(part.is_free || false)

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
                          {part.item_name}
                          {part.is_free && (
                            <Badge
                              variant="success"
                              className="text-xs"
                            >
                              FREE
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
                        ) : (part.discount_amount &&
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
                          {!part.is_free &&
                            ((part.discount_amount &&
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
            setQuantity("1")
            setIsFree(false)
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
              <ComboBox
                options={itemOptions}
                value={selectedItemId}
                onChange={(value) => setSelectedItemId(value as number | null)}
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
                      selectedItemStock.status === "no_stock" && "text-red-600",
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

            <div className="space-y-2">
              <Label>Quantity</Label>
              <Input
                type="number"
                min="0.01"
                step={
                  selectedItem &&
                  ["kg", "ft"].includes(selectedItem.unit_of_measure)
                    ? "0.01"
                    : "1"
                }
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
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
                    setDiscountType("none")
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
              )}
            </div>

            {selectedItemId && (
              <div className="rounded-lg border bg-muted/30 p-3 text-sm space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Subtotal</span>
                  <span className="font-semibold text-primary">
                    {formatCurrency(
                      Number(
                        items.find((i) => i.id === selectedItemId)
                          ?.retail_price || 0,
                      ) * parseInt(quantity || "0"),
                    )}
                  </span>
                </div>
                {discountType !== "none" && discountValue && (
                  <>
                    <div className="flex items-center justify-between border-t pt-2">
                      <span className="text-green-600">Discount</span>
                      <span className="text-sm text-green-600">
                        {discountType === "percentage"
                          ? `${discountValue}% off`
                          : `-${formatCurrency(parseFloat(discountValue))}`}
                      </span>
                    </div>
                    <div className="flex items-center justify-between border-t pt-2">
                      <span className="font-medium">Final Cost</span>
                      <span className="font-bold text-primary">
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
