import { DataTableActions } from '@/components/custom/table/components/DataTableActions'
import { GetColumnsProps, Item } from '@/lib/constants/interface'
import { formatCurrency, safeCell } from '@/lib/utils/helpers'
import { ColumnDef } from '@tanstack/react-table'
import { Edit, Trash2 } from 'lucide-react'

export function getItemColumns({
  onEdit,
  onDelete,
}: GetColumnsProps<Item>): ColumnDef<Item>[] {
  return [
    {
      accessorKey: 'name',
      header: 'Name',
    },
    {
      accessorKey: 'sku',
      header: 'SKU',
      cell: ({ getValue }) => safeCell(getValue()),
    },
    {
      accessorKey: 'category.name',
      header: 'Category',
      cell: ({ row }) => safeCell(row.original.category?.name),
    },
    {
      accessorKey: 'description',
      header: 'Description',
      cell: ({ getValue }) => safeCell(getValue()),
    },
    {
      accessorKey: 'unit_of_measure',
      header: 'Unit',
      cell: ({ getValue }) => safeCell(getValue()),
    },
    {
      accessorKey: 'retail_price',
      header: 'Retail Price',
      cell: ({ getValue }) => formatCurrency(getValue() as number | string),
    },
    {
      accessorKey: 'action',
      header: 'Action',
      cell: ({ row }) => {
        const item = row.original
        return (
          <DataTableActions
            items={[
              {
                label: 'Edit',
                icon: <Edit className="size-4" />,
                onClick: () => onEdit(item),
              },
              {
                label: 'Delete',
                icon: <Trash2 className="size-4 text-destructive" />,
                onClick: () => onDelete(item),
                destructive: true,
                confirmText: `Delete ${item.name}?`,
              },
            ]}
          />
        )
      },
    },
  ]
}
