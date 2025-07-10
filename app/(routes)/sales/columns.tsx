import { DataTableActions } from '@/components/custom/table/components/DataTableActions'
import { Badge } from '@/components/ui/badge'
import { SalesTransaction } from '@/lib/constants/interface'
import {
  formatCurrency,
  formatDate,
  getTransferBadgeVariant,
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
      accessorKey: 'system_receipt_number',
      header: 'Receipt #',
      cell: ({ row }) => safeCell(row.original.system_receipt_number),
    },
    {
      accessorKey: 'client.name',
      header: 'Client',
      cell: ({ row }) => safeCell(row.original.client?.full_name),
    },
    {
      accessorKey: 'created_at',
      header: 'Date',
      cell: ({ getValue }) =>
        safeCell(getValue() ? formatDate(getValue() as Date) : null),
    },
    {
      accessorKey: 'total_amount',
      header: 'Total',
      cell: ({ getValue }) =>
        safeCell(getValue() ? formatCurrency(getValue() as number) : null),
    },
    {
      accessorKey: 'is_paid',
      header: 'Paid',
      cell: ({ getValue }) => (
        <Badge variant={getTransferBadgeVariant(getValue() as boolean)}>
          {(getValue() as boolean) ? 'Yes' : 'No'}
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
