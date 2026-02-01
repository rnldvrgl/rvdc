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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { useDebounce } from "@/lib/hooks/useDebounce"
import { useApplianceItemMutations } from "@/lib/mutations/services/useApplianceItemMutations"
import { useItems } from "@/lib/queries/inventory/useItems"
import { useApplianceItems } from "@/lib/queries/services/useApplianceItems"
import { cn, formatCurrency } from "@/lib/utils/helpers"
import { useQueryClient } from "@tanstack/react-query"
import { Check, ChevronsUpDown, Package, Plus, Trash2 } from "lucide-react"
import { useState } from "react"
import { toast } from "sonner"

interface AppliancePartsManagerProps {
  applianceId: number
  serviceId: number
  disabled?: boolean
}

export default function AppliancePartsManager({
  applianceId,
  serviceId,
  disabled = false,
}: AppliancePartsManagerProps) {
  const queryClient = useQueryClient()
  const [dialogOpen, setDialogOpen] = useState(false)
  const [selectedItemId, setSelectedItemId] = useState<number | null>(null)
  const [quantity, setQuantity] = useState("1")
  const [itemSearch, setItemSearch] = useState("")
  const debouncedSearch = useDebounce(itemSearch, 500)
  const [itemComboOpen, setItemComboOpen] = useState(false)
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false)
  const [itemToDelete, setItemToDelete] = useState<number | null>(null)

  const { data: partsUsed = [], isLoading } = useApplianceItems(applianceId)

  // Fetch items with search
  const { data: itemsData, isLoading: itemsLoading } = useItems({
    page: 1,
    limit: 20,
    search: debouncedSearch,
  })

  const { addItem, deleteItem } = useApplianceItemMutations()

  const items = itemsData?.results || []
  const selectedItem = items.find((i) => i.id === selectedItemId)

  const handleAddPart = () => {
    if (!selectedItemId || !quantity) {
      toast.error("Please fill in all fields")
      return
    }

    const qty = parseInt(quantity)
    if (qty <= 0) {
      toast.error("Quantity must be greater than 0")
      return
    }

    addItem.mutate(
      {
        appliance: applianceId,
        item: selectedItemId,
        quantity: qty,
      },
      {
        onSuccess: () => {
          setDialogOpen(false)
          setSelectedItemId(null)
          setQuantity("1")
        },
        onSettled: () => {
          // Explicitly invalidate the specific service to update details
          queryClient.invalidateQueries({ queryKey: ["service", serviceId] })
        },
      },
    )
  }

  const handleDeletePart = (id: number) => {
    setItemToDelete(id)
    setDeleteConfirmOpen(true)
  }

  const confirmDelete = () => {
    if (itemToDelete) {
      deleteItem.mutate(
        { id: itemToDelete, applianceId },
        {
          onSettled: () => {
            queryClient.invalidateQueries({ queryKey: ["service", serviceId] })
          },
        },
      )
      setItemToDelete(null)
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
                    <TableHead>SKU</TableHead>
                    <TableHead className="text-right">Qty</TableHead>
                    <TableHead className="text-right">Unit Price</TableHead>
                    <TableHead className="text-right">Total</TableHead>
                    {!disabled && <TableHead className="w-[50px]"></TableHead>}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {partsUsed.map((part) => (
                    <TableRow key={part.id}>
                      <TableCell className="font-medium">
                        {part.item_name}
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {part.item}{" "}
                        {/* Item ID - will show properly after backend fix */}
                      </TableCell>
                      <TableCell className="text-right">
                        {part.quantity}
                      </TableCell>
                      <TableCell className="text-right">
                        {formatCurrency(part.item_price)}
                      </TableCell>
                      <TableCell className="text-right font-semibold">
                        {formatCurrency(part.line_total)}
                      </TableCell>
                      {!disabled && (
                        <TableCell>
                          <Button
                            size="icon"
                            variant="ghost"
                            onClick={() => handleDeletePart(part.id)}
                            disabled={disabled}
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </TableCell>
                      )}
                    </TableRow>
                  ))}
                  <TableRow className="bg-muted/50">
                    <TableCell
                      colSpan={4}
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
            setSelectedItemId(null)
            setQuantity("1")
            setItemSearch("")
          }
        }}
      >
        <DialogContent className="max-w-sm! md:max-w-md!">
          <DialogHeader>
            <DialogTitle>Add Part</DialogTitle>
            <DialogDescription>
              Select an item from inventory and specify the quantity used.
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

            {selectedItemId && (
              <div className="rounded-lg bg-muted p-3 text-sm">
                <p className="font-semibold">Estimated Cost:</p>
                <p className="text-lg font-bold text-primary">
                  {formatCurrency(
                    Number(
                      items.find((i) => i.id === selectedItemId)
                        ?.retail_price || 0,
                    ) * parseInt(quantity || "0"),
                  )}
                </p>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button
              onClick={handleAddPart}
              disabled={!selectedItemId || !quantity}
            >
              Add Part
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
