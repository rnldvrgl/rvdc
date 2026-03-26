"use client"

import { Badge, BadgeVariant } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { StockRoomStock } from "@/lib/constants/interface"
import { useDRFToastError } from "@/lib/hooks/useDRFToastError"
import { useStockRoomStockMutations } from "@/lib/mutations/useStockRoomStockMutations"
import { useStockRoomAudit } from "@/lib/queries/inventory/useStocks"
import { getBadgeVariant } from "@/lib/utils/helpers"
import {
  AlertTriangle,
  CheckCircle2,
  ClipboardCheck,
  Loader2,
  Package,
} from "lucide-react"
import { useEffect, useState } from "react"
import { useForm } from "react-hook-form"

interface FormValues {
  physical_count: string
}

interface StockRoomAuditDialogProps {
  open: boolean
  onClose: () => void
  stock: StockRoomStock | null
}

export default function StockRoomAuditDialog({
  open,
  onClose,
  stock,
}: StockRoomAuditDialogProps) {
  const form = useForm<FormValues>({ defaultValues: { physical_count: "" } })
  const { auditStockRoomStock } = useStockRoomStockMutations()
  const { handleError } = useDRFToastError()
  const { data: auditData, isLoading } = useStockRoomAudit(
    open && stock ? stock.id : null,
  )
  const [reconciled, setReconciled] = useState(false)

  useEffect(() => {
    if (open) {
      form.reset({ physical_count: "" })
      setReconciled(false)
    }
  }, [open, stock, form])

  if (!stock) return null

  const physicalCount = parseFloat(form.watch("physical_count") || "0")
  const systemQty = auditData?.system_quantity ?? stock.quantity
  const discrepancy = physicalCount - systemQty
  const hasDiscrepancy =
    form.watch("physical_count") !== "" && discrepancy !== 0

  const onSubmit = (data: FormValues) => {
    const count = parseFloat(data.physical_count)
    if (isNaN(count) || count < 0) {
      form.setError("physical_count", {
        type: "manual",
        message: "Please enter a valid non-negative number.",
      })
      return
    }

    auditStockRoomStock.mutate(
      { stock_id: stock.id, physical_count: count },
      {
        onSuccess: () => {
          setReconciled(true)
        },
        onError: (err: unknown) => {
          handleError(err)
        },
      },
    )
  }

  const statusVariant = getBadgeVariant(stock.status)

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => !v && onClose()}
    >
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ClipboardCheck className="size-5" />
            Stockroom Audit
          </DialogTitle>
          <DialogDescription>
            Compare physical count with system records and reconcile if needed.
          </DialogDescription>
        </DialogHeader>

        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="size-6 animate-spin text-muted-foreground" />
          </div>
        ) : reconciled ? (
          <div className="space-y-4 py-4">
            <div className="flex flex-col items-center gap-2 text-center">
              <CheckCircle2 className="size-12 text-success" />
              <p className="text-lg font-semibold">Stock Reconciled</p>
              <p className="text-sm text-muted-foreground">
                System quantity has been updated to match the physical count.
              </p>
            </div>
            <Button
              onClick={onClose}
              className="w-full"
            >
              Done
            </Button>
          </div>
        ) : (
          <Form {...form}>
            <form
              onSubmit={form.handleSubmit(onSubmit)}
              className="space-y-4"
            >
              {/* Item Info */}
              <Card>
                <CardContent className="px-6 space-y-1">
                  <div className="flex items-center gap-1 font-semibold text-primary text-base">
                    <Package size={16} /> {stock.item?.name ?? "N/A"}
                  </div>
                  <div className="text-sm">
                    <span className="text-muted-foreground">Category:</span>{" "}
                    {stock.item?.category?.name ?? "N/A"}
                  </div>
                  <div className="text-sm">
                    <span className="text-muted-foreground">Unit:</span>{" "}
                    {auditData?.item_unit ??
                      stock.item?.unit_of_measure ??
                      "pcs"}
                  </div>
                  <div className="flex items-center gap-3 text-sm">
                    <span className="text-muted-foreground">Status:</span>
                    <Badge
                      variant={statusVariant as BadgeVariant}
                      className="capitalize"
                    >
                      {stock.status.replace("_", " ")}
                    </Badge>
                  </div>
                </CardContent>
              </Card>

              {/* System Breakdown */}
              <Card>
                <CardContent className="px-6 space-y-2">
                  <div className="font-semibold text-sm">System Breakdown</div>
                  <div className="grid grid-cols-3 gap-3">
                    <BreakdownItem
                      label="Total Qty"
                      value={systemQty}
                      className="text-foreground"
                    />
                    <BreakdownItem
                      label="Reserved"
                      value={0}
                      className="text-warning"
                    />
                    <BreakdownItem
                      label="Available"
                      value={systemQty}
                      className="text-success"
                    />
                  </div>
                </CardContent>
              </Card>

              {/* Physical Count Input */}
              <FormField
                control={form.control}
                name="physical_count"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      Physical Count <span className="text-destructive">*</span>
                    </FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        placeholder="Enter the actual physical count"
                        {...field}
                        min={0}
                        step={0.01}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Discrepancy Indicator */}
              {form.watch("physical_count") !== "" && (
                <Card
                  className={
                    hasDiscrepancy
                      ? "border-amber-500/50 bg-amber-50/50 dark:bg-amber-950/20"
                      : "border-green-500/50 bg-green-50/50 dark:bg-green-950/20"
                  }
                >
                  <CardContent className="px-6 py-3">
                    <div className="flex items-center gap-2">
                      {hasDiscrepancy ? (
                        <AlertTriangle className="size-5 text-warning shrink-0" />
                      ) : (
                        <CheckCircle2 className="size-5 text-success shrink-0" />
                      )}
                      <div>
                        <p className="text-sm font-semibold">
                          {hasDiscrepancy
                            ? `Discrepancy: ${discrepancy > 0 ? "+" : ""}${discrepancy.toFixed(2)}`
                            : "Counts match!"}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {hasDiscrepancy
                            ? discrepancy > 0
                              ? "More items found than expected. System will be adjusted up."
                              : "Fewer items than expected. System will be adjusted down."
                            : "No adjustment needed."}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Actions */}
              <div className="flex gap-2 pt-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={onClose}
                  className="flex-1"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  className="flex-1"
                  disabled={
                    auditStockRoomStock.isPending ||
                    form.watch("physical_count") === "" ||
                    !hasDiscrepancy
                  }
                >
                  {auditStockRoomStock.isPending ? (
                    <>
                      <Loader2 className="size-4 mr-2 animate-spin" />
                      Reconciling...
                    </>
                  ) : (
                    "Reconcile Stock"
                  )}
                </Button>
              </div>
            </form>
          </Form>
        )}
      </DialogContent>
    </Dialog>
  )
}

function BreakdownItem({
  label,
  value,
  className,
}: {
  label: string
  value: number
  className?: string
}) {
  return (
    <div className="text-center">
      <div className="text-xs text-muted-foreground">{label}</div>
      <div className={`text-lg font-bold font-mono ${className ?? ""}`}>
        {value}
      </div>
    </div>
  )
}
