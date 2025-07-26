'use client'

import { DataTableActions } from '@/components/custom/table/components/DataTableActions'
import { GetColumnsProps, Stall } from '@/lib/constants/interface'
import { safeCell } from '@/lib/utils/helpers'
import { formatDate } from '@/lib/utils/helpers/date'
import { ColumnDef } from '@tanstack/react-table'
import { Edit, Trash2 } from 'lucide-react'

export function getStallColumns({
  onEdit,
  onDelete,
}: GetColumnsProps<Stall>): ColumnDef<Stall>[] {
  return [
    {
      accessorKey: 'name',
      header: 'Name',
      cell: ({ getValue }) => safeCell(getValue()),
    },
    {
      accessorKey: 'location',
      header: 'Location',
      cell: ({ getValue }) => safeCell(getValue()),
    },
    {
      accessorKey: 'created_at',
      header: 'Created At',
      cell: ({ getValue }) => formatDate(getValue() as Date),
    },
    {
      accessorKey: 'action',
      header: 'Action',
      cell: ({ row }) => {
        const stall = row.original
        return (
          <DataTableActions
            items={[
              {
                label: 'Edit',
                icon: <Edit className="size-4" />,
                onClick: () => onEdit(stall),
              },
              {
                label: 'Delete',
                icon: <Trash2 className="size-4 text-destructive" />,
                onClick: () => onDelete(stall),
                destructive: true,
                confirmText: `Delete ${stall.name}?`,
              },
            ]}
          />
        )
      },
    },
  ]
}
