"use client"

import { DataTableActions } from "@/components/custom/table/components/DataTableActions"
import { Badge } from "@/components/ui/badge"
import { AirconModels, GetColumnsProps } from "@/lib/constants/interface"
import {
  capitalize,
  formatCurrency,
  getBadgeVariant,
  safeCell,
} from "@/lib/utils/helpers"
import { ColumnDef } from "@tanstack/react-table"
import { Edit, Eye, Trash2 } from "lucide-react"

export function getAirconModelColumns({
  onEdit,
  onDelete,
  onView,
}: GetColumnsProps<AirconModels>): ColumnDef<AirconModels>[] {
  return [
    {
      accessorKey: "brand.name",
      header: "Brand",
    },
    {
      accessorKey: "name",
      header: "Model Name",
    },
    {
      accessorKey: "aircon_type",
      header: "Type",
      cell: ({ row }) => {
        const type = row.original.aircon_type?.replace(/_/g, " ") ?? ""

        return capitalize(type)
      },
    },
    {
      accessorKey: "is_inverter",
      header: "Category",
      cell: ({ row }) => {
        const category = row.original.is_inverter ? "Inverter" : "Non-Inverter"
        return <Badge variant={getBadgeVariant(category)}>{category}</Badge>
      },
    },
    {
      accessorKey: "retail_price",
      header: "Retail Price",
      cell: ({ row }) => formatCurrency(row.original.retail_price),
    },
    {
      accessorKey: "cost_price",
      header: "Cost Price",
      cell: ({ row }) => {
        const cost = row.original.cost_price
        return cost ? formatCurrency(cost) : safeCell("")
      },
    },
    {
      accessorKey: "promo_price",
      header: "Promo Price",
      cell: ({ row }) => {
        const promo = row.original.promo_price
        return promo ? formatCurrency(promo) : safeCell("")
      },
    },
    {
      accessorKey: "selling_price",
      header: "Selling Price",
      cell: ({ row }) => {
        const selling = row.original.selling_price
        return selling
          ? formatCurrency(selling)
          : formatCurrency(row.original.retail_price)
      },
    },
    {
      id: "actions",
      header: "Actions",
      cell: ({ row }) => {
        const model = row.original
        return (
          <DataTableActions
            items={[
              {
                label: "View",
                icon: Eye,
                onClick: () => onView?.(model),
              },
              {
                label: "Edit",
                icon: Edit,
                onClick: () => onEdit(model),
              },
              {
                label: "Delete",
                icon: Trash2,
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
