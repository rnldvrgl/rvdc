import { withTooltipHeader } from '@/components/custom/table/components/ColumnHeaderWithTooltip'
import { DataTableActions } from '@/components/custom/table/components/DataTableActions'
import { Badge } from '@/components/ui/badge'
import { GetColumnsProps, RemittanceRecord } from '@/lib/constants/interface'
import {
  formatCurrency,
  getBoolBadgeVariant,
  getHashedStallBadgeClass,
  safeCell,
} from '@/lib/utils/helpers'
import { formatBackDate, formatDate } from '@/lib/utils/helpers/date'
import { ColumnDef, Row } from '@tanstack/react-table'
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
            header: withTooltipHeader('Stall', 'Market stall name'),
            cell: ({ row }: { row: Row<RemittanceRecord> }) => {
              const name = safeCell(row.original.stall_data?.name)
              return (
                <Badge className={getHashedStallBadgeClass(name)}>{name}</Badge>
              )
            },
            enableSorting: true,
          },
        ]
      : []),

    {
      accessorKey: 'created_at',
      header: withTooltipHeader('Date', 'Remittance date'),
      cell: ({ getValue }) =>
        safeCell(
          getValue()
            ? formatDate(getValue() as Date, 'EEE, MMM dd yyyy')
            : null,
        ),
      enableSorting: true,
    },

    {
      accessorKey: 'total_sales_cash',
      header: withTooltipHeader(
        'Cash Collected',
        'Total cash collected from sales',
      ),
      cell: ({ getValue }) => formatCurrency(getValue() as number),
      enableSorting: true,
    },

    {
      accessorKey: 'cod_for_today',
      header: withTooltipHeader('Drawer In', 'Cash left in drawer today (COD)'),
      cell: ({ row }) =>
        formatCurrency(row.original.cod_for_today.cod_amount || 0),
    },

    {
      accessorKey: 'total_expenses',
      header: withTooltipHeader(
        'Expenses',
        'Cash expenses deducted from drawer',
      ),
      cell: ({ getValue }) => formatCurrency(getValue() as number),
      enableSorting: true,
    },

    {
      accessorKey: 'expected_remittance',
      header: withTooltipHeader(
        'Expected',
        'Cash expected to be remitted: Cash Collected + Drawer In - Expenses',
      ),
      cell: ({ getValue }) => formatCurrency(getValue() as number),
      enableSorting: true,
    },

    {
      accessorKey: 'declared_amount',
      header: withTooltipHeader(
        'Declared',
        'Cash physically counted in drawer',
      ),
      cell: ({ getValue }) => formatCurrency(getValue() as number),
    },

    {
      accessorKey: 'remitted_amount',
      header: withTooltipHeader('Remitted', 'Cash turned over to admin'),
      cell: ({ getValue }) => formatCurrency(getValue() as number),
    },

    {
      accessorKey: 'cod_for_next_day',
      header: withTooltipHeader(
        'Drawer Next',
        'Cash reserved for tomorrow’s drawer',
      ),
      cell: ({ getValue }) => formatCurrency(getValue() as number),
    },

    {
      id: 'remit_status',
      header: withTooltipHeader(
        'Declared VS Expected',
        'Over, short, or balanced',
      ),
      cell: ({ row }) => {
        const balance = Number(row.original.balance)
        if (balance > 0) {
          return <Badge variant="warning">Over {formatCurrency(balance)}</Badge>
        }
        if (balance < 0) {
          return (
            <Badge variant="destructive">
              Short {formatCurrency(Math.abs(balance))}
            </Badge>
          )
        }
        return <Badge variant="success">Balanced</Badge>
      },
    },

    {
      accessorKey: 'is_remitted',
      header: withTooltipHeader(
        'Remitted?',
        'Marked by admin to confirm this remittance was received and verified.',
      ),
      cell: ({ getValue }) => (
        <Badge variant={getBoolBadgeVariant({ status: !!getValue() })}>
          {getValue() ? 'Yes' : 'No'}
        </Badge>
      ),
      enableSorting: true,
    },

    {
      id: 'action',
      header: 'Actions',
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
          ...(!row.original.is_remitted || role === 'admin'
            ? [
                {
                  label: 'Delete',
                  icon: <Trash2 className="size-4 text-destructive" />,
                  onClick: () => onDelete?.(row.original),
                  destructive: true,
                  confirmText: `Delete remittance record for ${
                    row.original.stall_data?.name
                  } (${formatBackDate(new Date(row.original.created_at))})?`,
                },
              ]
            : []),
        ]
        return <DataTableActions items={actions} />
      },
    },
  ]

  return columns
}
