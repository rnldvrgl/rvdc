import { DataTableActions } from "@/components/custom/table/components/DataTableActions"
import { GetColumnsProps, ProductCategory } from "@/lib/constants/interface"
import { safeCell } from "@/lib/utils/helpers"
import { ColumnDef } from "@tanstack/react-table"
import { Archive, Edit, RotateCcw, Trash2 } from "lucide-react"

export function getCategoryColumns({
  onEdit,
  onDelete,
  onRestore,
  onHardDelete,
}: GetColumnsProps<ProductCategory>): ColumnDef<ProductCategory>[] {
  return [
    {
      accessorKey: "name",
      header: "Name",
    },
    {
      accessorKey: "description",
      header: "Description",
      cell: ({ getValue }) => safeCell(getValue()),
    },
    {
      accessorKey: "action",
      header: "Action",
      cell: ({ row }) => {
        const category = row.original
        if (onRestore && onHardDelete) {
          return (
            <DataTableActions
              items={[
                {
                  label: "Restore",
                  icon: RotateCcw,
                  onClick: () => onRestore(category),
                },
                {
                  label: "Delete Permanently",
                  icon: Trash2,
                  onClick: () => onHardDelete(category),
                  destructive: true,
                  confirmText: `Permanently delete ${category.name}? This cannot be undone.`,
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
                onClick: () => onEdit(category),
              },
              {
                label: "Archive",
                icon: Archive,
                onClick: () => onDelete(category),
                confirmText: `Archive ${category.name}?`,
              },
            ]}
          />
        )
      },
    },
  ]
}
