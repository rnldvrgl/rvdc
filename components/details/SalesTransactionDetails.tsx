'use client'

import { Detail } from '@/components/details/Detail'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { SalesTransaction } from '@/lib/constants/interface'
import { formatCurrency, formatDate } from '@/lib/utils/helpers'

export function SalesTransactionDetails({
  entity,
  onClose,
  onMarkAsPaid,
  markAsPaidPending,
  onVoid,
  voidPending,
}: {
  entity: SalesTransaction
  onClose: () => void
  onMarkAsPaid: () => void
  markAsPaidPending: boolean
  onVoid: () => void
  voidPending: boolean
}) {
  return (
    <div className="space-y-8">
      {/* Status badges */}
      <div className="flex items-center gap-4">
        <Badge variant={entity.voided ? 'destructive' : 'secondary'}>
          {entity.voided ? 'Voided' : 'Active'}
        </Badge>
        <Badge
          variant={entity.payment_status === 'paid' ? 'success' : 'outline'}
        >
          {entity.payment_status.toUpperCase()}
        </Badge>
      </div>

      {/* General info */}
      <div>
        <h3 className="text-lg font-semibold mb-4">General Information</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          <Detail
            label="Client"
            value={entity.client?.full_name}
          />
          <Detail
            label="Stall"
            value={entity.stall?.name}
          />
          <Detail
            label="Date"
            value={
              entity.created_at
                ? formatDate(new Date(entity.created_at))
                : 'N/A'
            }
          />
          <Detail
            label="Receipt #"
            value={
              entity.manual_receipt_number ||
              entity.system_receipt_number ||
              'N/A'
            }
          />
          <Detail
            label="Total Amount"
            value={`₱ ${
              entity.computed_total
                ? parseFloat(entity.computed_total).toLocaleString()
                : entity.items
                    .reduce((sum, item) => sum + parseFloat(item.line_total), 0)
                    .toLocaleString()
            }`}
          />
          <Detail
            label="Total Items"
            value={entity.total_items?.toLocaleString() ?? entity.items.length}
          />
          {entity.voided && (
            <Detail
              label="Void Reason"
              value={entity.void_reason ?? 'N/A'}
            />
          )}
        </div>
      </div>

      {/* Line Items */}
      <div>
        <h3 className="text-lg font-semibold mb-4">Line Items</h3>
        {entity.items?.length ? (
          <div className="grid grid-cols-1 gap-4">
            {entity.items.map((item, idx) => (
              <div
                key={idx}
                className="flex justify-between items-center rounded-xl border p-4 hover:shadow-sm transition"
              >
                <div>
                  <div className="font-semibold">
                    {item.item?.name ?? 'Unnamed'}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    SKU: {item.item?.sku ?? 'N/A'}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    Unit Price: ₱{' '}
                    {parseFloat(item.final_price_per_unit).toLocaleString()}
                  </div>
                </div>
                <div className="flex flex-col items-end">
                  <Badge variant="secondary">Qty: {item.quantity}</Badge>
                  <span className="text-sm font-semibold mt-1">
                    ₱ {parseFloat(item.line_total).toLocaleString()}
                  </span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">No items listed.</p>
        )}
      </div>

      {/* Payments */}
      <div>
        <h3 className="text-lg font-semibold mb-4">Payments</h3>
        {entity.payments?.length ? (
          <div className="grid grid-cols-1 gap-4">
            {entity.payments.map((payment, idx) => (
              <div
                key={idx}
                className="flex justify-between items-center rounded-xl border p-4"
              >
                <Detail
                  horizontal
                  label="Payment"
                  value={formatCurrency(payment.amount)}
                />
                <div className="text-sm text-muted-foreground">
                  {payment.payment_type} •{' '}
                  {formatDate(new Date(payment.payment_date))}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">No payments recorded.</p>
        )}
      </div>

      {/* Actions */}
      <div className="flex flex-col gap-4 pt-4 border-t mt-6">
        {!entity.voided && entity.payment_status !== 'paid' && (
          <Button
            type="button"
            className="w-full"
            variant="success"
            onClick={onMarkAsPaid}
            disabled={markAsPaidPending}
          >
            {markAsPaidPending ? 'Marking...' : 'Mark Paid'}
          </Button>
        )}

        {!entity.voided && (
          <Button
            type="button"
            className="w-full"
            variant="destructive"
            onClick={onVoid}
            disabled={voidPending}
          >
            {voidPending ? 'Voiding...' : 'Void Transaction'}
          </Button>
        )}

        <Button
          className="w-full"
          variant="outline"
          onClick={onClose}
        >
          Close
        </Button>
      </div>
    </div>
  )
}
