"use client"

import { DataTableActions } from "@/components/custom/table/components/DataTableActions"
import { Badge } from "@/components/ui/badge"
import { AirconModels, GetColumnsProps } from "@/lib/constants/interface"
import {
  capitalize,
  formatCurrency,
  getBadgeVariant,
  getBoolBadgeVariant,
  safeCell,
} from "@/lib/utils/helpers"
import { ColumnDef } from "@tanstack/react-table"
import { Edit, Trash2 } from "lucide-react"

export function getAirconModelColumns({
  onEdit,
  onDelete,
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
      accessorKey: "discount_percentage",
      header: "Discount %",
      cell: ({ row }) => {
        const discount = row.original.discount_percentage
        return safeCell(discount ? `${Number(discount).toFixed(0)}%` : "")
      },
    },
    {
      accessorKey: "promo_price",
      header: "Promo Price",
      cell: ({ row }) => {
        const retail = parseFloat(row.original.retail_price)
        const discount = parseFloat(row.original.discount_percentage ?? "0")
        if (!discount) return formatCurrency(retail)
        const promo = retail - (retail * discount) / 100
        return formatCurrency(promo)
      },
    },
    {
      accessorKey: "parts_warranty_months",
      header: "Parts Warranty",
      cell: ({ row }) => {
        const months = row.original.parts_warranty_months ?? 60
        const years = (months / 12).toFixed(1)
        return (
          <span className="text-sm">
            {years} yr{Number(years) !== 1 ? "s" : ""}
          </span>
        )
      },
    },
    {
      accessorKey: "labor_warranty_months",
      header: "Labor Warranty",
      cell: ({ row }) => {
        const months = row.original.labor_warranty_months ?? 12
        const years = (months / 12).toFixed(1)
        return (
          <span className="text-sm">
            {years} yr{Number(years) !== 1 ? "s" : ""}
          </span>
        )
      },
    },
    {
      accessorKey: "has_discount",
      header: "Has Discount",
      cell: ({ row }) => (
        <Badge
          variant={getBoolBadgeVariant({
            status: row.original.has_discount ?? false,
          })}
        >
          {row.original.has_discount ? "Yes" : "No"}
        </Badge>
      ),
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
