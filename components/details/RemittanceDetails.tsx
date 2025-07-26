'use client'

import { Detail } from '@/components/details/Detail'
import { Badge, BadgeVariant } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { RemittanceRecord } from '@/lib/constants/infers'
import { useCurrentUser } from '@/lib/hooks/useCurrentUser'
import { formatCurrency, getBoolBadgeVariant } from '@/lib/utils/helpers'
import { formatDate } from '@/lib/utils/helpers/date'
import {
  AlertTriangle,
  Banknote,
  Calendar,
  CheckCircle,
  Coins,
  CreditCard,
  Landmark,
  ReceiptText,
  StickyNote,
  Wallet,
  XCircle,
} from 'lucide-react'

const DENOMINATIONS = [
  { key: 'count_1000', label: '₱1000' },
  { key: 'count_500', label: '₱500' },
  { key: 'count_100', label: '₱100' },
  { key: 'count_50', label: '₱50' },
  { key: 'count_20', label: '₱20' },
  { key: 'count_10', label: '₱10' },
  { key: 'count_5', label: '₱5' },
  { key: 'count_1', label: '₱1' },
] as const

export function RemittanceDetails({
  entity,
  onClose,
  onMarkAsRemitted,
  markAsRemittedPending,
}: {
  entity: RemittanceRecord
  onClose: () => void
  onMarkAsRemitted: () => void
  markAsRemittedPending: boolean
}) {
  const { role } = useCurrentUser()
  const remitStatus = (): { variant: BadgeVariant; value: string } => {
    const expected = Number(entity.expected_remittance ?? 0)
    const actual = Number(entity.remitted_amount ?? 0)
    const diff = actual - expected

    if (diff > 0) {
      return { variant: 'warning', value: `Over ${formatCurrency(diff)}` }
    }

    if (diff < 0) {
      return { variant: 'destructive', value: `Short ${formatCurrency(-diff)}` }
    }

    return { variant: 'default', value: 'Balanced' }
  }

  return (
    <div className="space-y-6 px-2 sm:px-4">
      {/* Status */}
      <div className="flex items-center justify-between">
        <Badge variant={getBoolBadgeVariant({ status: entity?.is_remitted })}>
          {entity?.is_remitted ? 'Remitted' : 'Not Remitted'}
        </Badge>
      </div>

      {/* General Info */}
      <section className="space-y-4">
        <h3 className="text-lg font-semibold">General Information</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Detail
            label="Stall"
            value={entity.stall_data?.name}
            icon={<Landmark size={18} />}
          />
          <Detail
            label="Date"
            value={formatDate(new Date(entity.created_at), 'EEE, MMM dd yyyy')}
            icon={<Calendar size={18} />}
          />
          <Detail
            label="Notes"
            value={entity.notes}
            icon={<StickyNote size={18} />}
          />
        </div>
      </section>

      {/* Sales and Expenses */}
      <section className="space-y-4">
        <h3 className="text-lg font-semibold">Sales and Expenses</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Detail
            label="Cash Sales"
            value={formatCurrency(entity.total_sales_cash)}
            icon={<Wallet size={18} />}
          />
          <Detail
            label="GCash Sales"
            value={formatCurrency(entity.total_sales_gcash)}
            icon={<Banknote size={18} />}
          />
          <Detail
            label="Credit Sales"
            value={formatCurrency(entity.total_sales_credit)}
            icon={<CreditCard size={18} />}
          />
          <Detail
            label="Debit Sales"
            value={formatCurrency(entity.total_sales_debit)}
            icon={<CreditCard size={18} />}
          />
          <Detail
            label="Cheque Sales"
            value={formatCurrency(entity.total_sales_cheque)}
            icon={<ReceiptText size={18} />}
          />
          <Detail
            label="Total Expenses"
            value={formatCurrency(entity.total_expenses)}
            icon={<Coins size={18} />}
          />
        </div>
      </section>

      {/* Remittance Summary */}
      <section className="space-y-4">
        <h3 className="text-lg font-semibold">Remittance Summary</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Detail
            label="Total Remitted"
            value={formatCurrency(entity.remitted_amount)}
            icon={<Wallet size={18} />}
          />
          <Detail
            label="Expected Amount"
            value={formatCurrency(entity.expected_remittance)}
            icon={<Banknote size={18} />}
          />
          <Detail
            label="Balance"
            value={formatCurrency(entity.balance)}
            icon={<Coins size={18} />}
          />

          <div className="flex items-center gap-3">
            <div className="text-muted-foreground pt-1">
              {remitStatus().variant === 'destructive' && <XCircle size={18} />}
              {remitStatus().variant === 'warning' && (
                <AlertTriangle size={18} />
              )}
              {remitStatus().variant === 'default' && <CheckCircle size={18} />}
            </div>
            <div className="space-y-1">
              <span className="text-sm text-muted-foreground">
                Remittance Status
              </span>
              <p className="text-semibold">
                <Badge variant={remitStatus().variant}>
                  {remitStatus().value}
                </Badge>
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Cash Breakdown */}
      <section className="space-y-4">
        <h3 className="text-lg font-semibold">Cash Denomination Breakdown</h3>

        {entity.cash_breakdown ? (
          <div className="border rounded-xl shadow-sm overflow-x-auto">
            <Table className="min-w-[700px]">
              <TableHeader>
                <TableRow className="bg-muted">
                  <TableHead className="w-1/2">Denomination</TableHead>
                  <TableHead>Count</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {DENOMINATIONS.map(({ key, label }) => (
                  <TableRow key={key}>
                    <TableCell>{label}</TableCell>
                    <TableCell>{entity.cash_breakdown?.[key] ?? 0}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        ) : (
          <p className="text-sm text-muted-foreground mt-2">
            No cash breakdown provided.
          </p>
        )}
      </section>

      {/* Actions */}
      <div className="flex flex-col sm:flex-row justify-end gap-4 border-t pt-6">
        {!entity.is_remitted && role === 'admin' && (
          <Button
            type="button"
            variant="success"
            className="w-full sm:w-auto"
            onClick={onMarkAsRemitted}
            disabled={markAsRemittedPending}
          >
            {markAsRemittedPending ? 'Marking...' : 'Mark as Remitted'}
          </Button>
        )}
        <Button
          type="button"
          variant="outline"
          className="w-full sm:w-auto"
          onClick={onClose}
        >
          Close
        </Button>
      </div>
    </div>
  )
}
