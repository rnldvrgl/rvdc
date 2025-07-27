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
import { RemittanceRecord } from '@/lib/constants/interface'
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
  {
    key: 'count_1000',
    declaredKey: 'declared_count_1000',
    label: '₱1000',
    value: 1000,
  },
  {
    key: 'count_500',
    declaredKey: 'declared_count_500',
    label: '₱500',
    value: 500,
  },
  {
    key: 'count_200',
    declaredKey: 'declared_count_200',
    label: '₱200',
    value: 200,
  },
  {
    key: 'count_100',
    declaredKey: 'declared_count_100',
    label: '₱100',
    value: 100,
  },
  {
    key: 'count_50',
    declaredKey: 'declared_count_50',
    label: '₱50',
    value: 50,
  },
  {
    key: 'count_20',
    declaredKey: 'declared_count_20',
    label: '₱20',
    value: 20,
  },
  {
    key: 'count_10',
    declaredKey: 'declared_count_10',
    label: '₱10',
    value: 10,
  },
  { key: 'count_5', declaredKey: 'declared_count_5', label: '₱5', value: 5 },
  { key: 'count_1', declaredKey: 'declared_count_1', label: '₱1', value: 1 },
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
    const balance = Number(entity?.balance || 0)

    if (balance > 0) {
      return { variant: 'warning', value: `Over ${formatCurrency(balance)}` }
    }

    if (balance < 0) {
      return {
        variant: 'destructive',
        value: `Short ${formatCurrency(-balance)}`,
      }
    }

    return { variant: 'success', value: 'Balanced' }
  }

  return (
    <div className="space-y-6 px-2 sm:px-4">
      {/* Status */}
      <div className="flex items-center justify-between">
        <Badge variant={getBoolBadgeVariant({ status: entity?.is_remitted })}>
          {entity?.is_remitted ? 'Acknowledged' : 'Not Acknowledged'}
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
            label="Cash"
            value={formatCurrency(entity.total_sales_cash)}
            icon={<Wallet size={18} />}
          />
          <Detail
            label="GCash"
            value={formatCurrency(entity.total_sales_gcash)}
            icon={<Banknote size={18} />}
          />
          <Detail
            label="Credit"
            value={formatCurrency(entity.total_sales_credit)}
            icon={<CreditCard size={18} />}
          />
          <Detail
            label="Debit"
            value={formatCurrency(entity.total_sales_debit)}
            icon={<CreditCard size={18} />}
          />
          <Detail
            label="Cheque"
            value={formatCurrency(entity.total_sales_cheque)}
            icon={<ReceiptText size={18} />}
          />
          <Detail
            label="Expenses"
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
            label="Declared"
            value={formatCurrency(entity.declared_amount)}
            icon={<Wallet size={18} />}
          />
          <Detail
            label="Remitted"
            value={formatCurrency(entity.remitted_amount)}
            icon={<Banknote size={18} />}
          />
          <Detail
            label="Expected"
            value={formatCurrency(entity.expected_remittance)}
            icon={<Banknote size={18} />}
          />
          <Detail
            label="Balance"
            value={formatCurrency(entity.balance)}
            icon={<Coins size={18} />}
          />
          <Detail
            label="COD (Today)"
            value={formatCurrency(entity.cash_breakdown?.cod_amount || 0)}
            icon={<Coins size={18} />}
          />
          <Detail
            label="COD (Next)"
            value={formatCurrency(entity.cod_for_next_day || 0)}
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
                Declared vs Expected
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
            <Table className="min-w-[800px]">
              <TableHeader>
                <TableRow className="bg-muted">
                  <TableHead>Denomination</TableHead>
                  <TableHead>Declared Count</TableHead>
                  <TableHead>Declared Value</TableHead>
                  <TableHead>Remitted Count</TableHead>
                  <TableHead>Remitted Value</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {DENOMINATIONS.map(({ key, declaredKey, label, value }) => {
                  const remittedCount = entity.cash_breakdown?.[key] ?? 0
                  const declaredCount =
                    entity.cash_breakdown?.[declaredKey] ?? 0

                  return (
                    <TableRow key={key}>
                      <TableCell>{label}</TableCell>
                      <TableCell>{declaredCount}</TableCell>
                      <TableCell>
                        {formatCurrency(declaredCount * value)}
                      </TableCell>
                      <TableCell>{remittedCount}</TableCell>
                      <TableCell>
                        {formatCurrency(remittedCount * value)}
                      </TableCell>
                    </TableRow>
                  )
                })}
                {/* Totals Row */}
                <TableRow className="font-semibold bg-muted/50">
                  <TableCell>Total</TableCell>
                  <TableCell />
                  <TableCell>
                    {formatCurrency(
                      DENOMINATIONS.reduce(
                        (sum, { declaredKey, value }) =>
                          sum +
                          (entity.cash_breakdown?.[declaredKey] ?? 0) * value,
                        0,
                      ),
                    )}
                  </TableCell>
                  <TableCell />
                  <TableCell>
                    {formatCurrency(
                      DENOMINATIONS.reduce(
                        (sum, { key, value }) =>
                          sum + (entity.cash_breakdown?.[key] ?? 0) * value,
                        0,
                      ),
                    )}
                  </TableCell>
                </TableRow>
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
            {markAsRemittedPending ? 'Marking...' : 'Acknowledge Remittance'}
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
