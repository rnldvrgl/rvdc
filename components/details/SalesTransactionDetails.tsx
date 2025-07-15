'use client'

import { Detail } from '@/components/details/Detail'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { SalesTransaction } from '@/lib/constants/interface'
import {
  formatCurrency,
  formatDate,
  getBadgeVariant,
} from '@/lib/utils/helpers'

export function SalesTransactionDetails({
  entity,
  onClose,
}: {
  entity: SalesTransaction
  onClose: () => void
}) {
  return (
    <div className="space-y-8">
      {/* Status badges */}
      <div className="flex items-center gap-4">
        <Badge variant={entity.voided ? 'destructive' : 'success'}>
          {entity.voided ? 'Voided' : 'Active'}
        </Badge>
        <Badge variant={getBadgeVariant(entity.payment_status)}>
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
                ? formatDate(
                    new Date(entity.created_at),
                    'EEE, MMM dd yyyy • hh:mm a',
                  )
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
          <div className="border rounded-xl overflow-x-auto shadow-sm">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted">
                  <TableHead className="w-1/2">Item</TableHead>
                  <TableHead className="w-1/6">Unit Price</TableHead>
                  <TableHead className="w-1/6">Quantity</TableHead>
                  <TableHead className="w-1/6 text-right">Line Total</TableHead>
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
                        {item.item?.name ?? 'Unnamed'}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        SKU: {item.item?.sku ?? 'N/A'}
                      </div>
                    </TableCell>
                    <TableCell>
                      ₱ {parseFloat(item.final_price_per_unit).toLocaleString()}
                    </TableCell>
                    <TableCell>{item.quantity}</TableCell>
                    <TableCell className="text-right font-semibold">
                      ₱ {parseFloat(item.line_total).toLocaleString()}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">No items listed.</p>
        )}
      </div>

      {/* Payments */}
      <div className="mt-8">
        <h3 className="text-lg font-semibold mb-4">Payments</h3>
        {entity.payments?.length ? (
          <div className="border rounded-xl overflow-x-auto shadow-sm ">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted">
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
                    <TableCell className="capitalize">
                      {payment.payment_type}
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
          <p className="text-sm text-muted-foreground">No payments recorded.</p>
        )}
      </div>

      <Button
        className="w-full"
        variant="outline"
        onClick={onClose}
      >
        Close
      </Button>
    </div>
  )
}
