import { DataTableActions } from '@/components/custom/table/components/DataTableActions'
import { Badge } from '@/components/ui/badge'
import { Expense, GetColumnsProps } from '@/lib/constants/interface'
import {
  formatCurrency,
  formatDate,
  getBadgeVariant,
  getBoolBadgeVariant,
  getHashedStallBadgeClass,
  safeCell,
} from '@/lib/utils/helpers'
import { ColumnDef, Row } from '@tanstack/react-table'
import { Edit, Eye, Trash2 } from 'lucide-react'

export function getExpenseColumns({
  onView,
  onEdit,
  onDelete,
  role,
}: GetColumnsProps<Expense>): ColumnDef<Expense>[] {
  return [
    ...(role === 'admin'
      ? [
          {
            accessorKey: 'stall_data.name',
            header: 'Stall',
            cell: ({ row }: { row: Row<Expense> }) => {
              const stallName = safeCell(row.original.stall_data?.name)
              return (
                <Badge className={getHashedStallBadgeClass(stallName)}>
                  {stallName}
                </Badge>
              )
            },
          },
        ]
      : []),
    {
      accessorKey: 'description',
      header: 'Description',
      cell: ({ getValue }) => (
        <p className="truncate max-w-96">{safeCell(getValue())}</p>
      ),
    },
    {
      accessorKey: 'source',
      header: 'Source',
      cell: ({ getValue }) => (
        <Badge variant={getBadgeVariant(getValue() as string)}>
          {safeCell(getValue())}
        </Badge>
      ),
    },
    {
      accessorKey: 'total_price',
      header: 'Total Price',
      cell: ({ getValue }) => formatCurrency(getValue() as number),
    },
    {
      accessorKey: 'paid_amount',
      header: 'Paid Amount',
      cell: ({ getValue }) => formatCurrency(getValue() as number),
    },
    {
      accessorKey: 'is_paid',
      header: 'Paid',
      cell: ({ getValue }) => (
        <Badge variant={getBoolBadgeVariant({ status: getValue() as boolean })}>
          {(getValue() as boolean) ? 'Yes' : 'No'}
        </Badge>
      ),
    },
    {
      accessorKey: 'created_at',
      header: 'Created At',
      cell: ({ getValue }) =>
        safeCell(
          getValue()
            ? formatDate(
                new Date(getValue() as string),
                'EEE, MMM dd yyyy • hh:mm a',
              )
            : null,
        ),
    },
    {
      accessorKey: 'paid_at',
      header: 'Paid At',
      cell: ({ getValue }) =>
        safeCell(
          getValue()
            ? formatDate(getValue() as Date, 'EEE, MMM dd yyyy • hh:mm a')
            : null,
        ),
    },
    {
      accessorKey: 'action',
      header: 'Action',
      cell: ({ row }) => {
        const expense = row.original
        return (
          <DataTableActions
            items={[
              {
                label: 'View Details',
                icon: <Eye className="size-4" />,
                onClick: () => onView?.(expense),
              },
              ...(row.original.source == 'manual'
                ? [
                    {
                      label: 'Edit',
                      icon: <Edit className="size-4" />,
                      onClick: () => onEdit(expense),
                    },
                    {
                      label: 'Delete',
                      icon: <Trash2 className="size-4 text-destructive" />,
                      onClick: () => onDelete(expense),
                      destructive: true,
                      confirmText: `Delete expense for ${expense.stall_data?.name}?`,
                    },
                  ]
                : []),
            ]}
          />
        )
      },
    },
  ]
}
