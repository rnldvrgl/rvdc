import { DataTableActions } from '@/components/custom/table/components/DataTableActions'
import { Badge } from '@/components/ui/badge'
import { RemittanceRecord } from '@/lib/constants/infers'
import { GetColumnsProps } from '@/lib/constants/interface'
import {
  formatCurrency,
  getBoolBadgeVariant,
  getHashedStallBadgeClass,
  safeCell,
} from '@/lib/utils/helpers'
import { ColumnDef, Row } from '@tanstack/react-table'
import { formatDate } from 'date-fns'
import { Edit, Eye, Trash2 } from 'lucide-react'

export function getRemittanceColumns({
  role,
  onView,
  onEdit,
  onDelete,
}: GetColumnsProps<RemittanceRecord>): ColumnDef<RemittanceRecord>[] {
  const columns: ColumnDef<RemittanceRecord>[] = [
    ...(role === 'admin'
      ? [
          {
            accessorKey: 'stall_data.name',
            header: 'Stall',
            cell: ({ row }: { row: Row<RemittanceRecord> }) => {
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
      accessorKey: 'date',
      header: 'Date',
      cell: ({ getValue }) =>
        safeCell(
          getValue()
            ? formatDate(getValue() as Date, 'EEE, MMM dd yyyy')
            : null,
        ),
      enableSorting: true,
    },

    {
      accessorKey: 'total_collected',
      header: 'Collected',
      cell: ({ getValue }) => formatCurrency(getValue() as number),
      enableSorting: true,
    },

    {
      accessorKey: 'total_expenses',
      header: 'Expenses',
      cell: ({ getValue }) => formatCurrency(getValue() as number),
      enableSorting: true,
    },

    {
      accessorKey: 'expected_remittance',
      header: 'Expected',
      cell: ({ getValue }) => formatCurrency(getValue() as number),
      enableSorting: true,
    },

    {
      accessorKey: 'remitted_amount',
      header: 'Remitted',
      cell: ({ getValue }) => formatCurrency(getValue() as number),
      enableSorting: true,
    },

    {
      id: 'remit_status',
      header: 'Over/Short',
      cell: ({ row }) => {
        const expected = row.original.expected_remittance ?? 0
        const actual = row.original.remitted_amount ?? 0
        const difference = Number(actual) - Number(expected)

        if (difference > 0) {
          return (
            <Badge variant="warning">Over {formatCurrency(difference)}</Badge>
          )
        }

        if (difference < 0) {
          return (
            <Badge variant="destructive">
              Short {formatCurrency(Math.abs(difference))}
            </Badge>
          )
        }

        return <Badge variant="default">Balanced</Badge>
      },
    },

    {
      accessorKey: 'notes',
      header: 'Notes',
      cell: ({ getValue }) => safeCell(getValue()),
    },

    {
      accessorKey: 'is_remitted',
      header: 'Remitted?',
      cell: ({ getValue }) => (
        <Badge
          variant={getBoolBadgeVariant({
            status: !!getValue(),
          })}
        >
          {getValue() ? 'Yes' : 'No'}
        </Badge>
      ),
      enableSorting: true,
    },

    {
      id: 'action',
      header: 'Action',
      cell: ({ row }) => {
        const actions = [
          {
            label: 'View',
            icon: <Eye className="size-4" />,
            onClick: () => onView?.(row.original),
          },
          ...(row.original.is_remitted
            ? []
            : [
                {
                  label: 'Edit',
                  icon: <Edit className="size-4" />,
                  onClick: () => onEdit?.(row.original),
                },
              ]),
          {
            label: 'Delete',
            icon: <Trash2 className="size-4 text-destructive" />,
            onClick: () => onDelete?.(row.original),
            destructive: true,
            confirmText: `Delete remittance record for ${row.original.stall_data?.name} (${row.original.date})?`,
          },
        ]
        return <DataTableActions items={actions} />
      },
    },
  ]

  return columns
}
