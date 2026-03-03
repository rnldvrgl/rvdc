import { DataTableActions } from "@/components/custom/table/components/DataTableActions"
import { Badge } from "@/components/ui/badge"
import { GetColumnsProps, Stock } from "@/lib/constants/interface"
import { getBadgeVariant, safeCell } from "@/lib/utils/helpers"
import { ColumnDef } from "@tanstack/react-table"
import { Edit, PackagePlus, Plus, RotateCcw, Trash2 } from "lucide-react"

export function getStallStockColumns({
  onEdit,
  onRestock,
  onAddStock,
  onRestore,
  onHardDelete,
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
      header: "Total Qty",
      cell: ({ row }) => {
        const { quantity, item } = row.original
        return safeCell(`${quantity} ${item.unit_of_measure}`)
      },
    },
    reserved_quantity: {
      accessorKey: "reserved_quantity",
      header: "Reserved",
      cell: ({ row }) => {
        const { reserved_quantity, item } = row.original
        return (
          <span className="text-yellow-500 font-medium">
            {reserved_quantity} {item.unit_of_measure}
          </span>
        )
      },
    },
    available_quantity: {
      accessorKey: "available_quantity",
      header: "Available",
      cell: ({ row }) => {
        const { available_quantity, item } = row.original
        const isLow = available_quantity === 0
        return (
          <span
            className={
              isLow
                ? "text-destructive font-semibold"
                : "text-success font-medium"
            }
          >
            {available_quantity} {item.unit_of_measure}
          </span>
        )
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
        if (onRestore && onHardDelete) {
          return (
            <DataTableActions
              items={[
                {
                  label: "Restore",
                  icon: RotateCcw,
                  onClick: () => onRestore(stock),
                },
                {
                  label: "Delete Permanently",
                  icon: Trash2,
                  onClick: () => onHardDelete(stock),
                  destructive: true,
                  confirmText: `Permanently delete this stock? This cannot be undone.`,
                },
              ]}
            />
          )
        }
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
      "reserved_quantity",
      "available_quantity",
      "low_stock_threshold",
      "status",
      "action",
    ],
    manager: [
      "item_name",
      "item_sku",
      "category_name",
      "quantity",
      "reserved_quantity",
      "available_quantity",
      "low_stock_threshold",
      "status",
      "action",
    ],
    clerk: [
      "item_name",
      "item_sku",
      "category_name",
      "quantity",
      "reserved_quantity",
      "available_quantity",
      "low_stock_threshold",
      "status",
      "action",
    ],
  }

  return (roleColumns[role ?? ""] ?? []).map((key) => columnMap[key])
}
