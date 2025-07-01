'use client'

import { Badge } from '@/components/ui/badge'
import { TClient } from '@/lib/constants/types'
import { ColumnDef } from '@tanstack/react-table'

export const columns: ColumnDef<TClient>[] = [
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
    accessorKey: 'is_deleted',
    header: 'Status',
    cell: ({ getValue }) => {
      const isDeleted = getValue() as boolean
      return (
        <Badge variant={isDeleted ? 'destructive' : 'success'}>
          {isDeleted ? 'Deleted' : 'Active'}
        </Badge>
      )
    },
  },
]
