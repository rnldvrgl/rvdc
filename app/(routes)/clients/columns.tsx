'use client'

import { DataTableActions } from '@/components/custom/table/components/DataTableActions'
import { Client } from '@/lib/constants/types'
import { ColumnDef } from '@tanstack/react-table'
import { Edit, Trash2 } from 'lucide-react'

interface GetClientColumnsProps {
  onEdit: (client: Client) => void
  onDelete: (client: Client) => void
}

export function getClientColumns({
  onEdit,
  onDelete,
}: GetClientColumnsProps): ColumnDef<Client>[] {
  return [
    {
      accessorKey: 'full_name',
      header: 'Name',
    },
    {
      accessorKey: 'contact_number',
      header: 'Contact Number',
    },
    {
      accessorKey: 'address',
      header: 'Address',
    },
    {
      accessorKey: 'barangay',
      header: 'Barangay',
    },
    {
      accessorKey: 'city',
      header: 'City',
    },
    {
      accessorKey: 'province',
      header: 'Province',
    },
    {
      accessorKey: 'action',
      header: 'Action',
      cell: ({ row }) => {
        const client = row.original
        return (
          <DataTableActions
            items={[
              {
                label: 'Edit',
                icon: <Edit className="size-4" />,
                onClick: () => onEdit(client),
              },
              {
                label: 'Delete',
                icon: <Trash2 className="size-4 text-destructive" />,
                onClick: () => onDelete(client),
                destructive: true,
                confirmText: `Delete ${client.full_name}?`,
              },
            ]}
          />
        )
      },
    },
  ]
}
