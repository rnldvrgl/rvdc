import { DataTableActions } from '@/components/custom/table/components/DataTableActions'
import { Badge } from '@/components/ui/badge'
import { SalesTransaction } from '@/lib/constants/interface'
import {
  formatCurrency,
  formatDate,
  getBadgeVariant,
  getBoolBadgeVariant,
  safeCell,
} from '@/lib/utils/helpers'
import { ColumnDef, Row } from '@tanstack/react-table'
import { Edit, Eye, Trash2 } from 'lucide-react'

export function getSalesTransactionColumns({
  role,
  onView,
  onEdit,
  onDelete,
}: {
  onView: (tx: SalesTransaction) => void
  onEdit: (tx: SalesTransaction) => void
  onDelete: (tx: SalesTransaction) => void
  role: string
}): ColumnDef<SalesTransaction>[] {
  const columns: ColumnDef<SalesTransaction>[] = [
    ...(role === 'admin'
      ? [
          {
            accessorKey: 'stall.name',
            header: 'Stall',
            cell: ({ row }: { row: Row<SalesTransaction> }) =>
              safeCell(row.original.stall?.name),
          },
        ]
      : []),
    {
      accessorKey: 'manual_receipt_number',
      header: 'Receipt #',
      cell: ({ row }) => safeCell(row.original.manual_receipt_number),
    },
    {
      accessorKey: 'client.full_name',
      header: 'Client',
      cell: ({ row }) =>
        safeCell(
          `${row.original.client?.full_name} (${row.original.client?.contact_number})`,
        ),
    },
    {
      accessorKey: 'created_at',
      header: 'Date',
      cell: ({ getValue }) =>
        safeCell(
          getValue()
            ? formatDate(getValue() as Date, 'EEE, MMM dd yyyy • hh:mm a')
            : null,
        ),
    },
    {
      accessorKey: 'computed_total',
      header: 'Total Amount',
      cell: ({ getValue }) =>
        safeCell(getValue() ? formatCurrency(getValue() as number) : null),
    },
    {
      accessorKey: 'total_paid',
      header: 'Total Payment',
      cell: ({ getValue }) =>
        safeCell(getValue() ? formatCurrency(getValue() as number) : null),
    },
    {
      accessorKey: 'balance',
      header: 'Balance',
      cell: ({ row }) => {
        const balance =
          Number(row.original.computed_total) - Number(row.original.total_paid)
        return safeCell(balance > 0 ? formatCurrency(balance) : 0)
      },
    },
    {
      accessorKey: 'payment_status',
      header: 'Paid',
      cell: ({ getValue }) => (
        <Badge variant={getBadgeVariant(getValue() as string)}>
          {safeCell(getValue())}
        </Badge>
      ),
    },
    {
      accessorKey: 'voided',
      header: 'Voided',
      cell: ({ getValue }) => (
        <Badge
          variant={getBoolBadgeVariant({
            status: getValue() as boolean,
            reverse: true,
          })}
        >
          {safeCell(getValue()) ? 'Yes' : 'No'}
        </Badge>
      ),
    },
    {
      id: 'action',
      header: 'Action',
      cell: ({ row }) => (
        <DataTableActions
          items={[
            {
              label: 'View',
              icon: <Eye className="size-4" />,
              onClick: () => onView(row.original),
            },
            {
              label: 'Edit',
              icon: <Edit className="size-4" />,
              onClick: () => onEdit(row.original),
            },
            {
              label: 'Delete',
              icon: <Trash2 className="size-4 text-destructive" />,
              onClick: () => onDelete(row.original),
              destructive: true,
              confirmText: `Delete sale transaction from ${row.original.client?.full_name}?`,
            },
          ]}
        />
      ),
    },
  ]

  return columns
}
