'use client'

import { DataTableActions } from '@/components/custom/table/components/DataTableActions'
import { Badge } from '@/components/ui/badge'
import { AirconModels, GetColumnsProps } from '@/lib/constants/interface'
import { formatCurrency, getBoolBadgeVariant } from '@/lib/utils/helpers'
import { ColumnDef } from '@tanstack/react-table'
import { Edit, Percent, Trash2 } from 'lucide-react'

export function getAirconModelColumns({
  onEdit,
  onDelete,
  onCustomAction,
}: GetColumnsProps<AirconModels>): ColumnDef<AirconModels>[] {
  return [
    {
      accessorKey: 'brand.name',
      header: 'Brand',
    },
    {
      accessorKey: 'name',
      header: 'Model Name',
    },
    {
      accessorKey: 'aircon_type',
      header: 'Type',
      cell: ({ row }) => row.original.aircon_type.replace('_', ' '),
    },
    {
      accessorKey: 'is_inverter',
      header: 'Inverter',
      cell: ({ row }) => (row.original.is_inverter ? 'Yes' : 'No'),
    },
    {
      accessorKey: 'retail_price',
      header: 'Retail Price',
      cell: ({ row }) => formatCurrency(row.original.retail_price),
    },
    {
      accessorKey: 'discount_percentage',
      header: 'Discount %',
      cell: ({ row }) => {
        const discount = row.original.discount_percentage
        return discount ? `${discount}%` : '—'
      },
    },
    {
      accessorKey: 'promo_price',
      header: 'Promo Price',
      cell: ({ row }) => {
        const retail = parseFloat(row.original.retail_price)
        const discount = parseFloat(row.original.discount_percentage ?? '0')
        if (!discount) return formatCurrency(retail)
        const promo = retail - (retail * discount) / 100
        return formatCurrency(promo)
      },
    },
    {
      accessorKey: 'has_discount',
      header: 'Has Discount',
      cell: ({ row }) => (
        <Badge
          variant={getBoolBadgeVariant({
            status: row.original.has_discount ?? false,
          })}
        >
          {row.original.has_discount ? 'Yes' : 'No'}
        </Badge>
      ),
    },
    {
      id: 'actions',
      header: 'Actions',
      cell: ({ row }) => {
        const model = row.original
        return (
          <DataTableActions
            items={[
              {
                label: 'Edit',
                icon: <Edit className="size-4" />,
                onClick: () => onEdit(model),
              },
              {
                label: model.discount_percentage
                  ? 'Update Promo Discount'
                  : 'Add Promo Discount',
                icon: <Percent className="size-4 text-card-foreground" />,
                onClick: () => onCustomAction?.(model),
              },
              {
                label: 'Delete',
                icon: <Trash2 className="size-4 text-destructive" />,
                onClick: () => onDelete(model),
                destructive: true,
                confirmText: `Delete ${model.name}?`,
              },
            ]}
          />
        )
      },
    },
  ]
}
