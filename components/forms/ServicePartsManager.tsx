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
import {
    CustomItemTemplate,
    Item,
    ServiceItemUsed,
    Stock,
} from "@/lib/constants/interface"
import { PaginatedResult } from "@/lib/constants/types"
import { useApiQuery } from "@/lib/hooks/useApiQuery"
import { useServiceItemMutations } from "@/lib/mutations/services/useServiceItemMutations"
import { useCustomItemTemplateChoices } from "@/lib/queries/inventory/useCustomItemTemplates"
import { useServiceItems } from "@/lib/queries/services/useServiceItems"
import { useItemChoices } from "@/lib/queries/useChoices"
import api from "@/lib/utils/api"
import { cn, formatCurrency } from "@/lib/utils/helpers"
import { useQueryClient } from "@tanstack/react-query"
import { Edit, HardHat, Info, Loader2, Plus, Trash2, X } from "lucide-react"
import { useState } from "react"
import { toast } from "sonner"

interface ServicePartsManagerProps {
  serviceId: number
  disabled?: boolean
  onUpdate?: () => void | Promise<void>
}

export default function ServicePartsManager({
  serviceId,
  disabled = false,
  onUpdate,
}: ServicePartsManagerProps) {
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
  const [customPrice, setCustomPrice] = useState("")
  const [customDescription, setCustomDescription] = useState("")
  const [selectedTemplateId, setSelectedTemplateId] = useState<number | null>(
    null,
  )
  const [pendingItems, setPendingItems] = useState<
    Array<{
      id: string
      isCustom: boolean
      itemId: number | null
      itemName: string
      quantity: string
      customPrice: string
      customDescription: string
      isFree: boolean
      discountValue: string
      discountReason: string
    }>
  >([])
  const [isSubmitting, setIsSubmitting] = useState(false)

  const { data: partsUsed = [], isLoading } = useServiceItems(serviceId)

  const { data: itemsData, isLoading: itemsLoading } = useItemChoices()
  const { data: templateData } = useCustomItemTemplateChoices()

  const { addItem, updateItem, deleteItem } = useServiceItemMutations()

  const items: Item[] = itemsData ?? []
  const selectedItem = items.find((i) => i.id === selectedItemId)
  const isMutatingPart = addItem.isPending || updateItem.isPending
  const isDialogBusy = isSubmitting || isMutatingPart

  const itemOptions = items.map((item) => ({
    value: item.id,
    label: item.sku ? `${item.name} — ${item.sku}` : item.name,
  }))

  const templates: CustomItemTemplate[] = templateData ?? []
  const templateOptions = templates.map((t) => ({
    value: t.id,
    label: `${t.name} — ${formatCurrency(t.default_price)}`,
  }))

  const { data: stockData } = useApiQuery<PaginatedResult<Stock>>({
    queryKey: ["stall-stocks", "item", selectedItemId],
    url: "/inventory/stocks/",
    params: { item: selectedItemId, limit: 1 },
    enabled: !!selectedItemId,
  })
  const selectedItemStock = stockData?.results?.[0]

  const handleSavePart = async () => {
    if (isCustom) {
      if (!customPrice || !quantity) {
        toast.error("Please fill in price and quantity")
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

    const payload = isCustom
      ? {
          service: serviceId,
          item: null as null,
          custom_price: Math.round(parseFloat(customPrice) * 100) / 100,
          custom_description: customDescription || undefined,
          quantity: roundedQty,
          is_free: isFree,
          discount_amount:
            !isFree && discountValue
              ? Math.round(parseFloat(discountValue || "0") * 100) / 100
              : 0,
          discount_percentage: 0,
          discount_reason: isFree ? undefined : discountReason || undefined,
        }
      : {
          service: serviceId,
          item: selectedItemId,
          quantity: roundedQty,
          is_free: isFree,
          discount_amount:
            !isFree && discountValue
              ? Math.round(parseFloat(discountValue || "0") * 100) / 100
              : 0,
          discount_percentage: 0,
          discount_reason: isFree ? undefined : discountReason || undefined,
        }

    const resetForm = () => {
      setDialogOpen(false)
      setEditingPartId(null)
      setSelectedItemId(null)
      setQuantity("1")
      setIsFree(false)
      setIsCustom(false)
      setCustomPrice("")
      setCustomDescription("")
      setSelectedTemplateId(null)
      setDiscountValue("")
      setDiscountReason("")
    }

    try {
      if (editingPartId) {
        await updateItem.mutateAsync({ id: editingPartId, data: payload })
      } else {
        await addItem.mutateAsync(payload)
      }

      resetForm()

      await new Promise((resolve) => setTimeout(resolve, 150))

      await queryClient.invalidateQueries({
        queryKey: ["service"],
      })
      await queryClient.invalidateQueries({
        queryKey: ["service-items"],
      })

      if (onUpdate) {
        await onUpdate()
      }
    } catch {
      // error is handled by mutation
    }
  }

  const handleAddToList = () => {
    if (isCustom) {
      if (!customPrice || !quantity) {
        toast.error("Please fill in price and quantity")
        return
      }
      if (!customDescription?.trim()) {
        toast.error("Please provide a name/description for the custom item")
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

    const itemName = isCustom
      ? customDescription || "Custom Item"
      : items.find((i) => i.id === selectedItemId)?.name || "Unknown"

    setPendingItems((prev) => [
      ...prev,
      {
        id: crypto.randomUUID(),
        isCustom,
        itemId: isCustom ? null : selectedItemId,
        itemName,
        quantity,
        customPrice,
        customDescription,
        isFree,
        discountValue,
        discountReason,
      },
    ])

    // Reset form for next item
    setSelectedItemId(null)
    setQuantity("1")
    setIsFree(false)
    setIsCustom(false)
    setCustomPrice("")
    setCustomDescription("")
    setSelectedTemplateId(null)
    setDiscountValue("")
    setDiscountReason("")
  }

  const handleSubmitAll = async () => {
    if (pendingItems.length === 0) return
    setIsSubmitting(true)

    let successCount = 0
    let failCount = 0
    const stockAutoAddedItems: string[] = []

    for (const item of pendingItems) {
      const qty = parseFloat(item.quantity)
      const selectedItemForQty = items.find((i) => i.id === item.itemId)
      const isDecimalUnit =
        selectedItemForQty &&
        ["kg", "ft"].includes(selectedItemForQty.unit_of_measure)
      const roundedQty =
        item.isCustom || isDecimalUnit
          ? Math.round(qty * 100) / 100
          : Math.round(qty) || 1

      const payload = item.isCustom
        ? {
            service: serviceId,
            item: null as null,
            custom_price: Math.round(parseFloat(item.customPrice) * 100) / 100,
            custom_description: item.customDescription || undefined,
            quantity: roundedQty,
            is_free: item.isFree,
            discount_amount:
              !item.isFree && item.discountValue
                ? Math.round(parseFloat(item.discountValue || "0") * 100) / 100
                : 0,
            discount_percentage: 0,
            discount_reason: item.isFree
              ? undefined
              : item.discountReason || undefined,
          }
        : {
            service: serviceId,
            item: item.itemId,
            quantity: roundedQty,
            is_free: item.isFree,
            discount_amount:
              !item.isFree && item.discountValue
                ? Math.round(parseFloat(item.discountValue || "0") * 100) / 100
                : 0,
            discount_percentage: 0,
            discount_reason: item.isFree
              ? undefined
              : item.discountReason || undefined,
          }

      try {
        const res = await api.post("services/service-items/", payload)
        successCount++
        if (res.data?.stock_auto_added) {
          stockAutoAddedItems.push(
            `${item.isCustom ? item.customDescription || "Custom Item" : items.find((i) => i.id === item.itemId)?.name || "Item"} (+${res.data.stock_auto_added_qty})`,
          )
        }
      } catch {
        failCount++
      }
    }

    if (stockAutoAddedItems.length > 0) {
      toast.warning(
        `Stock auto-reconciled for: ${stockAutoAddedItems.join(", ")}`,
        { duration: 6000 },
      )
    }
    if (successCount > 0) {
      toast.success(
        `${successCount} part${successCount > 1 ? "s" : ""} added successfully`,
      )
    }
    if (failCount > 0) {
      toast.error(`Failed to add ${failCount} part${failCount > 1 ? "s" : ""}`)
    }

    await queryClient.invalidateQueries({ queryKey: ["service"] })
    await queryClient.invalidateQueries({ queryKey: ["services"] })
    await queryClient.invalidateQueries({
      queryKey: ["service-items", serviceId],
    })
    await queryClient.invalidateQueries({ queryKey: ["stocks"] })
    await queryClient.invalidateQueries({ queryKey: ["sales-transactions"] })
    await queryClient.invalidateQueries({ queryKey: ["pending-items-stats"] })
    if (onUpdate) await onUpdate()

    setIsSubmitting(false)
    setPendingItems([])
    setDialogOpen(false)
  }

  const handleEditPart = (part: ServiceItemUsed) => {
    setEditingPartId(part.id)

    if (!part.item && !!part.custom_price) {
      setIsCustom(true)
      setCustomPrice(part.custom_price || "")
      setCustomDescription(part.custom_description || "")
      setSelectedItemId(null)
    } else {
      setIsCustom(false)
      setCustomPrice("")
      setCustomDescription("")
      setSelectedItemId(part.item)
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
        await deleteItem.mutateAsync({ id: itemToDelete, serviceId })

        setItemToDelete(null)
        setDeleteConfirmOpen(false)

        await new Promise((resolve) => setTimeout(resolve, 150))

        await queryClient.invalidateQueries({
          queryKey: ["service"],
        })
        await queryClient.invalidateQueries({
          queryKey: ["service-items"],
        })

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
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-3">
          <CardTitle className="text-sm flex items-center gap-1.5 text-muted-foreground">
            <HardHat className="h-3.5 w-3.5" />
            <span className="font-medium uppercase tracking-wide">
              Service-Level Parts
            </span>
            {partsUsed.length > 0 && (
              <Badge className="text-xs font-normal">{partsUsed.length}</Badge>
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
        <CardContent>
          <p className="text-xs text-muted-foreground mb-3">
            Parts used for pre-installation work (chipping, piping) or general
            materials not tied to a specific unit.
          </p>
          {partsUsed.length === 0 ? (
            <div className="text-center py-6">
              <HardHat className="h-6 w-6 mx-auto text-muted-foreground/40 mb-2" />
              <p className="text-xs text-muted-foreground">
                No service-level parts added yet
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
                            <span className="text-success">
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
                              <span className="text-xs text-success">
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

      {/* Add/Edit Part Dialog */}
      <Dialog
        open={dialogOpen}
        onOpenChange={(open) => {
          if (!open && isDialogBusy) return
          setDialogOpen(open)
          if (!open) {
            setEditingPartId(null)
            setSelectedItemId(null)
            setQuantity("1")
            setIsFree(false)
            setIsCustom(false)
            setCustomPrice("")
            setDiscountValue("")
            setDiscountReason("")
            setSelectedTemplateId(null)
            setPendingItems([])
          }
        }}
      >
        <DialogContent
          className="max-w-md! overflow-hidden md:max-w-lg!"
          showCloseButton={!isDialogBusy}
          onEscapeKeyDown={(event) => {
            if (isDialogBusy) event.preventDefault()
          }}
          onPointerDownOutside={(event) => {
            if (isDialogBusy) event.preventDefault()
          }}
        >
          {isDialogBusy && (
            <div className="absolute inset-0 z-20 flex flex-col items-center justify-center gap-2 rounded-xl bg-background/85 backdrop-blur-sm">
              <Loader2 className="size-6 animate-spin text-primary" />
              <div className="space-y-0.5 text-center">
                <p className="text-sm font-medium">
                  {isSubmitting
                    ? `Adding ${pendingItems.length} part${pendingItems.length > 1 ? "s" : ""}...`
                    : editingPartId
                      ? "Updating part..."
                      : "Adding part..."}
                </p>
                <p className="text-xs text-muted-foreground">
                  Please wait until the request completes.
                </p>
              </div>
            </div>
          )}
          <DialogHeader>
            <DialogTitle>
              {editingPartId ? "Edit Part" : "Add Service-Level Part"}
            </DialogTitle>
            <DialogDescription>
              {editingPartId
                ? "Update the part details"
                : "Add items for pre-installation work (chipping, piping, etc.)"}
            </DialogDescription>
          </DialogHeader>

          {/* Pending Items List */}
          {!editingPartId && pendingItems.length > 0 && (
            <div className="rounded-lg border bg-muted/30 p-3 space-y-2">
              <Label className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Items to Add ({pendingItems.length})
              </Label>
              <div className="space-y-1.5 max-h-[140px] overflow-y-auto">
                {pendingItems.map((item) => {
                  const unitPrice = item.isCustom
                    ? parseFloat(item.customPrice || "0")
                    : Number(
                        items.find((i) => i.id === item.itemId)?.retail_price ||
                          0,
                      )
                  const qty = parseFloat(item.quantity || "0")
                  const discount = item.isFree
                    ? unitPrice * qty
                    : parseFloat(item.discountValue || "0")
                  const lineTotal = item.isFree ? 0 : unitPrice * qty - discount
                  return (
                    <div
                      key={item.id}
                      className="flex items-center justify-between text-sm bg-background rounded px-2 py-1.5"
                    >
                      <div className="flex min-w-0 flex-1 items-center gap-2">
                        <span
                          className="truncate font-medium"
                          title={item.itemName}
                        >
                          {item.itemName}
                        </span>
                        <span className="text-muted-foreground shrink-0">
                          &times; {item.quantity}
                        </span>
                        {item.isFree && (
                          <Badge
                            variant="success"
                            className="text-xs shrink-0"
                          >
                            FREE
                          </Badge>
                        )}
                        {item.isCustom && (
                          <Badge
                            variant="secondary"
                            className="text-xs shrink-0"
                          >
                            Custom
                          </Badge>
                        )}
                      </div>
                      <div className="flex items-center gap-1 shrink-0">
                        <span className="text-xs font-medium">
                          {formatCurrency(lineTotal)}
                        </span>
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-6 w-6"
                          disabled={isDialogBusy}
                          onClick={() =>
                            setPendingItems((prev) =>
                              prev.filter((p) => p.id !== item.id),
                            )
                          }
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  )
                })}
              </div>
              {pendingItems.length > 1 && (
                <div className="flex items-center justify-between text-xs pt-1.5 border-t">
                  <span className="text-muted-foreground font-medium">
                    Total
                  </span>
                  <span className="font-semibold">
                    {formatCurrency(
                      pendingItems.reduce((sum, item) => {
                        const unitPrice = item.isCustom
                          ? parseFloat(item.customPrice || "0")
                          : Number(
                              items.find((i) => i.id === item.itemId)
                                ?.retail_price || 0,
                            )
                        const qty = parseFloat(item.quantity || "0")
                        const discount = item.isFree
                          ? unitPrice * qty
                          : parseFloat(item.discountValue || "0")
                        return (
                          sum + (item.isFree ? 0 : unitPrice * qty - discount)
                        )
                      }, 0),
                    )}
                  </span>
                </div>
              )}
            </div>
          )}

          <div className="max-h-[70vh] space-y-4 overflow-y-auto py-4 pr-1">
            {/* Custom Item Toggle */}
            <div className="flex items-center space-x-2">
              <Checkbox
                id="service_parts_is_custom"
                checked={isCustom}
                disabled={isDialogBusy}
                onCheckedChange={(checked) => {
                  setIsCustom(checked === true)
                  if (checked === true) {
                    setSelectedItemId(null)
                  } else {
                    setCustomPrice("")
                    setCustomDescription("")
                  }
                }}
                className="cursor-pointer"
              />
              <Label
                htmlFor="service_parts_is_custom"
                className="text-sm font-medium cursor-pointer"
              >
                Custom Item (not in inventory)
              </Label>
            </div>

            {isCustom ? (
              <div className="space-y-3">
                <div className="space-y-2">
                  <Label>Item Name / Description</Label>
                  <Input
                    type="text"
                    value={customDescription}
                    onChange={(e) => setCustomDescription(e.target.value)}
                    placeholder="e.g. Capacitor 25uf, Copper tube 1/4"
                    disabled={isDialogBusy}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Unit Price (₱)</Label>
                  <Input
                    type="number"
                    min="0"
                    step="0.01"
                    value={customPrice}
                    onChange={(e) => setCustomPrice(e.target.value)}
                    placeholder="0.00"
                    disabled={isDialogBusy}
                  />
                </div>
                {templates.length > 0 && (
                  <div className="space-y-2">
                    <Label className="text-xs text-muted-foreground">
                      Quick-fill from template
                    </Label>
                    <ComboBox
                      options={templateOptions}
                      value={selectedTemplateId}
                      onChange={(value) => {
                        const id = value as number | null
                        setSelectedTemplateId(id)
                        if (id) {
                          const tpl = templates.find((t) => t.id === id)
                          if (tpl) {
                          setCustomPrice(tpl.default_price)
                          setCustomDescription(tpl.name)
                          }
                        }
                      }}
                      placeholder="Select a template..."
                      searchPlaceholder="Search templates..."
                      disabled={isDialogBusy}
                    />
                  </div>
                )}
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
                    disabled={itemsLoading || isDialogBusy}
                  />
                </div>

                {selectedItem && (
                  <div className="rounded-lg border bg-muted/20 p-3">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0 space-y-1">
                        <p
                          className="truncate text-sm font-medium"
                          title={selectedItem.name}
                        >
                          {selectedItem.name}
                        </p>
                        <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-muted-foreground">
                          {selectedItem.sku && <span>{selectedItem.sku}</span>}
                          <span>{selectedItem.unit_of_measure}</span>
                        </div>
                      </div>
                      <div className="shrink-0 text-right">
                        <p className="text-[11px] text-muted-foreground">
                          Unit Price
                        </p>
                        <p className="text-sm font-semibold">
                          {formatCurrency(selectedItem.retail_price)}
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Stock availability info */}
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
                            "text-destructive",
                          selectedItemStock.status === "low_stock" &&
                            "text-amber-600",
                          selectedItemStock.status === "high_stock" &&
                            "text-success",
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
                      <p className="text-xs text-destructive font-medium">
                        No stock available
                      </p>
                    )}
                    {selectedItemStock.status === "low_stock" && (
                      <p className="text-xs text-amber-600">Low stock</p>
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
                disabled={isDialogBusy}
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
                id="service_parts_is_free"
                checked={isFree}
                disabled={isDialogBusy}
                onCheckedChange={(checked) => {
                  setIsFree(checked === true)
                  if (checked === true) {
                    setDiscountValue("")
                    setDiscountReason("")
                  }
                }}
                className="cursor-pointer"
              />
              <Label
                htmlFor="service_parts_is_free"
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
                          disabled={isDialogBusy || isFree}
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
                      disabled={isDialogBusy || isFree}
                    />
                  </div>
                </div>
              )}
            </div>

            {(selectedItemId || (isCustom && customPrice)) && (
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
                      <span className="text-success">Discount</span>
                      <span className="text-sm text-success">
                        -₱{discountValue}
                      </span>
                    </div>
                    <div className="flex items-center justify-between border-t pt-2">
                      <span className="font-medium">Final Cost</span>
                      <span className="font-bold text-primary">
                        {formatCurrency(
                          (() => {
                            const subtotal =
                              (isCustom
                                ? parseFloat(customPrice || "0")
                                : Number(
                                    items.find((i) => i.id === selectedItemId)
                                      ?.retail_price || 0,
                                  )) * parseFloat(quantity || "0")
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
              disabled={isDialogBusy}
              onClick={() => {
                setDialogOpen(false)
                setEditingPartId(null)
                setPendingItems([])
              }}
            >
              {editingPartId ? "Cancel" : "Done"}
            </Button>
            {editingPartId ? (
              <Button
                onClick={handleSavePart}
                disabled={
                  isDialogBusy ||
                  (isCustom
                    ? !customPrice || !quantity
                    : !selectedItemId || !quantity)
                }
              >
                {isMutatingPart && (
                  <Loader2 className="mr-2 size-4 animate-spin" />
                )}
                {isMutatingPart ? "Updating..." : "Update Part"}
              </Button>
            ) : (
              <>
                <Button
                  variant="secondary"
                  onClick={handleAddToList}
                  disabled={
                    isDialogBusy ||
                    (isCustom
                      ? !customPrice || !quantity
                      : !selectedItemId || !quantity)
                  }
                >
                  {pendingItems.length > 0 ? "Add Another" : "Add to List"}
                </Button>
                {pendingItems.length > 0 && (
                  <Button
                    onClick={handleSubmitAll}
                    disabled={isDialogBusy}
                  >
                    {isSubmitting && (
                      <Loader2 className="mr-2 size-4 animate-spin" />
                    )}
                    {isSubmitting
                      ? `Adding ${pendingItems.length}...`
                      : `Add ${pendingItems.length} to Service`}
                  </Button>
                )}
              </>
            )}
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
        variant="warning"
      />
    </>
  )
}
