import { DataTableActions } from "@/components/custom/table/components/DataTableActions"
import { Badge } from "@/components/ui/badge"
import { Expense, GetColumnsProps } from "@/lib/constants/interface"
import {
  formatCurrency,
  getHashedStallBadgeClass,
  safeCell,
} from "@/lib/utils/helpers"
import { formatDate } from "@/lib/utils/helpers/date"
import { ColumnDef, Row } from "@tanstack/react-table"
import { Archive, Edit, Eye, RefreshCcw, RotateCcw, Trash2 } from "lucide-react"

export function getExpenseColumns({
  onView,
  onEdit,
  onDelete,
  onRestore,
  onHardDelete,
  onCustomAction,
  role,
}: GetColumnsProps<Expense>): ColumnDef<Expense>[] {
  return [
    ...(role === "admin"
      ? [
          {
            accessorKey: "stall_data.name",
            header: "Stall",
            cell: ({ row }: { row: Row<Expense> }) => {
              const stallName = safeCell(row.original.stall_data?.name)
              return (
                <Badge className={getHashedStallBadgeClass(stallName)}>
                  {stallName}
                </Badge>
              )
            },
          },
        ]
      : []),
    {
      accessorKey: "category_data.name",
      header: "Category",
      cell: ({ row }: { row: Row<Expense> }) => {
        const categoryName = row.original.category_data?.name
        return categoryName ? (
          <Badge
            variant="outline"
            className="font-normal"
          >
            {categoryName}
          </Badge>
        ) : (
          <span className="text-muted-foreground text-sm">—</span>
        )
      },
    },
    {
      accessorKey: "expense_date",
      header: "Expense Date",
      cell: ({ getValue }) => {
        const date = getValue() as string
        return date ? (
          safeCell(formatDate(new Date(date), "MMM dd, yyyy"))
        ) : (
          <span className="text-muted-foreground text-sm">—</span>
        )
      },
    },
    {
      accessorKey: "description",
      header: "Description",
      cell: ({ row }: { row: Row<Expense> }) => (
        <div className="flex items-center gap-2">
          <p className="truncate max-w-96">
            {safeCell(row.original.description)}
          </p>
          {row.original.is_reimbursement && (
            <Badge
              variant="outline"
              className="border-green-500 text-green-600 shrink-0"
            >
              Reimbursement
            </Badge>
          )}
        </div>
      ),
    },
    {
      accessorKey: "vendor",
      header: "Vendor",
      cell: ({ getValue }) => {
        const vendor = getValue() as string
        return vendor ? (
          <span className="text-sm">{vendor}</span>
        ) : (
          <span className="text-muted-foreground text-sm">—</span>
        )
      },
    },
    {
      accessorKey: "reference_number",
      header: "Reference #",
      cell: ({ getValue }) => {
        const ref = getValue() as string
        return ref ? (
          <span className="text-sm font-mono">{ref}</span>
        ) : (
          <span className="text-muted-foreground text-sm">—</span>
        )
      },
    },
    {
      accessorKey: "paid_amount",
      header: "Paid Amount",
      cell: ({ getValue }) => formatCurrency(getValue() as number),
    },
    {
      accessorKey: "total_price",
      header: "Total Price",
      cell: ({ getValue }) => formatCurrency(getValue() as number),
    },
    {
      accessorKey: "payment_status",
      header: "Payment Status",
      cell: ({ getValue }) => {
        const status = getValue() as string
        const variants: Record<
          string,
          "default" | "secondary" | "destructive"
        > = {
          paid: "default",
          partial: "secondary",
          unpaid: "destructive",
        }
        const labels: Record<string, string> = {
          paid: "Paid",
          partial: "Partial",
          unpaid: "Unpaid",
        }
        return (
          <Badge variant={variants[status] || "secondary"}>
            {labels[status] || status}
          </Badge>
        )
      },
    },
    {
      accessorKey: "reimbursement_status",
      header: "Reimbursement",
      cell: ({ row }: { row: Row<Expense> }) => {
        const expense = row.original
        if (!expense.is_reimbursable) {
          return <span className="text-muted-foreground text-sm">—</span>
        }
        const variants: Record<
          string,
          "default" | "secondary" | "destructive" | "outline"
        > = {
          pending: "destructive",
          partial: "secondary",
          reimbursed: "default",
        }
        const labels: Record<string, string> = {
          pending: "Pending",
          partial: "Partial",
          reimbursed: "Reimbursed",
        }
        return (
          <Badge variant={variants[expense.reimbursement_status] || "outline"}>
            {labels[expense.reimbursement_status] ||
              expense.reimbursement_status}
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
        const expense = row.original

        if (onRestore) {
          return (
            <DataTableActions
              items={[
                {
                  label: "Restore",
                  icon: RotateCcw,
                  onClick: () => onRestore(expense),
                },
                ...(onHardDelete
                  ? [
                      {
                        label: "Delete Permanently",
                        icon: Trash2,
                        onClick: () => onHardDelete(expense),
                        destructive: true,
                        confirmText: `Permanently delete this expense? This cannot be undone.`,
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
                label: "View Details",
                icon: Eye,
                onClick: () => onView?.(expense),
              },
              ...(expense.is_reimbursable &&
              expense.reimbursement_status !== "reimbursed"
                ? [
                    {
                      label: "Record Reimbursement",
                      icon: RefreshCcw,
                      onClick: () => onCustomAction?.(expense),
                    },
                  ]
                : []),
              ...(row.original.source === "manual" || !row.original.source
                ? [
                    {
                      label: "Edit",
                      icon: Edit,
                      onClick: () => onEdit(expense),
                    },
                    {
                      label: "Archive",
                      icon: Archive,
                      onClick: () => onDelete(expense),
                      confirmText: `Archive expense for ${expense.stall_data?.name}?`,
                    },
                  ]
                : []),
            ]}
          />
        )
      },
    },
  ]
}
