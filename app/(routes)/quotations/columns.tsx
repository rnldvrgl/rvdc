import { DataTableActions } from "@/components/custom/table/components/DataTableActions"
import { Badge } from "@/components/ui/badge"
import type { GetColumnsProps } from "@/lib/constants/interface"
import type { Quotation } from "@/lib/constants/types"
import { formatCurrency } from "@/lib/utils/currency"
import { safeCell } from "@/lib/utils/helpers"
import { formatDate } from "@/lib/utils/helpers/date"
import { ColumnDef } from "@tanstack/react-table"
import { differenceInDays } from "date-fns"
import { Archive, Clock, Edit, Eye, RotateCcw, Trash2 } from "lucide-react"

const statusVariant: Record<
  string,
  "default" | "secondary" | "destructive" | "success"
> = {
  draft: "secondary",
  sent: "default",
  accepted: "success",
  declined: "destructive",
}

const statusLabel: Record<string, string> = {
  draft: "Draft",
  sent: "Sent",
  accepted: "Accepted",
  declined: "Declined",
}

export function getQuotationColumns({
  onView,
  onEdit,
  onDelete,
  onRestore,
  onHardDelete,
}: GetColumnsProps<Quotation>): ColumnDef<Quotation>[] {
  return [
    {
      accessorKey: "client_name",
      header: "Client",
      cell: ({ getValue }) => (
        <span className="font-medium">{safeCell(getValue())}</span>
      ),
    },
    {
      accessorKey: "project_description",
      header: "Project",
      cell: ({ getValue }) => (
        <p className="truncate max-w-64 text-muted-foreground text-sm">
          {safeCell(getValue()) || "—"}
        </p>
      ),
    },
    {
      accessorKey: "quote_date",
      header: "Date",
      cell: ({ getValue }) => {
        const date = getValue() as string
        return date ? safeCell(formatDate(new Date(date), "MMM dd, yyyy")) : "—"
      },
    },
    {
      accessorKey: "total",
      header: "Total",
      cell: ({ getValue }) => (
        <span className="font-medium tabular-nums">
          {formatCurrency(getValue() as number)}
        </span>
      ),
    },
    {
      accessorKey: "item_count",
      header: "Items",
      cell: ({ getValue }) => (
        <span className="text-muted-foreground">{getValue() as number}</span>
      ),
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ getValue }) => {
        const s = getValue() as string
        return (
          <Badge variant={statusVariant[s] || "secondary"}>
            {statusLabel[s] || s}
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
        const q = row.original

        if (onRestore) {
          // Calculate days remaining before auto-deletion
          const daysLeft = q.deleted_at
            ? Math.max(
                0,
                14 - differenceInDays(new Date(), new Date(q.deleted_at)),
              )
            : null

          return (
            <div className="flex items-center gap-2">
              {daysLeft !== null && (
                <span
                  className={`inline-flex items-center gap-1 text-xs font-medium tabular-nums ${
                    daysLeft <= 3
                      ? "text-red-600"
                      : daysLeft <= 7
                        ? "text-amber-600"
                        : "text-muted-foreground"
                  }`}
                >
                  <Clock className="h-3 w-3" />
                  {daysLeft}d
                </span>
              )}
              <DataTableActions
                items={[
                  {
                    label: "Restore",
                    icon: RotateCcw,
                    onClick: () => onRestore(q),
                  },
                  ...(onHardDelete
                    ? [
                        {
                          label: "Delete Permanently",
                          icon: Trash2,
                          onClick: () => onHardDelete(q),
                          destructive: true,
                          confirmText:
                            "Permanently delete this quotation? This cannot be undone.",
                        },
                      ]
                    : []),
                ]}
              />
            </div>
          )
        }

        return (
          <DataTableActions
            items={[
              {
                label: "View / Print",
                icon: Eye,
                onClick: () => onView?.(q),
              },
              {
                label: "Edit",
                icon: Edit,
                onClick: () => onEdit(q),
              },
              {
                label: "Archive",
                icon: Archive,
                onClick: () => onDelete(q),
                confirmText: `Archive quotation for ${q.client_name || "this client"}? Archived quotations are automatically deleted after 14 days.`,
              },
            ]}
          />
        )
      },
    },
  ]
}
