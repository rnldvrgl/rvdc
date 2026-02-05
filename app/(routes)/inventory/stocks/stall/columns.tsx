import { DataTableActions } from "@/components/custom/table/components/DataTableActions"
import { Badge } from "@/components/ui/badge"
import { GetColumnsProps, Stock } from "@/lib/constants/interface"
import {
  getBadgeVariant,
  getHashedStallBadgeClass,
  safeCell,
} from "@/lib/utils/helpers"
import { ColumnDef } from "@tanstack/react-table"
import { Edit, PackagePlus, Plus } from "lucide-react"

export function getStallStockColumns({
  onEdit,
  onRestock,
  onAddStock,
  role,
}: GetColumnsProps<Stock>): ColumnDef<Stock>[] {
  const columnMap: Record<string, ColumnDef<Stock>> = {
    item_name: {
      accessorKey: "item_name",
      header: "Item",
      cell: ({ row }) => {
        const { item } = row.original
        return safeCell(item.display_name || item.name)
      },
    },
    item_sku: {
      accessorKey: "item_sku",
      header: "SKU",
      cell: ({ row }) => safeCell(row.original.item.sku),
    },
    category_name: {
      accessorKey: "category_name",
      header: "Category",
      cell: ({ row }) => safeCell(row.original.item.category?.name),
    },
    quantity: {
      accessorKey: "quantity",
      header: "Quantity",
      cell: ({ row }) => {
        const { quantity, item } = row.original
        return safeCell(`${quantity} ${item.unit_of_measure}`)
      },
    },
    low_stock_threshold: {
      accessorKey: "low_stock_threshold",
      header: "Low Threshold",
      cell: ({ row }) => {
        const { low_stock_threshold, item } = row.original
        return safeCell(`${low_stock_threshold} ${item.unit_of_measure}`)
      },
    },
    stall_name: {
      accessorKey: "stall_name",
      header: "Stall",
      cell: ({ row }) => {
        const stallName = safeCell(row.original.stall?.name)
        return (
          <Badge className={getHashedStallBadgeClass(stallName)}>
            {stallName}
          </Badge>
        )
      },
    },
    status: {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }) => {
        const { status } = row.original
        return (
          <Badge variant={getBadgeVariant(status)}>
            {status.replace("_", " ")}
          </Badge>
        )
      },
    },
    action: {
      accessorKey: "action",
      header: "Action",
      cell: ({ row }) => {
        const stock = row.original
        return (
          <DataTableActions
            items={[
              {
                label: "Add Stock",
                icon: Plus,
                onClick: () => onAddStock?.(stock),
              },
              ...(role === "admin"
                ? [
                    {
                      label: "Restock",
                      icon: PackagePlus,
                      onClick: () => onRestock?.(stock),
                    },
                  ]
                : []),
              {
                label: "Edit",
                icon: Edit,
                onClick: () => onEdit(stock),
              },
            ]}
          />
        )
      },
    },
  }

  const roleColumns: Record<string, Array<keyof typeof columnMap>> = {
    admin: [
      "item_name",
      "item_sku",
      "category_name",
      "quantity",
      "low_stock_threshold",
      "stall_name",
      "status",
      "action",
    ],
    manager: [
      "item_name",
      "item_sku",
      "category_name",
      "quantity",
      "low_stock_threshold",
      "status",
      "action",
    ],
    clerk: [
      "item_name",
      "item_sku",
      "category_name",
      "quantity",
      "low_stock_threshold",
      "status",
      "action",
    ],
  }

  return (roleColumns[role ?? ""] ?? []).map((key) => columnMap[key])
}
