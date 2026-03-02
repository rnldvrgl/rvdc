"use client"

import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { Textarea } from "@/components/ui/textarea"
import { SalesTransaction } from "@/lib/constants/interface"
import { useSalesTransactionMutations } from "@/lib/mutations/useSalesTransactionMutations"
import { AlertTriangle, RotateCcw } from "lucide-react"
import { useState } from "react"

interface SalesReturnDialogProps {
  open: boolean
  onClose: () => void
  transaction: SalesTransaction
}

export function SalesReturnDialog({
  open,
  onClose,
  transaction,
}: SalesReturnDialogProps) {
  const [selectedItems, setSelectedItems] = useState<Set<number>>(new Set())
  const [reason, setReason] = useState("")
  const { voidTransaction } = useSalesTransactionMutations()

  const items = transaction.items ?? []
  const isSubmitting = voidTransaction.status === "pending"

  const toggleItem = (itemId: number) => {
    setSelectedItems((prev) => {
      const next = new Set(prev)
      if (next.has(itemId)) {
        next.delete(itemId)
      } else {
        next.add(itemId)
      }
      return next
    })
  }

  const toggleAll = () => {
    if (selectedItems.size === items.length) {
      setSelectedItems(new Set())
    } else {
      setSelectedItems(new Set(items.map((i) => i.id)))
    }
  }

  const refundTotal = items
    .filter((i) => selectedItems.has(i.id))
    .reduce((sum, i) => sum + Number(i.line_total ?? 0), 0)

  const allSelected = selectedItems.size === items.length && items.length > 0

  const handleReturn = () => {
    if (!reason.trim()) return
    // Since backend only supports full void, use that
    voidTransaction.mutate(
      {
        id: transaction.id,
        data: {
          void_reason: `[RETURN] ${reason.trim()} — Items returned: ${items
            .filter((i) => selectedItems.has(i.id))
            .map((i) => `${i.description || i.item?.name} x${i.quantity}`)
            .join(", ")}`,
        },
      },
      {
        onSuccess: () => {
          setSelectedItems(new Set())
          setReason("")
          onClose()
        },
      },
    )
  }

  const peso = (v: string | number) =>
    `₱${Number(v).toLocaleString("en-PH", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => !v && onClose()}
    >
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <RotateCcw className="size-5" />
            Return Items
          </DialogTitle>
          <DialogDescription>
            Select items to return from Transaction #
            {String(transaction.id).padStart(4, "0")}. The transaction will be
            voided and stock will be restored.
          </DialogDescription>
        </DialogHeader>

        {/* Item selection */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <Label className="text-sm font-medium">Select Items</Label>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={toggleAll}
              className="text-xs"
            >
              {allSelected ? "Deselect All" : "Select All"}
            </Button>
          </div>

          <div className="rounded-lg border divide-y max-h-60 overflow-y-auto">
            {items.map((item) => {
              const checked = selectedItems.has(item.id)
              return (
                <label
                  key={item.id}
                  className="flex items-center gap-3 p-3 hover:bg-muted/50 cursor-pointer transition-colors"
                >
                  <Checkbox
                    checked={checked}
                    onCheckedChange={() => toggleItem(item.id)}
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">
                      {item.description || item.item?.name || "Item"}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {peso(item.final_price_per_unit)} × {item.quantity}
                    </p>
                  </div>
                  <span className="text-sm font-semibold shrink-0">
                    {peso(item.line_total)}
                  </span>
                </label>
              )
            })}
          </div>
        </div>

        {/* Refund summary */}
        {selectedItems.size > 0 && (
          <>
            <Separator />
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">
                {selectedItems.size} item{selectedItems.size !== 1 ? "s" : ""}{" "}
                selected
              </span>
              <div className="text-right">
                <p className="text-xs text-muted-foreground">Refund Amount</p>
                <p className="text-lg font-bold text-primary">
                  {peso(refundTotal)}
                </p>
              </div>
            </div>
          </>
        )}

        {/* Partial return warning */}
        {selectedItems.size > 0 && !allSelected && (
          <div className="flex items-start gap-2 p-3 rounded-lg border border-amber-200 bg-amber-50/50 dark:bg-amber-900/10">
            <AlertTriangle className="size-4 text-amber-600 mt-0.5 shrink-0" />
            <p className="text-xs text-amber-800 dark:text-amber-200">
              Partial returns are processed as a full void. After voiding,
              create a new transaction with the remaining items.
            </p>
          </div>
        )}

        {/* Reason */}
        <div className="space-y-2">
          <Label htmlFor="return-reason">
            Return Reason <span className="text-destructive">*</span>
          </Label>
          <Textarea
            id="return-reason"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="Why are these items being returned?"
            rows={2}
            disabled={isSubmitting}
          />
        </div>

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
          <Button
            type="button"
            variant="destructive"
            onClick={handleReturn}
            disabled={
              selectedItems.size === 0 || !reason.trim() || isSubmitting
            }
          >
            <RotateCcw className="size-4 mr-1.5" />
            {isSubmitting ? "Processing…" : "Process Return"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
