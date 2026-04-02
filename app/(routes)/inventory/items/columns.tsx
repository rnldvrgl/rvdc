import { DataTableActions } from "@/components/custom/table/components/DataTableActions"
import { GetColumnsProps, Item } from "@/lib/constants/interface"
import { Roles } from "@/lib/constants/types"
import { formatCurrency } from "@/lib/utils/helpers"
import { CellContext, ColumnDef } from "@tanstack/react-table"
import {
  Archive,
  Edit,
  Eye,
  EyeOff,
  RotateCcw,
  Trash2,
} from "lucide-react"

interface GetItemColumnsProps extends GetColumnsProps<Item> {
  role: Roles
  onToggleTracked?: (item: Item) => void
}

export function getItemColumns({
  onEdit,
  onDelete,
  onRestore,
  onHardDelete,
  onToggleTracked,
  role,
}: GetItemColumnsProps): ColumnDef<Item>[] {
  return [
    {
      accessorKey: "name",
      header: "Item",
      cell: ({ row }: CellContext<Item, unknown>) => {
        const item = row.original
        return (
          <div className="flex flex-col gap-0.5 min-w-0">
            <span className="font-medium text-foreground truncate">
              {item.name}
            </span>
            <span className="text-xs text-muted-foreground font-mono">
              {item.sku}
            </span>
          </div>
        )
      },
    },
    {
      accessorKey: "category.name",
      header: "Category",
      cell: ({ row }: CellContext<Item, unknown>) => {
        const name = row.original.category?.name
        if (!name) return <span className="text-muted-foreground">—</span>
        return (
          <span className="inline-flex items-center rounded-md bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground">
            {name}
          </span>
        )
      },
    },
    {
      accessorKey: "unit_of_measure",
      header: "Unit",
      cell: ({ getValue }) => (
        <span className="text-sm text-muted-foreground uppercase">
          {(getValue() as string) || "—"}
        </span>
      ),
    },
    {
      accessorKey: "is_tracked",
      header: "Tracking",
      cell: ({ row }: CellContext<Item, unknown>) => {
        const tracked = row.original.is_tracked
        return (
          <span
            className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${
              tracked
                ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400"
                : "bg-zinc-100 text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400"
            }`}
          >
            {tracked ? (
              <>
                <span className="size-1.5 rounded-full bg-emerald-500" />
                Tracked
              </>
            ) : (
              <>
                <span className="size-1.5 rounded-full bg-zinc-400" />
                Untracked
              </>
            )}
          </span>
        )
      },
    },
    {
      accessorKey: "retail_price",
      header: "Retail",
      cell: ({ getValue }) => (
        <span className="font-medium tabular-nums">
          {formatCurrency(getValue() as number | string)}
        </span>
      ),
    },
    {
      accessorKey: "cost_price",
      header: "Cost",
      cell: ({ getValue }) => (
        <span className="text-muted-foreground tabular-nums">
          {formatCurrency(getValue() as number | string)}
        </span>
      ),
    },
    ...(role === "admin"
      ? [
          {
            accessorKey: "action",
            header: "",
            cell: ({ row }: CellContext<Item, unknown>) => {
              const item = row.original

              if (onRestore) {
                return (
                  <DataTableActions
                    items={[
                      {
                        label: "Restore",
                        icon: RotateCcw,
                        onClick: () => onRestore(item),
                      },
                      ...(onHardDelete
                        ? [
                            {
                              label: "Delete Permanently",
                              icon: Trash2,
                              onClick: () => onHardDelete(item),
                              destructive: true,
                              confirmText: `Permanently delete ${item.name}? This cannot be undone.`,
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
                      label: "Edit",
                      icon: Edit,
                      onClick: () => onEdit(item),
                    },
                    ...(onToggleTracked
                      ? [
                          {
                            label: item.is_tracked
                              ? "Untrack Item"
                              : "Track Item",
                            icon: item.is_tracked ? EyeOff : Eye,
                            onClick: () => onToggleTracked(item),
                            confirmText: item.is_tracked
                              ? `Stop tracking stock for ${item.name}?`
                              : `Start tracking stock for ${item.name}?`,
                          },
                        ]
                      : []),
                    {
                      label: "Archive",
                      icon: Archive,
                      onClick: () => onDelete(item),
                      confirmText: `Archive ${item.name}?`,
                      destructive: true,
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
