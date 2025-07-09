import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { StockTransfer } from '@/lib/constants/interface'
import { formatDate, getTransferBadgeVariant } from '@/lib/utils/helpers'

function DetailRow({
  label,
  value,
}: {
  label: string
  value: React.ReactNode
}) {
  return (
    <div className="space-y-1">
      <span className="text-sm text-muted-foreground">{label}</span>
      <div className="font-semibold">{value}</div>
    </div>
  )
}

export function StockTransferDetails({
  entity,
  onClose,
  onMarkAsPaid,
  markAsPaidPending,
}: {
  entity: StockTransfer
  onClose: () => void
  onMarkAsPaid: () => void
  markAsPaidPending: boolean
}) {
  return (
    <div className="space-y-8">
      {/* Status badges */}
      <div className="flex items-center gap-4">
        <Badge variant={getTransferBadgeVariant(entity?.is_finalized ?? false)}>
          {entity?.is_finalized ? 'Finalized' : 'Not Finalized'}
        </Badge>
        <Badge variant={getTransferBadgeVariant(entity?.is_paid ?? false)}>
          {entity?.is_paid ? 'Paid' : 'Unpaid'}
        </Badge>
      </div>

      {/* General info */}
      <div>
        <h3 className="text-lg font-semibold mb-4">General Information</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          <DetailRow
            label="To Stall"
            value={entity?.to_stall?.name ?? 'N/A'}
          />
          <DetailRow
            label="Technician"
            value={
              entity?.technician
                ? `${entity.technician.first_name} ${entity.technician.last_name}`
                : 'N/A'
            }
          />
          <DetailRow
            label="Date"
            value={
              entity?.transfer_date
                ? formatDate(new Date(entity.transfer_date))
                : 'N/A'
            }
          />
          <DetailRow
            label="Total Price"
            value={`₱ ${entity?.total_price?.toLocaleString() ?? 0}`}
          />
        </div>
      </div>

      {/* Transferred items */}
      <div>
        <h3 className="text-lg font-semibold mb-4">Transferred Items</h3>
        {entity?.items?.length ? (
          <div className="grid grid-cols-1 gap-4">
            {entity.items.map((item, idx) => (
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

      {/* Action buttons */}
      <div className="flex justify-between pt-4 border-t mt-6">
        <Button
          variant="outline"
          onClick={onClose}
        >
          Close
        </Button>

        {entity?.is_finalized && !entity.is_paid && (
          <Button
            type="button"
            variant="success"
            onClick={onMarkAsPaid}
            disabled={markAsPaidPending}
          >
            {markAsPaidPending ? 'Marking...' : 'Mark Paid'}
          </Button>
        )}
      </div>
    </div>
  )
}
