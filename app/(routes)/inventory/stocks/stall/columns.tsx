import { DataTableActions } from "@/components/custom/table/components/DataTableActions"
import { Badge } from "@/components/ui/badge"
import { GetColumnsProps, Stock } from "@/lib/constants/interface"
import {
  getBadgeVariant,
  getHashedStallBadgeClass,
  safeCell,
} from "@/lib/utils/helpers"
import { ColumnDef } from "@tanstack/react-table"
import { Edit, PackageMinus, PackagePlus } from "lucide-react"

export function getStallStockColumns({
  onEdit,
  onRestock,
  onCustomAction,
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
    track_stock: {
      accessorKey: "track_stock",
      header: "Track Stock",
      cell: ({ row }) => {
        const { track_stock } = row.original
        return (
          <Badge variant={track_stock ? "success" : "destructive"}>
            {track_stock ? "Yes" : "No"}
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
                label: stock.track_stock ? "Untrack Stock" : "Track Stock",
                onClick: () => onCustomAction?.(stock),
                icon: stock.track_stock ? PackageMinus : PackagePlus,
              },
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
      "track_stock",
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
