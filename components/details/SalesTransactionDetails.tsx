"use client"

import { Detail } from "@/components/details/Detail"
import { SalesReturnDialog } from "@/components/sales/SalesReturnDialog"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Textarea } from "@/components/ui/textarea"
import { SalesTransaction } from "@/lib/constants/interface"
import { useSalesTransactionMutations } from "@/lib/mutations/useSalesTransactionMutations"
import { formatCurrency, getBadgeVariant } from "@/lib/utils/helpers"
import { formatDate } from "@/lib/utils/helpers/date"
import {
  Ban,
  Calendar,
  CreditCard,
  Hash,
  Package,
  Receipt,
  RotateCcw,
  ShoppingCart,
  Store,
  Undo2,
  User,
} from "lucide-react"
import { useState } from "react"

export function SalesTransactionDetails({
  entity,
  onClose,
}: {
  entity: SalesTransaction
  onClose: () => void
}) {
  const [voidOpen, setVoidOpen] = useState(false)
  const [voidReason, setVoidReason] = useState("")
  const [returnOpen, setReturnOpen] = useState(false)
  const { voidTransaction, unvoidTransaction } = useSalesTransactionMutations()

  const isVoiding = voidTransaction.status === "pending"
  const isUnvoiding = unvoidTransaction.status === "pending"

  const handleVoid = () => {
    if (!voidReason.trim()) return
    voidTransaction.mutate(
      { id: entity.id, data: { void_reason: voidReason.trim() } },
      {
        onSuccess: () => {
          setVoidReason("")
          setVoidOpen(false)
          onClose()
        },
      },
    )
  }

  const handleUnvoid = () => {
    unvoidTransaction.mutate(entity.id, {
      onSuccess: () => onClose(),
    })
  }

  return (
    <div className="space-y-6">
      {/* Status badges */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Badge variant={entity.voided ? "destructive" : "success"}>
            {entity.voided ? "Voided" : "Active"}
          </Badge>
          <Badge variant={getBadgeVariant(entity.payment_status)}>
            {entity.payment_status.toUpperCase()}
          </Badge>
        </div>

        {/* Action buttons */}
        <div className="flex items-center gap-2">
          {entity.voided ? (
            <Button
              variant="outline"
              size="sm"
              onClick={handleUnvoid}
              disabled={isUnvoiding}
            >
              <Undo2 className="size-4 mr-1.5" />
              {isUnvoiding ? "Restoring…" : "Unvoid"}
            </Button>
          ) : (
            <>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setReturnOpen(true)}
              >
                <RotateCcw className="size-4 mr-1.5" />
                Return
              </Button>
              <Button
                variant="destructive"
                size="sm"
                onClick={() => setVoidOpen(true)}
              >
                <Ban className="size-4 mr-1.5" />
                Void
              </Button>
            </>
          )}
        </div>
      </div>

      {/* Void Dialog */}
      <Dialog
        open={voidOpen}
        onOpenChange={setVoidOpen}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Ban className="size-5 text-destructive" />
              Void Transaction
            </DialogTitle>
            <DialogDescription>
              This will void the transaction and restore all item stock. This
              action can be reversed later.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <Label htmlFor="void-reason">
              Reason <span className="text-destructive">*</span>
            </Label>
            <Textarea
              id="void-reason"
              value={voidReason}
              onChange={(e) => setVoidReason(e.target.value)}
              placeholder="Why is this transaction being voided?"
              rows={2}
              disabled={isVoiding}
            />
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setVoidOpen(false)}
              disabled={isVoiding}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleVoid}
              disabled={!voidReason.trim() || isVoiding}
            >
              {isVoiding ? "Voiding…" : "Void Transaction"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Return Dialog */}
      <SalesReturnDialog
        open={returnOpen}
        onClose={() => {
          setReturnOpen(false)
          onClose()
        }}
        transaction={entity}
      />

      {/* General Info */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Receipt className="size-4" />
            General Information
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <Detail
              label="Client"
              value={entity.client?.full_name}
              icon={<User className="size-4" />}
            />
            <Detail
              label="Stall"
              value={entity.stall?.name}
              icon={<Store className="size-4" />}
            />
            <Detail
              label="Date"
              value={
                entity.created_at
                  ? formatDate(
                      new Date(entity.created_at),
                      "EEE, MMM dd yyyy • hh:mm a",
                    )
                  : "N/A"
              }
              icon={<Calendar className="size-4" />}
            />
            <Detail
              label="Receipt #"
              value={
                entity.manual_receipt_number ||
                entity.system_receipt_number ||
                "N/A"
              }
              icon={<Hash className="size-4" />}
            />
            <Detail
              label="Total Amount"
              value={`₱ ${
                entity.computed_total
                  ? parseFloat(entity.computed_total).toLocaleString()
                  : entity.items
                      .reduce((sum, item) => sum + item.line_total, 0)
                      .toLocaleString()
              }`}
              icon={<CreditCard className="size-4" />}
            />
            <Detail
              label="Total Items"
              value={
                entity.total_items?.toLocaleString() ?? entity.items.length
              }
              icon={<Package className="size-4" />}
            />
            {entity.voided && (
              <Detail
                label="Void Reason"
                value={entity.void_reason ?? "N/A"}
              />
            )}
          </div>
        </CardContent>
      </Card>

      {/* Line Items */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <ShoppingCart className="size-4" />
            Line Items
          </CardTitle>
        </CardHeader>
        <CardContent>
          {entity.items?.length ? (
            <div className="border rounded-lg overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/50">
                    <TableHead className="w-1/2">Item</TableHead>
                    <TableHead className="w-1/6">Unit Price</TableHead>
                    <TableHead className="w-1/6">Quantity</TableHead>
                    <TableHead className="w-1/6 text-right">
                      Line Total
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {entity.items.map((item, idx) => (
                    <TableRow
                      key={idx}
                      className="hover:bg-muted/50 transition-colors"
                    >
                      <TableCell>
                        <div className="font-semibold">
                          {item.description || item.item?.name || "Unnamed"}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          SKU: {item.item?.sku ?? "N/A"}
                        </div>
                      </TableCell>
                      <TableCell>
                        {formatCurrency(item.final_price_per_unit)}
                      </TableCell>
                      <TableCell>{item.quantity}</TableCell>
                      <TableCell className="text-right font-semibold">
                        {formatCurrency(item.line_total)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">No items listed.</p>
          )}
        </CardContent>
      </Card>

      {/* Payments */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <CreditCard className="size-4" />
            Payments
          </CardTitle>
        </CardHeader>
        <CardContent>
          {entity.payments?.length ? (
            <div className="border rounded-lg overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/50">
                    <TableHead>Type</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead className="text-right">Amount</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {entity.payments.map((payment, idx) => (
                    <TableRow
                      key={idx}
                      className="hover:bg-muted/50 transition-colors"
                    >
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <span className="capitalize">
                            {payment.payment_type}
                          </span>
                          {payment.cheque_number && (
                            <Badge
                              variant="secondary"
                              className="text-xs"
                            >
                              #{payment.cheque_number}
                            </Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        {formatDate(new Date(payment.payment_date))}
                      </TableCell>
                      <TableCell className="text-right font-semibold">
                        {formatCurrency(payment.amount)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">
              No payments recorded.
            </p>
          )}
        </CardContent>
      </Card>

      {/* Footer */}
      <div className="flex justify-end border-t pt-4">
        <Button
          variant="outline"
          onClick={onClose}
        >
          Close
        </Button>
      </div>
    </div>
  )
}
