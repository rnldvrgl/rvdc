import { DataTableActions } from '@/components/custom/table/components/DataTableActions'
import { Badge } from '@/components/ui/badge'
import { GetColumnsProps, StockRoomStock } from '@/lib/constants/interface'
import { getBadgeVariant, safeCell } from '@/lib/utils/helpers'
import { ColumnDef } from '@tanstack/react-table'
import { Edit, PackagePlus } from 'lucide-react'

export function getStockRoomStockColumns({
  onEdit,
  onDelete,
  onRestock,
}: GetColumnsProps<StockRoomStock>): ColumnDef<StockRoomStock>[] {
  return [
    {
      accessorKey: 'item_name',
      header: 'Item',
      cell: ({ row }) => {
        const { item } = row.original
        return safeCell(item.display_name ?? item.name)
      },
    },
    {
      accessorKey: 'item_sku',
      header: 'SKU',
      cell: ({ row }) => safeCell(row.original.item.sku),
    },
    {
      accessorKey: 'category_name',
      header: 'Category',
      cell: ({ row }) => safeCell(row.original.item.category?.name),
    },
    {
      accessorKey: 'quantity',
      header: 'Quantity',
      cell: ({ row }) => {
        const { quantity, item } = row.original
        return safeCell(`${quantity} ${item.unit_of_measure}`)
      },
    },
    {
      accessorKey: 'low_stock_threshold',
      header: 'Low Threshold',
      cell: ({ row }) => {
        const { low_stock_threshold, item } = row.original
        return safeCell(`${low_stock_threshold} ${item.unit_of_measure}`)
      },
    },
    {
      accessorKey: 'status',
      header: 'Status',
      cell: ({ row }) => {
        const { status } = row.original
        return (
          <Badge variant={getBadgeVariant(status)}>
            {status.replace('_', ' ')}
          </Badge>
        )
      },
    },
    {
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
  ]
}
