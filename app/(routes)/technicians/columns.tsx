'use client'

import { DataTableActions } from '@/components/custom/table/components/DataTableActions'
import { Technician } from '@/lib/constants/types'
import { ColumnDef } from '@tanstack/react-table'
import { Edit, Eye, Trash2 } from 'lucide-react'
import { useRouter } from 'next/navigation'

interface GetTechnicianColumnsProps {
  onEdit: (technician: Technician) => void
  onDelete: (technician: Technician) => void
}

export function getTechnicianColumns({
  onEdit,
  onDelete,
}: GetTechnicianColumnsProps): ColumnDef<Technician>[] {
  const router = useRouter()
  return [
    {
      accessorKey: 'first_name',
      header: 'First Name',
    },
    {
      accessorKey: 'last_name',
      header: 'Last Name',
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
      accessorKey: 'basic_salary',
      header: 'Basic Salary',
      cell: ({ getValue }) => {
        const value = getValue<number>()
        return value ? `₱${value.toLocaleString()}` : '-'
      },
    },
    {
      accessorKey: 'action',
      header: 'Action',
      cell: ({ row }) => {
        const technician = row.original
        return (
          <DataTableActions
            items={[
              {
                label: 'View',
                icon: <Eye className="size-4" />,
                onClick: () => router.push(`/technicians/${technician.id}`),
              },
              {
                label: 'Edit',
                icon: <Edit className="size-4" />,
                onClick: () => onEdit(technician),
              },
              {
                label: 'Delete',
                icon: <Trash2 className="size-4 text-destructive" />,
                onClick: () => onDelete(technician),
                destructive: true,
                confirmText: `Delete ${technician.first_name} ${technician.last_name}?`,
              },
            ]}
          />
        )
      },
    },
  ]
}
