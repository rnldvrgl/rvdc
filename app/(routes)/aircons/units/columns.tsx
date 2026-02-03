"use client"

import { DataTableActions } from "@/components/custom/table/components/DataTableActions"
import { Badge } from "@/components/ui/badge"
import { AirconUnits, GetColumnsProps } from "@/lib/constants/interface"
import { safeCell } from "@/lib/utils/helpers"
import { formatDate } from "@/lib/utils/helpers/date"
import { ColumnDef, Row } from "@tanstack/react-table"

export function getAirconUnitsColumns({
  onEdit,
  onDelete,
  onView,
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
      accessorKey: "is_sold",
      header: "Status",
      cell: ({ row }: { row: Row<AirconUnits> }) =>
        row.original.is_sold ? (
          <Badge variant="secondary">Sold</Badge>
        ) : (
          <Badge variant="success">Available</Badge>
        ),
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
