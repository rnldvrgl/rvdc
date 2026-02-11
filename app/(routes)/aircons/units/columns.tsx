"use client"

import { DataTableActions } from "@/components/custom/table/components/DataTableActions"
import { AirconUnits, GetColumnsProps } from "@/lib/constants/interface"
import { safeCell } from "@/lib/utils/helpers"
import { formatDate } from "@/lib/utils/helpers/date"
import { ColumnDef, Row } from "@tanstack/react-table"

export function getAirconUnitsColumns({
  onEdit,
  onDelete,
  onView,
  onInstall,
}: GetColumnsProps<AirconUnits>): ColumnDef<AirconUnits>[] {
  return [
    {
      accessorKey: "serial_number",
      header: "Indoor Serial Number",
      cell: ({ getValue }) => (
        <span className="font-mono font-medium">{safeCell(getValue())}</span>
      ),
    },
    {
      accessorKey: "outdoor_serial_number",
      header: "Outdoor Serial Number",
      cell: ({ getValue }) => {
        const value = getValue()
        return value ? (
          <span className="font-mono font-medium">{safeCell(value)}</span>
        ) : (
          <span className="text-muted-foreground text-xs">N/A</span>
        )
      },
    },
    {
      accessorKey: "model.brand.name",
      header: "Brand",
      cell: ({ row }: { row: Row<AirconUnits> }) =>
        safeCell(row.original.model?.brand?.name),
    },
    {
      accessorKey: "model.name",
      header: "Model",
      cell: ({ row }: { row: Row<AirconUnits> }) =>
        safeCell(row.original.model?.name),
    },
    {
      accessorKey: "model.aircon_type",
      header: "Type",
      cell: ({ row }: { row: Row<AirconUnits> }) =>
        safeCell(row.original.model?.aircon_type),
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }: { row: Row<AirconUnits> }) => {
        const unit = row.original
        if (unit.installation_service) {
          return (
            <span className="inline-flex items-center rounded-md bg-blue-50 px-2 py-1 text-xs font-medium text-blue-700 ring-1 ring-inset ring-blue-700/10">
              For Installation
            </span>
          )
        }
        if (unit.is_sold) {
          return (
            <span className="inline-flex items-center rounded-md bg-green-50 px-2 py-1 text-xs font-medium text-green-700 ring-1 ring-inset ring-green-600/20">
              Sold
            </span>
          )
        }
        if (unit.is_reserved) {
          return (
            <span className="inline-flex items-center rounded-md bg-yellow-50 px-2 py-1 text-xs font-medium text-yellow-800 ring-1 ring-inset ring-yellow-600/20">
              Reserved
            </span>
          )
        }
        return (
          <span className="inline-flex items-center rounded-md bg-gray-50 px-2 py-1 text-xs font-medium text-gray-600 ring-1 ring-inset ring-gray-500/10">
            Available
          </span>
        )
      },
    },
    {
      accessorKey: "created_at",
      header: "Added Date",
      cell: ({ getValue }) =>
        safeCell(
          getValue()
            ? formatDate(new Date(getValue() as string), "MMM dd, yyyy")
            : null,
        ),
    },
    {
      accessorKey: "action",
      header: "Action",
      cell: ({ row }) => {
        const unit = row.original

        const actions = [
          ...(onView ? [{ label: "View", onClick: () => onView(unit) }] : []),
          ...(onInstall && unit.is_sold
            ? [
                {
                  label: "Schedule Installation",
                  onClick: () => onInstall(unit),
                },
              ]
            : []),
          ...(onEdit ? [{ label: "Edit", onClick: () => onEdit(unit) }] : []),
          ...(onDelete
            ? [
                {
                  label: "Delete",
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
