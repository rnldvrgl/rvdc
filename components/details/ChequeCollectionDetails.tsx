'use client'

import { Detail } from '@/components/details/Detail'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { ChequeCollection } from '@/lib/constants/interface'
import { formatCurrency } from '@/lib/utils/helpers'
import { formatDate } from '@/lib/utils/helpers/date'

import { Calendar, FileText, HandCoins, User2 } from 'lucide-react'

import {
  RiBankLine,
  RiFileList2Line,
  RiMoneyCnyBoxLine,
  RiMoneyDollarCircleLine,
} from '@remixicon/react'

const statusVariants: Record<
  string,
  'default' | 'secondary' | 'success' | 'destructive' | 'outline'
> = {
  pending: 'secondary',
  deposited: 'secondary',
  encashed: 'success',
  returned: 'destructive',
  bounced: 'destructive',
  cancelled: 'outline',
}

export function ChequeCollectionDetails({
  entity,
  onClose,
}: {
  entity: ChequeCollection
  onClose: () => void
}) {
  const statusVariant = statusVariants[entity.status] ?? 'default'

  return (
    <div className="space-y-10">
      {/* Status */}
      <div className="flex items-center justify-between">
        <Badge variant={statusVariant}>{entity.status.toUpperCase()}</Badge>
      </div>

      {/* General Info */}
      <section>
        <h3 className="text-base font-semibold text-muted-foreground mb-4">
          General Information
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          <Detail
            label="Client"
            value={entity.client_name}
            icon={<User2 size={16} />}
          />
          <Detail
            label="Date Collected"
            value={formatDate(new Date(entity.date_collected))}
            icon={<Calendar size={16} />}
          />
          <Detail
            label="Collection Type"
            value={entity.collection_type.trim().replace('_', ' ')}
            icon={<HandCoins size={16} />}
            className="capitalize"
          />
          {entity.collected_by_name && (
            <Detail
              label="Collected By"
              value={entity.collected_by_name}
              icon={<User2 size={16} />}
            />
          )}
          <Detail
            label="Issued By"
            value={entity.issued_by}
            icon={<FileText size={16} />}
          />
          {entity.notes && (
            <Detail
              label="Notes"
              value={entity.notes}
              icon={<FileText size={16} />}
            />
          )}
        </div>
      </section>

      {/* Cheque Info */}
      <section>
        <h3 className="text-base font-semibold text-muted-foreground mb-4">
          Cheque Details
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          <Detail
            label="Cheque Number"
            value={entity.cheque_number}
            icon={<RiFileList2Line size={16} />}
          />
          <Detail
            label="Cheque Date"
            value={formatDate(new Date(entity.cheque_date))}
            icon={<Calendar size={16} />}
          />
          <Detail
            label="Bank Name"
            value={entity.bank_name}
            icon={<RiBankLine size={16} />}
          />
          <Detail
            label="Cheque Amount"
            value={formatCurrency(entity.cheque_amount)}
            icon={<RiMoneyDollarCircleLine size={16} />}
          />
          <Detail
            label="Billing Amount"
            value={formatCurrency(entity.billing_amount)}
            icon={<RiMoneyCnyBoxLine size={16} />}
          />
          {entity.or_number && (
            <Detail
              label="OR Number"
              value={entity.or_number}
              icon={<RiFileList2Line size={16} />}
            />
          )}
          {entity.sales_transaction && (
            <Detail
              label="Sales Transaction"
              value={`#${entity.sales_transaction}`}
              icon={<FileText size={16} />}
            />
          )}
        </div>
      </section>

      {/* Metadata */}
      <section>
        <h3 className="text-base font-semibold text-muted-foreground mb-4">
          Record Metadata
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          <Detail
            label="Created At"
            value={formatDate(new Date(entity.created_at))}
            icon={<Calendar size={16} />}
          />
          <Detail
            label="Last Updated"
            value={formatDate(new Date(entity.updated_at))}
            icon={<Calendar size={16} />}
          />
        </div>
      </section>

      {/* Close Button */}
      <div className="pt-4">
        <Button
          className="w-full sm:w-auto"
          variant="outline"
          onClick={onClose}
        >
          Close
        </Button>
      </div>
    </div>
  )
}
