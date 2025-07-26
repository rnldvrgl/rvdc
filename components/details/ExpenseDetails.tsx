import { Detail } from '@/components/details/Detail'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Expense } from '@/lib/constants/interface'
import { formatCurrency, getBoolBadgeVariant } from '@/lib/utils/helpers'
import { formatDate } from '@/lib/utils/helpers/date'
import {
  Calendar,
  ClipboardList,
  Clock,
  DollarSign,
  Store,
  Tag,
  Truck,
  User,
  Wallet,
} from 'lucide-react'

export function ExpenseDetails({
  entity,
  onClose,
}: {
  entity: Expense
  onClose: () => void
}) {
  return (
    <div className="space-y-8">
      {/* Status badges */}
      <div className="flex items-center gap-4">
        <Badge
          variant={getBoolBadgeVariant({ status: entity?.is_paid ?? false })}
        >
          {entity?.is_paid ? 'Paid' : 'Unpaid'}
        </Badge>
        {entity?.source && (
          <Badge
            variant="secondary"
            className="capitalize"
          >
            {entity.source}
          </Badge>
        )}
      </div>

      {/* General info */}
      <>
        <h3 className="text-lg font-semibold mb-4">Expense Information</h3>
        <Detail
          label="Description"
          value={entity?.description}
          icon={<ClipboardList className="w-4 h-4" />}
        />
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          <Detail
            label="Created At"
            value={
              entity?.created_at
                ? formatDate(
                    new Date(entity.created_at),
                    'EEE, MMM dd yyyy • hh:mm a',
                  )
                : 'N/A'
            }
            icon={<Calendar className="w-4 h-4" />}
          />
          <Detail
            label="Total Price"
            value={formatCurrency(entity?.total_price ?? 0)}
            icon={<DollarSign className="w-4 h-4" />}
          />
          <Detail
            label="Paid Amount"
            value={formatCurrency(entity?.paid_amount ?? 0)}
            icon={<Wallet className="w-4 h-4" />}
          />
          <Detail
            label="Paid At"
            value={
              entity?.paid_at
                ? formatDate(
                    new Date(entity.paid_at),
                    'EEE, MMM dd yyyy • hh:mm a',
                  )
                : null
            }
            icon={<Clock className="w-4 h-4" />}
          />
        </div>
      </>

      {/* Transfer details if source is transfer */}
      {entity?.source === 'transfer' && entity?.transfer && (
        <>
          <h3 className="text-lg font-semibold mb-4">Transfer Details</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <Detail
              label="From Stall"
              value={entity.transfer.from_stall?.name}
              icon={<Store className="w-4 h-4" />}
            />
            <Detail
              label="To Stall"
              value={entity.transfer.to_stall?.name}
              icon={<Store className="w-4 h-4" />}
            />
            <Detail
              label="Technician"
              value={
                entity.transfer.technician
                  ? `${entity.transfer.technician.first_name} ${entity.transfer.technician.last_name}`
                  : 'N/A'
              }
              icon={<User className="w-4 h-4" />}
            />
            <Detail
              label="Transfer Date"
              value={
                entity.transfer.transfer_date
                  ? formatDate(
                      new Date(entity.transfer.transfer_date),
                      'EEE, MMM dd yyyy • hh:mm a',
                    )
                  : 'N/A'
              }
              icon={<Truck className="w-4 h-4" />}
            />
            <Detail
              label="Used For"
              value={entity.transfer.used_for}
              icon={<Tag className="w-4 h-4" />}
            />
            <Detail
              label="Transfer Total Price"
              value={formatCurrency(entity.transfer.total_price ?? 0)}
              icon={<DollarSign className="w-4 h-4" />}
            />
          </div>

          {/* Items */}
          <div className="mt-6">
            <h4 className="text-md font-semibold mb-4">Transferred Items</h4>
            {entity.transfer.items?.length ? (
              <div className="grid grid-cols-1 gap-4">
                {entity.transfer.items.map((item, idx) => (
                  <div
                    key={idx}
                    className="flex justify-between items-center rounded-xl border p-4 hover:shadow-sm transition"
                  >
                    <div>
                      <div className="font-semibold">{item.item.name}</div>
                      <div className="text-sm text-muted-foreground">
                        SKU: {item.item.sku}
                      </div>
                    </div>
                    <Badge variant="secondary">Qty: {item.quantity}</Badge>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">No items listed.</p>
            )}
          </div>
        </>
      )}

      {/* Action buttons */}
      <div className="flex justify-between pt-4 border-t mt-6">
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
