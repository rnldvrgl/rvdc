import { withTooltipHeader } from '@/components/custom/table/components/ColumnHeaderWithTooltip'
import { DataTableActions } from '@/components/custom/table/components/DataTableActions'
import { Badge } from '@/components/ui/badge'
import { ChequeCollection, GetColumnsProps } from '@/lib/constants/interface'
import {
  formatCurrency,
  getBadgeVariant,
  getHashedStallBadgeClass,
  safeCell,
} from '@/lib/utils/helpers'
import { formatDate } from '@/lib/utils/helpers/date'
import { ColumnDef } from '@tanstack/react-table'
import { Edit, Eye, Trash2 } from 'lucide-react'
export function getChequeCollectionColumns({
  role,
  onView,
  onEdit,
  onDelete,
}: GetColumnsProps<ChequeCollection>): ColumnDef<ChequeCollection>[] {
  const columns: ColumnDef<ChequeCollection>[] = [
    {
      accessorKey: 'date_collected',
      header: withTooltipHeader(
        'Date Collected',
        'Date when cheque was collected',
      ),
      cell: ({ getValue }) =>
        safeCell(
          getValue()
            ? formatDate(getValue() as Date, 'EEE, MMM dd yyyy')
            : null,
        ),
      enableSorting: true,
    },
    {
      accessorKey: 'client_name',
      header: withTooltipHeader('Client', 'Name of the client'),
      cell: ({ row }) => safeCell(row.original.client_name),
      enableSorting: true,
    },
    {
      accessorKey: 'issued_by',
      header: withTooltipHeader(
        'Issued By',
        'Entity or person who issued the cheque',
      ),
      cell: ({ getValue }) => safeCell(getValue()),
    },
    {
      accessorKey: 'billing_amount',
      header: withTooltipHeader(
        'Billing Amount',
        'Billed amount related to this cheque',
      ),
      cell: ({ getValue }) => formatCurrency(getValue() as number),
    },
    {
      accessorKey: 'cheque_amount',
      header: withTooltipHeader(
        'Cheque Amount',
        'Amount written on the cheque',
      ),
      cell: ({ getValue }) => formatCurrency(getValue() as number),
    },
    {
      accessorKey: 'cheque_number',
      header: withTooltipHeader('Cheque #', 'Cheque number'),
      cell: ({ getValue }) => safeCell(getValue()),
    },
    {
      accessorKey: 'cheque_date',
      header: withTooltipHeader('Cheque Date', 'Date written on the cheque'),
      cell: ({ getValue }) =>
        safeCell(
          getValue()
            ? formatDate(getValue() as Date, 'EEE, MMM dd yyyy')
            : null,
        ),
    },
    {
      accessorKey: 'bank_name',
      header: withTooltipHeader('Bank', 'Bank that issued the cheque'),

      cell: ({ row }) => {
        const bankName = safeCell(row.original.bank_name)
        return (
          <Badge className={getHashedStallBadgeClass(bankName)}>
            {bankName}
          </Badge>
        )
      },
    },
    {
      accessorKey: 'or_number',
      header: withTooltipHeader('OR #', 'Official receipt number, if any'),
      cell: ({ getValue }) => safeCell(getValue()),
    },
    {
      accessorKey: 'collection_type',
      header: withTooltipHeader(
        'Collection Type',
        'How the cheque was collected',
      ),
      cell: ({ row }) => (
        <Badge variant={getBadgeVariant(row.original.collection_type)}>
          {safeCell(row.original.collection_type.trim().replace('_', ' '))}
        </Badge>
      ),
    },
    {
      accessorKey: 'collected_by_name',
      header: withTooltipHeader(
        'Collected By',
        'Staff who collected the cheque',
      ),
      cell: ({ row }) => safeCell(`${row.original.collected_by_name ?? ''}`),
    },
    {
      accessorKey: 'status',
      header: withTooltipHeader('Status', 'Current status of the cheque'),
      cell: ({ getValue }) => {
        const value = getValue() as string
        let variant: 'success' | 'warning' | 'destructive' | 'default' =
          'default'
        if (value === 'deposited' || value === 'encashed') variant = 'success'
        else if (value === 'pending') variant = 'warning'
        else if (['bounced', 'returned', 'cancelled'].includes(value))
          variant = 'destructive'
        return <Badge variant={variant}>{value}</Badge>
      },
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
          {
            label: 'Edit',
            icon: <Edit className="size-4" />,
            onClick: () => onEdit?.(row.original),
          },
          ...(role === 'admin'
            ? [
                {
                  label: 'Delete',
                  icon: <Trash2 className="size-4 text-destructive" />,
                  onClick: () => onDelete?.(row.original),
                  destructive: true,
                  confirmText: `Delete cheque ${row.original.cheque_number}?`,
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
