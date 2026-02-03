import { DataTableActions } from "@/components/custom/table/components/DataTableActions"
import { GetColumnsProps, ProductCategory } from "@/lib/constants/interface"
import { safeCell } from "@/lib/utils/helpers"
import { ColumnDef } from "@tanstack/react-table"
import { Edit, Trash2 } from "lucide-react"

export function getCategoryColumns({
  onEdit,
  onDelete,
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
        return (
          <DataTableActions
            items={[
              {
                label: "Edit",
                icon: Edit,
                onClick: () => onEdit(category),
              },
              {
                label: "Delete",
                icon: Trash2,
                onClick: () => onDelete(category),
                destructive: true,
                confirmText: `Delete ${category.name}?`,
              },
            ]}
          />
        )
      },
    },
  ]
}
