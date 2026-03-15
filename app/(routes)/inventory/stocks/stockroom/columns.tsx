import { DataTableActions } from "@/components/custom/table/components/DataTableActions"
import { Badge } from "@/components/ui/badge"
import { GetColumnsProps, StockRoomStock } from "@/lib/constants/interface"
import { getBadgeVariant, safeCell } from "@/lib/utils/helpers"
import { ColumnDef } from "@tanstack/react-table"
import {
  ClipboardCheck,
  Edit,
  PackagePlus,
  RotateCcw,
  Trash2,
} from "lucide-react"

export function getStockRoomStockColumns({
  onEdit,
  onRestock,
  onAudit,
  onRestore,
  onHardDelete,
}: GetColumnsProps<StockRoomStock>): ColumnDef<StockRoomStock>[] {
  return [
    {
      accessorKey: "item_name",
      header: "Item",
      cell: ({ row }) => {
        const { item } = row.original
        return safeCell(item.display_name ?? item.name)
      },
    },
    {
      accessorKey: "item_sku",
      header: "SKU",
      cell: ({ row }) => safeCell(row.original.item.sku),
    },
    {
      accessorKey: "category_name",
      header: "Category",
      cell: ({ row }) => safeCell(row.original.item.category?.name),
    },
    {
      accessorKey: "quantity",
      header: "Quantity",
      cell: ({ row }) => {
        const { quantity, item } = row.original
        return safeCell(`${quantity} ${item.unit_of_measure}`)
      },
    },
    {
      accessorKey: "low_stock_threshold",
      header: "Low Threshold",
      cell: ({ row }) => {
        const { low_stock_threshold, item } = row.original
        return safeCell(`${low_stock_threshold} ${item.unit_of_measure}`)
      },
    },
    {
      accessorKey: "waste_tolerance",
      header: "Tolerance",
      cell: ({ row }) => {
        const val = parseFloat(
          row.original.item.waste_tolerance_percentage || "0",
        )
        if (val <= 0) return <span className="text-muted-foreground">—</span>
        return (
          <span className="text-amber-600 dark:text-amber-400 font-medium">
            {val}%
          </span>
        )
      },
    },
    {
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
    {
      accessorKey: "action",
      header: "Action",
      cell: ({ row }) => {
        const stock = row.original
        if (onRestore) {
          return (
            <DataTableActions
              items={[
                {
                  label: "Restore",
                  icon: RotateCcw,
                  onClick: () => onRestore(stock),
                },
                ...(onHardDelete
                  ? [
                      {
                        label: "Delete Permanently",
                        icon: Trash2,
                        onClick: () => onHardDelete(stock),
                        destructive: true,
                        confirmText: `Permanently delete this stock entry? This cannot be undone.`,
                      },
                    ]
                  : []),
              ]}
            />
          )
        }
        return (
          <DataTableActions
            items={[
              {
                label: "Audit",
                icon: ClipboardCheck,
                onClick: () => onAudit?.(stock),
              },
              {
                label: "Restock",
                icon: PackagePlus,
                onClick: () => onRestock?.(stock),
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
  ]
}
