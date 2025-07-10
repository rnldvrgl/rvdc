import { DataTableActions } from '@/components/custom/table/components/DataTableActions'
import { StockTransfer } from '@/lib/constants/interface'
import {
  formatCurrency,
  formatDate,
  getTransferBadgeVariant,
  safeCell,
} from '@/lib/utils/helpers'
import { ColumnDef } from '@tanstack/react-table'
import { Edit, Eye, Trash2 } from 'lucide-react'

import { Badge } from '@/components/ui/badge'

export function getStockTransferColumns({
  onView,
  onEdit,
  onDelete,
}: {
  onView: (transfer: StockTransfer) => void
  onEdit: (transfer: StockTransfer) => void
  onDelete: (transfer: StockTransfer) => void
}): ColumnDef<StockTransfer>[] {
  return [
    {
      accessorKey: 'to_stall.name',
      header: 'To',
      cell: ({ row }) => safeCell(row.original.to_stall?.name),
    },
    {
      accessorKey: 'technician.name',
      header: 'Technician',
      cell: ({ row }) =>
        safeCell(
          `${row.original.technician?.first_name ?? ''} ${
            row.original.technician?.last_name ?? ''
          }`.trim(),
        ),
    },
    {
      accessorKey: 'used_for',
      header: 'Used For',
      cell: ({ getValue }) => safeCell(getValue()),
    },
    {
      accessorKey: 'transfer_date',
      header: 'Date',
      cell: ({ getValue }) =>
        safeCell(getValue() ? formatDate(getValue() as Date) : null),
    },
    {
      accessorKey: 'total_price',
      header: 'Total Price',
      cell: ({ getValue }) =>
        safeCell(
          getValue() ? formatCurrency(getValue() as number | string) : null,
        ),
    },
    {
      accessorKey: 'is_finalized',
      header: 'Finalized',
      cell: ({ getValue }) => (
        <Badge variant={getTransferBadgeVariant(getValue() as boolean)}>
          {(getValue() as boolean) ? 'Yes' : 'No'}
        </Badge>
      ),
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
      accessorKey: 'paid_at',
      header: 'Paid At',
      cell: ({ getValue }) =>
        safeCell(getValue() ? formatDate(getValue() as Date) : null),
    },
    {
      id: 'action',
      header: 'Action',
      cell: ({ row }) => (
        <DataTableActions
          items={[
            {
              label: 'View Details',
              icon: <Eye className="size-4" />,
              onClick: () => onView(row.original),
            },
            ...(!row.original.is_finalized
              ? [
                  {
                    label: 'Edit',
                    icon: <Edit className="size-4" />,
                    onClick: () => onEdit(row.original),
                  },
                ]
              : []),
            {
              label: 'Delete',
              icon: <Trash2 className="size-4 text-destructive" />,
              onClick: () => onDelete(row.original),
              destructive: true,
              confirmText: `Delete transfer to ${row.original.to_stall?.name}?`,
            },
          ]}
        />
      ),
    },
  ]
}
