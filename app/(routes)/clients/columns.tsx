'use client'

import { DataTableActions } from '@/components/custom/table/components/DataTableActions'
import { Badge } from '@/components/ui/badge'
import { GetColumnsProps } from '@/lib/constants/interface'
import { Client } from '@/lib/constants/types'
import { ColumnDef } from '@tanstack/react-table'
import { Ban, Edit, ShieldCheck, Trash2 } from 'lucide-react' // better icons

export function getClientColumns({
  onEdit,
  onDelete,
  onCustomAction,
}: GetColumnsProps<Client>): ColumnDef<Client>[] {
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
      accessorKey: 'is_blocklisted',
      header: 'Blocklisted',
      cell: ({ row }) => {
        const is_blocklisted = row.original.is_blocklisted
        return (
          <Badge
            variant={is_blocklisted ? 'destructive' : 'success'}
            className="flex items-center gap-1"
          >
            {is_blocklisted ? (
              <>
                <Ban className="size-3" /> blocklisted
              </>
            ) : (
              <>
                <ShieldCheck className="size-3" /> Clear
              </>
            )}
          </Badge>
        )
      },
    },
    {
      accessorKey: 'action',
      header: 'Action',
      cell: ({ row }) => {
        const client = row.original
        const is_blocklisted = client.is_blocklisted
        return (
          <DataTableActions
            items={[
              {
                label: is_blocklisted
                  ? 'Remove from blocklist'
                  : 'Add to blocklist',
                icon: is_blocklisted ? (
                  <ShieldCheck className="size-4 text-emerald-300" />
                ) : (
                  <Ban className="size-4 text-destructive" />
                ),
                onClick: () => onCustomAction?.(client),
              },
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
