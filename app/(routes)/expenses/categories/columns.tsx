import { DataTableActions } from "@/components/custom/table/components/DataTableActions"
import { Badge } from "@/components/ui/badge"
import { ExpenseCategory } from "@/lib/constants/interface"
import { formatCurrency, safeCell } from "@/lib/utils/helpers"
import { formatDate } from "@/lib/utils/helpers/date"
import { ColumnDef, Row } from "@tanstack/react-table"
import { CheckCircle, Edit, Eye, Trash2, XCircle } from "lucide-react"

interface GetExpenseCategoryColumnsProps {
  onView?: (category: ExpenseCategory) => void
  onEdit: (category: ExpenseCategory) => void
  onDelete: (category: ExpenseCategory) => void
  onToggleActive?: (category: ExpenseCategory) => void
}

export function getExpenseCategoryColumns({
  onView,
  onEdit,
  onDelete,
  onToggleActive,
}: GetExpenseCategoryColumnsProps): ColumnDef<ExpenseCategory>[] {
  return [
    {
      accessorKey: "name",
      header: "Category Name",
      cell: ({ row }: { row: Row<ExpenseCategory> }) => {
        const category = row.original
        const isSubcategory = !!category.parent
        return (
          <div className="flex items-center gap-2">
            {isSubcategory && <span className="text-muted-foreground">└─</span>}
            <span className={isSubcategory ? "ml-4" : "font-medium"}>
              {safeCell(category.name)}
            </span>
          </div>
        )
      },
    },
    {
      accessorKey: "parent_data.name",
      header: "Parent Category",
      cell: ({ row }: { row: Row<ExpenseCategory> }) => {
        const parentName = row.original.parent_data?.name
        return parentName ? (
          <Badge variant="outline">{parentName}</Badge>
        ) : (
          <span className="text-muted-foreground text-sm">—</span>
        )
      },
    },
    {
      accessorKey: "description",
      header: "Description",
      cell: ({ getValue }) => {
        const description = getValue() as string
        return description ? (
          <p className="truncate max-w-xs text-sm text-muted-foreground">
            {description}
          </p>
        ) : (
          <span className="text-muted-foreground text-sm">—</span>
        )
      },
    },
    {
      accessorKey: "monthly_budget",
      header: "Monthly Budget",
      cell: ({ getValue }) => {
        const budget = getValue() as number
        return budget > 0 ? (
          <span className="font-medium">{formatCurrency(budget)}</span>
        ) : (
          <span className="text-muted-foreground text-sm">Not set</span>
        )
      },
    },
    {
      accessorKey: "is_active",
      header: "Status",
      cell: ({ getValue }) => {
        const isActive = getValue() as boolean
        return (
          <Badge variant={isActive ? "default" : "secondary"}>
            {isActive ? "Active" : "Inactive"}
          </Badge>
        )
      },
    },
    {
      accessorKey: "created_at",
      header: "Created",
      cell: ({ getValue }) =>
        safeCell(
          getValue()
            ? formatDate(new Date(getValue() as string), "MMM dd, yyyy")
            : null,
        ),
    },
    {
      accessorKey: "action",
      header: "Action",
      cell: ({ row }) => {
        const category = row.original
        const isActive = category.is_active

        return (
          <DataTableActions
            items={[
              ...(onView
                ? [
                    {
                      label: "View Details",
                      icon: Eye,
                      onClick: () => onView(category),
                    },
                  ]
                : []),
              {
                label: "Edit",
                icon: Edit,
                onClick: () => onEdit(category),
              },
              ...(onToggleActive
                ? [
                    {
                      label: isActive ? "Deactivate" : "Activate",
                      icon: isActive ? XCircle : CheckCircle,
                      onClick: () => onToggleActive(category),
                    },
                  ]
                : []),
              {
                label: "Delete",
                icon: Trash2,
                onClick: () => onDelete(category),
                destructive: true,
                confirmText: `Delete category "${category.name}"? This action cannot be undone.`,
              },
            ]}
          />
        )
      },
    },
  ]
}
