'use client'

import { DataTableActions } from '@/components/custom/table/components/DataTableActions'
import { Badge } from '@/components/ui/badge'
import { AirconUnits, GetColumnsProps } from '@/lib/constants/interface'
import { safeCell } from '@/lib/utils/helpers'
import { formatDate } from '@/lib/utils/helpers/date'
import { ColumnDef, Row } from '@tanstack/react-table'

export function getAirconUnitsColumns({
  onEdit,
  onDelete,
  onView,
  onSold,
  onInstall,
  onReserve,
  onRedeemCleaning,
}: GetColumnsProps<AirconUnits>): ColumnDef<AirconUnits>[] {
  return [
    {
      accessorKey: 'serial_number',
      header: 'Serial Number',
      cell: ({ getValue }) => <span>{safeCell(getValue())}</span>,
    },
    {
      accessorKey: 'model.name',
      header: 'Model',
      cell: ({ row }: { row: Row<AirconUnits> }) =>
        safeCell(row.original.model?.name),
    },
    {
      accessorKey: 'sale',
      header: 'Sale',
      cell: ({ row }: { row: Row<AirconUnits> }) =>
        row.original.sale ? (
          <Badge variant="outline">Sold</Badge>
        ) : (
          <Badge variant="secondary">Available</Badge>
        ),
    },
    {
      accessorKey: 'installation',
      header: 'Installation',
      cell: ({ row }: { row: Row<AirconUnits> }) =>
        row.original.installation ? (
          <Badge variant="outline">Installed</Badge>
        ) : (
          <Badge variant="secondary">Not Installed</Badge>
        ),
    },
    {
      accessorKey: 'reserved_by',
      header: 'Reserved',
      cell: ({ row }: { row: Row<AirconUnits> }) =>
        row.original.reserved_by ? (
          <Badge variant="warning">
            Reserved by{' '}
            {safeCell(row.original.reserved_by?.full_name || 'Client')}
          </Badge>
        ) : (
          <Badge variant="success">Not Reserved</Badge>
        ),
    },
    {
      accessorKey: 'warranty_status',
      header: 'Warranty',
      cell: ({ row }: { row: Row<AirconUnits> }) => {
        const status = row.original.warranty_status
        const variant =
          status === 'Under Warranty'
            ? 'success'
            : status === 'Expired'
            ? 'destructive'
            : 'secondary'
        return <Badge variant={variant}>{status}</Badge>
      },
    },
    {
      accessorKey: 'warranty_end_date',
      header: 'Warranty End',
      cell: ({ row }: { row: Row<AirconUnits> }) =>
        safeCell(
          row.original.warranty_end_date
            ? formatDate(
                new Date(row.original.warranty_end_date as string),
                'MMM dd, yyyy',
              )
            : null,
        ),
    },
    {
      accessorKey: 'created_at',
      header: 'Created At',
      cell: ({ getValue }) =>
        safeCell(
          getValue()
            ? formatDate(new Date(getValue() as string), 'MMM dd, yyyy')
            : null,
        ),
    },
    {
      accessorKey: 'action',
      header: 'Action',
      cell: ({ row }) => {
        const unit = row.original

        const actions = [
          ...(onSold
            ? [
                {
                  label: 'Mark as Sold',
                  disabled: !!unit.sale,
                  onClick: () => onSold(unit),
                },
              ]
            : []),
          ...(onInstall
            ? [
                {
                  label: 'Mark as Installed',
                  disabled: !!unit.installation,
                  onClick: () => onInstall(unit),
                },
              ]
            : []),
          ...(onReserve
            ? [
                {
                  label: 'Reserve Unit',
                  disabled: !!unit.reserved_by,
                  onClick: () => onReserve(unit),
                },
              ]
            : []),
          ...(onRedeemCleaning
            ? [
                {
                  label: 'Redeem Free Cleaning',
                  disabled: !!unit.free_cleaning_redeemed,
                  onClick: () => onRedeemCleaning(unit),
                },
              ]
            : []),

          ...(onView ? [{ label: 'View', onClick: () => onView(unit) }] : []),
          ...(onEdit ? [{ label: 'Edit', onClick: () => onEdit(unit) }] : []),
          ...(onDelete
            ? [
                {
                  label: 'Delete',
                  onClick: () => onDelete(unit),
                  destructive: true,
                  confirmText: `Delete Aircon Unit with SN: ${unit.serial_number}?`,
                },
              ]
            : []),
        ]

        return <DataTableActions items={actions} />
      },
    },
  ]
}
