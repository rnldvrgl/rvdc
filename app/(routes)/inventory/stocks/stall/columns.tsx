import { DataTableActions } from '@/components/custom/table/components/DataTableActions'
import { Badge } from '@/components/ui/badge'
import { GetColumnsProps, Stock } from '@/lib/constants/interface'
import {
  getHashedStallBadgeClass,
  getStockBadgeVariant,
  safeCell,
} from '@/lib/utils/helpers'
import { ColumnDef } from '@tanstack/react-table'
import { Edit, PackagePlus } from 'lucide-react'

export function getStallStockColumns({
  onEdit,
  onDelete,
  onRestock,
  role,
}: GetColumnsProps<Stock>): ColumnDef<Stock>[] {
  const columnMap: Record<string, ColumnDef<Stock>> = {
    item_name: {
      accessorKey: 'item_name',
      header: 'Item',
      cell: ({ row }) =>
        safeCell(
          row.original.item.display_name
            ? row.original.item.display_name
            : row.original.item.name,
        ),
    },
    item_sku: {
      accessorKey: 'item_sku',
      header: 'SKU',
      cell: ({ row }) => safeCell(row.original.item.sku),
    },
    category_name: {
      accessorKey: 'category_name',
      header: 'Category',
      cell: ({ row }) => safeCell(row.original.item.category?.name),
    },
    quantity: {
      accessorKey: 'quantity',
      header: 'Quantity',
      cell: ({ getValue }) => safeCell(getValue()),
    },
    low_stock_threshold: {
      accessorKey: 'low_stock_threshold',
      header: 'Low Threshold',
      cell: ({ getValue }) => safeCell(getValue()),
    },
    stall_name: {
      accessorKey: 'stall_name',
      header: 'Stall',
      cell: ({ row }) => {
        const stall_name = safeCell(row.original.stall?.name)
        return (
          <Badge className={getHashedStallBadgeClass(stall_name)}>
            {stall_name}
          </Badge>
        )
      },
    },
    status: {
      accessorKey: 'status',
      header: 'Status',
      cell: ({ row }) => {
        const stock = row.original
        const variant = getStockBadgeVariant(stock.status)

        return <Badge variant={variant}>{stock.status.replace('_', ' ')}</Badge>
      },
    },

    action: {
      accessorKey: 'action',
      header: 'Action',
      cell: ({ row }) => {
        const stock = row.original
        return (
          <DataTableActions
            items={[
              {
                label: 'Restock',
                icon: <PackagePlus className="size-4" />,
                onClick: () => onRestock?.(stock),
              },
              {
                label: 'Edit',
                icon: <Edit className="size-4" />,
                onClick: () => onEdit(stock),
              },
              // TODO: ADDING OF DEACTIVATION
              // {
              //   label: 'Deactivate',
              //   icon: <Trash2 className="size-4 text-destructive" />,
              //   onClick: () => onDelete(stock),
              //   destructive: true,
              //   confirmText: `Deactivate stock of ${stock.item.name}?`,
              // },
            ]}
          />
        )
      },
    },
  }

  const roleColumns: Record<string, string[]> = {
    admin: [
      'item_name',
      'item_sku',
      'category_name',
      'quantity',
      'low_stock_threshold',
      'stall_name',
      'status',
      'action',
    ],
    manager: [
      'item_name',
      'item_sku',
      'category_name',
      'quantity',
      'low_stock_threshold',
      'status',
      'action',
    ],
  }

  // Build the columns array from the config
  const selectedColumns = role && roleColumns[role] ? roleColumns[role] : []
  return selectedColumns.map((key) => columnMap[key])
}
