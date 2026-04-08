"use client"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Separator } from "@/components/ui/separator"
import type { DirectStockRequestBatch, StockRequest } from "@/lib/constants/interface"
import {
  useApproveStockRequest,
  useDeclineStockRequest,
} from "@/lib/mutations/useStockRequestMutations"
import { format } from "date-fns"
import { Check, ClipboardList, X } from "lucide-react"
import { useState } from "react"

interface Props {
  batch: DirectStockRequestBatch
  open: boolean
  onClose: () => void
}

export default function DirectBatchReviewDialog({ batch, open, onClose }: Props) {
  // local approved_quantity overrides per item id
  const [qtyMap, setQtyMap] = useState<Record<number, string>>({})

  const approveMutation = useApproveStockRequest()
  const declineMutation = useDeclineStockRequest()

  const isBusy = approveMutation.isPending || declineMutation.isPending

  function getQty(item: StockRequest): string {
    return qtyMap[item.id] ?? item.requested_quantity
  }

  async function handleApprove(item: StockRequest) {
    const rawQty = getQty(item)
    const approved_quantity = rawQty ? Number(rawQty) : undefined
    await approveMutation.mutateAsync({ id: item.id, approved_quantity })
  }

  async function handleDecline(item: StockRequest) {
    await declineMutation.mutateAsync({ id: item.id })
  }

  const approvedCount = batch.items.filter((i) => i.status === "approved").length
  const declinedCount = batch.items.filter((i) => i.status === "declined").length
  const pendingCount = batch.items.filter((i) => i.status === "pending").length
  const totalCount = batch.items.length
  const resolvedCount = approvedCount + declinedCount
  const progressPct = totalCount > 0 ? Math.round((resolvedCount / totalCount) * 100) : 0

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) onClose() }}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ClipboardList className="h-5 w-5" />
            Review Direct Stock Request #{batch.id}
          </DialogTitle>
          <DialogDescription>
            Submitted by <strong>{batch.requested_by_name ?? "Unknown"}</strong>{" "}
            on {format(new Date(batch.created_at), "MMM dd, yyyy hh:mm a")}
            {batch.notes && (
              <span className="block mt-1 text-foreground/80">&ldquo;{batch.notes}&rdquo;</span>
            )}
          </DialogDescription>
        </DialogHeader>

        {/* Progress */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">
              {resolvedCount} / {totalCount} resolved
            </span>
            <div className="flex items-center gap-2">
              {approvedCount > 0 && (
                <Badge variant="success" className="text-xs">
                  {approvedCount} approved
                </Badge>
              )}
              {declinedCount > 0 && (
                <Badge variant="destructive" className="text-xs">
                  {declinedCount} skipped
                </Badge>
              )}
              {pendingCount > 0 && (
                <Badge variant="secondary" className="text-xs">
                  {pendingCount} pending
                </Badge>
              )}
            </div>
          </div>
          <div className="h-1.5 w-full rounded-full bg-muted overflow-hidden">
            <div
              className="h-full bg-primary rounded-full transition-all duration-300"
              style={{ width: `${progressPct}%` }}
            />
          </div>
        </div>

        <Separator />

        {/* Item rows */}
        <div className="space-y-3">
          {batch.items.map((item) => {
            const isApproved = item.status === "approved"
            const isDeclined = item.status === "declined"
            const isResolved = isApproved || isDeclined

            return (
              <div
                key={item.id}
                className={`rounded-lg border p-3 transition-colors ${
                  isApproved
                    ? "bg-success/5 border-success/30 opacity-70"
                    : isDeclined
                    ? "bg-muted/40 border-muted opacity-60"
                    : "bg-card"
                }`}
              >
                <div className="flex items-start gap-3">
                  {/* Status indicator */}
                  <div className="mt-0.5 shrink-0">
                    {isApproved ? (
                      <div className="rounded-full bg-success/20 p-1">
                        <Check className="h-3.5 w-3.5 text-success" />
                      </div>
                    ) : isDeclined ? (
                      <div className="rounded-full bg-muted p-1">
                        <X className="h-3.5 w-3.5 text-muted-foreground" />
                      </div>
                    ) : (
                      <div className="h-5 w-5 rounded-full border-2 border-muted-foreground/30" />
                    )}
                  </div>

                  {/* Item info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <p className={`font-medium text-sm ${isResolved ? "line-through text-muted-foreground" : ""}`}>
                          {item.item_name}
                        </p>
                        <p className="text-xs text-muted-foreground font-mono">{item.item_sku}</p>
                        <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                          <span>Stall: {item.stall_name}</span>
                          <span>In stock: {item.available_stock} {item.item_unit}</span>
                          {item.notes && <span className="italic">&ldquo;{item.notes}&rdquo;</span>}
                        </div>
                      </div>
                      <div className="text-right shrink-0">
                        <p className="text-xs text-muted-foreground">Requested</p>
                        <p className="text-sm font-semibold">
                          {item.requested_quantity} {item.item_unit}
                        </p>
                        {isApproved && item.approved_quantity && (
                          <p className="text-xs text-success">
                            Released: {item.approved_quantity} {item.item_unit}
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Actions row for pending items */}
                    {!isResolved && (
                      <div className="flex items-center gap-2 mt-2.5">
                        <div className="flex items-center gap-1.5 flex-1">
                          <span className="text-xs text-muted-foreground whitespace-nowrap">Release qty:</span>
                          <Input
                            type="number"
                            min="0.01"
                            step="0.01"
                            value={getQty(item)}
                            onChange={(e) =>
                              setQtyMap((prev) => ({ ...prev, [item.id]: e.target.value }))
                            }
                            className="h-7 w-24 text-sm"
                            disabled={isBusy}
                          />
                          <span className="text-xs text-muted-foreground">{item.item_unit}</span>
                        </div>
                        <Button
                          size="sm"
                          variant="default"
                          className="h-7 px-3 text-xs bg-success hover:bg-success/90"
                          onClick={() => handleApprove(item)}
                          disabled={isBusy || !getQty(item) || Number(getQty(item)) <= 0}
                        >
                          <Check className="h-3.5 w-3.5 mr-1" />
                          Approve
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-7 px-3 text-xs text-muted-foreground"
                          onClick={() => handleDecline(item)}
                          disabled={isBusy}
                        >
                          <X className="h-3.5 w-3.5 mr-1" />
                          Skip
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )
          })}
        </div>

        {pendingCount === 0 && (
          <div className="rounded-lg bg-muted/40 px-4 py-3 text-center text-sm text-muted-foreground">
            All items have been reviewed.
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
