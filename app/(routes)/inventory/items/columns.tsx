import { DataTableActions } from "@/components/custom/table/components/DataTableActions"
import { GetColumnsProps, Item } from "@/lib/constants/interface"
import { Roles } from "@/lib/constants/types"
import { formatCurrency, safeCell } from "@/lib/utils/helpers"
import { CellContext, ColumnDef } from "@tanstack/react-table"
import { Archive, Edit, RotateCcw, Trash2 } from "lucide-react"

interface GetItemColumnsProps extends GetColumnsProps<Item> {
  role: Roles
}

export function getItemColumns({
  onEdit,
  onDelete,
  onRestore,
  onHardDelete,
  role,
}: GetItemColumnsProps): ColumnDef<Item>[] {
  return [
    {
      accessorKey: "name",
      header: "Name",
    },
    {
      accessorKey: "sku",
      header: "SKU",
      cell: ({ getValue }) => safeCell(getValue()),
    },
    {
      accessorKey: "category.name",
      header: "Category",
      cell: ({ row }: CellContext<Item, unknown>) =>
        safeCell(row.original.category?.name),
    },
    {
      accessorKey: "description",
      header: "Description",
      cell: ({ getValue }) => safeCell(getValue()),
    },
    {
      accessorKey: "unit_of_measure",
      header: "Unit",
      cell: ({ getValue }) => safeCell(getValue()),
    },
    {
      accessorKey: "retail_price",
      header: "Retail Price",
      cell: ({ getValue }) => formatCurrency(getValue() as number | string),
    },
    {
      accessorKey: "wholesale_price",
      header: "Wholesale Price",
      cell: ({ getValue }) => formatCurrency(getValue() as number | string),
    },
    {
      accessorKey: "technician_price",
      header: "Technician Price",
      cell: ({ getValue }) => formatCurrency(getValue() as number | string),
    },
    {
      accessorKey: "cost_price",
      header: "Cost Price",
      cell: ({ getValue }) => formatCurrency(getValue() as number | string),
    },
    {
      accessorKey: "waste_tolerance_percentage",
      header: "Waste Tolerance",
      cell: ({ row }) => {
        const val = parseFloat(row.original.waste_tolerance_percentage || "0")
        if (val <= 0) return <span className="text-muted-foreground">—</span>
        return (
          <span className="text-amber-600 dark:text-amber-400 font-medium">
            {val}%
          </span>
        )
      },
    },
    ...(role === "admin"
      ? [
          {
            accessorKey: "action",
            header: "Action",
            cell: ({ row }: CellContext<Item, unknown>) => {
              const item = row.original
              if (onRestore && onHardDelete) {
                return (
                  <DataTableActions
                    items={[
                      {
                        label: "Restore",
                        icon: RotateCcw,
                        onClick: () => onRestore(item),
                      },
                      {
                        label: "Delete Permanently",
                        icon: Trash2,
                        onClick: () => onHardDelete(item),
                        destructive: true,
                        confirmText: `Permanently delete ${item.name}? This cannot be undone.`,
                      },
                    ]}
                  />
                )
              }
              return (
                <DataTableActions
                  items={[
                    {
                      label: "Edit",
                      icon: Edit,
                      onClick: () => onEdit(item),
                    },
                    {
                      label: "Archive",
                      icon: Archive,
                      onClick: () => onDelete(item),
                      confirmText: `Archive ${item.name}?`,
                    },
                  ]}
                />
              )
            },
          },
        ]
      : []),
  ]
}
