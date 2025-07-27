import { DataTableActions } from '@/components/custom/table/components/DataTableActions'
import { Badge } from '@/components/ui/badge'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
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

const withTooltip = (label: string, tooltip: string) => (
  <TooltipProvider delayDuration={100}>
    <Tooltip>
      <TooltipTrigger asChild>
        <span className="cursor-help font-medium">{label}</span>
      </TooltipTrigger>
      <TooltipContent side="top">{tooltip}</TooltipContent>
    </Tooltip>
  </TooltipProvider>
)

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
            header: () => withTooltip('Stall', 'Market stall name'),
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
      header: () => withTooltip('Date', 'Remittance date'),
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
      header: () =>
        withTooltip('Cash Collected', 'Total cash collected from sales'),
      cell: ({ getValue }) => formatCurrency(getValue() as number),
      enableSorting: true,
    },

    {
      accessorKey: 'cod_for_today',
      header: () => withTooltip('Drawer In', 'Cash left in drawer today (COD)'),
      cell: ({ row }) =>
        formatCurrency(row.original.cod_for_today.cod_amount || 0),
    },

    {
      accessorKey: 'total_expenses',
      header: () =>
        withTooltip('Expenses', 'Cash expenses deducted from drawer'),
      cell: ({ getValue }) => formatCurrency(getValue() as number),
      enableSorting: true,
    },

    {
      accessorKey: 'expected_remittance',
      header: () =>
        withTooltip(
          'Expected',
          'Cash expected to be remitted: Cash Collected + Drawer In - Expenses',
        ),
      cell: ({ getValue }) => formatCurrency(getValue() as number),
      enableSorting: true,
    },

    {
      accessorKey: 'declared_amount',
      header: () =>
        withTooltip('Declared', 'Cash physically counted in drawer'),
      cell: ({ getValue }) => formatCurrency(getValue() as number),
    },

    {
      accessorKey: 'remitted_amount',
      header: () => withTooltip('Remitted', 'Cash turned over to admin'),
      cell: ({ getValue }) => formatCurrency(getValue() as number),
    },

    {
      accessorKey: 'cod_for_next_day',
      header: () =>
        withTooltip('Drawer Next', 'Cash reserved for tomorrow’s drawer'),
      cell: ({ getValue }) => formatCurrency(getValue() as number),
    },

    {
      id: 'remit_status',
      header: () =>
        withTooltip('Declared VS Expected', 'Over, short, or balanced'),
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

      header: () =>
        withTooltip(
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
