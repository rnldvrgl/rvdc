import { DataTableActions } from '@/components/custom/table/components/DataTableActions'
import { GetColumnsProps, ProductCategory } from '@/lib/constants/interface'
import { safeCell } from '@/lib/utils/helpers'
import { ColumnDef } from '@tanstack/react-table'
import { Edit, Trash2 } from 'lucide-react'

export function getCategoryColumns({
  onEdit,
  onDelete,
}: GetColumnsProps<ProductCategory>): ColumnDef<ProductCategory>[] {
  return [
    {
      accessorKey: 'name',
      header: 'Name',
    },
    {
      accessorKey: 'description',
      header: 'Description',
      cell: ({ getValue }) => safeCell(getValue()),
    },
    {
      accessorKey: 'action',
      header: 'Action',
      cell: ({ row }) => {
        const category = row.original
        return (
          <DataTableActions
            items={[
              {
                label: 'Edit',
                icon: <Edit className="size-4" />,
                onClick: () => onEdit(category),
              },
              {
                label: 'Delete',
                icon: <Trash2 className="size-4 text-destructive" />,
                onClick: () => onDelete(category),
                destructive: true,
                confirmText: `Delete ${category.name}?`,
              },
            ]}
          />
        )
      },
    },
  ]
}
