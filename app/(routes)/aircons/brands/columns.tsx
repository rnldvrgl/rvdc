"use client"

import { DataTableActions } from "@/components/custom/table/components/DataTableActions"
import { AirconBrands, GetColumnsProps } from "@/lib/constants/interface"
import { ColumnDef } from "@tanstack/react-table"
import { Edit, Trash2 } from "lucide-react"

export function getAirconBrandColumns({
  onEdit,
  onDelete,
}: GetColumnsProps<AirconBrands>): ColumnDef<AirconBrands>[] {
  return [
    {
      accessorKey: "name",
      header: "Brand Name",
    },
    {
      accessorKey: "action",
      header: "Action",
      cell: ({ row }) => {
        const brand = row.original
        return (
          <DataTableActions
            items={[
              {
                label: "Edit",
                icon: Edit,
                onClick: () => onEdit(brand),
              },
              {
                label: "Delete",
                icon: Trash2,
                onClick: () => onDelete(brand),
                destructive: true,
                confirmText: `Delete ${brand.name}?`,
              },
            ]}
          />
        )
      },
    },
  ]
}
