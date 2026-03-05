"use client"

import { DataTableActions } from "@/components/custom/table/components/DataTableActions"
import { Badge } from "@/components/ui/badge"
import { AirconModels, GetColumnsProps } from "@/lib/constants/interface"
import {
  capitalize,
  formatCurrency,
  getBadgeVariant,
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
      cell: ({ row }) => (
        <span
          className={
            row.original.has_discount
              ? "text-muted-foreground line-through"
              : ""
          }
        >
          {formatCurrency(row.original.retail_price)}
        </span>
      ),
    },
    {
      accessorKey: "selling_price",
      header: "Selling Price",
      cell: ({ row }) => {
        const { selling_price, retail_price, has_discount, promo_price } =
          row.original
        const price = selling_price || retail_price
        return (
          <div className="flex items-center gap-1.5">
            <span className="font-medium">{formatCurrency(price)}</span>
            {has_discount && promo_price && (
              <Badge
                variant="success"
                className="text-[10px] px-1.5 py-0"
              >
                Promo
              </Badge>
            )}
          </div>
        )
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
