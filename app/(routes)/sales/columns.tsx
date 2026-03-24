import { DataTableActions } from "@/components/custom/table/components/DataTableActions"
import { Badge } from "@/components/ui/badge"
import { GetColumnsProps, SalesTransaction } from "@/lib/constants/interface"
import {
  formatCurrency,
  getBadgeVariant,
  getHashedStallBadgeClass,
  safeCell,
} from "@/lib/utils/helpers"
import { formatDate } from "@/lib/utils/helpers/date"
import { ColumnDef, Row } from "@tanstack/react-table"
import {
  Archive,
  Edit,
  Eye,
  Printer,
  RotateCcw,
  Trash2,
  Undo2,
} from "lucide-react"

type SalesColumnsMode = "active" | "voided" | "archived"

export function getSalesTransactionColumns({
  role,
  onView,
  onEdit,
  onPrint,
  onDelete,
  onRestore,
  onHardDelete,
  onUnvoid,
  mode = "active",
}: GetColumnsProps<SalesTransaction> & {
  onUnvoid?: (item: SalesTransaction) => void
  mode?: SalesColumnsMode
}): ColumnDef<SalesTransaction>[] {
  const columns: ColumnDef<SalesTransaction>[] = [
    ...(role === "admin"
      ? [
          {
            accessorKey: "stall.name",
            header: "Stall",
            cell: ({ row }: { row: Row<SalesTransaction> }) => {
              const stallName = safeCell(row.original.stall?.name)
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
      accessorKey: "client.full_name",
      header: "Client",
      cell: ({ row }) =>
        safeCell(
          `${row.original.client?.full_name ?? ""}${row.original.client?.contact_number ? ` (${row.original.client.contact_number})` : ""}`,
        ),
    },
    {
      accessorKey: "transaction_type",
      header: "Type",
      cell: ({ getValue }) => {
        const type = getValue() as string
        return (
          <Badge
            variant="secondary"
            className="text-[10px]"
          >
            {type === "replacement"
              ? "Replacement"
              : type === "service"
                ? "Service"
                : "Sale"}
          </Badge>
        )
      },
    },
    {
      accessorKey: "created_at",
      header: "Date",
      cell: ({ getValue }) =>
        safeCell(
          getValue()
            ? formatDate(
                new Date(getValue() as string),
                "EEE, MMM dd yyyy • hh:mm a",
              )
            : null,
        ),
    },
    {
      accessorKey: "computed_total",
      header: "Total Amount",
      cell: ({ row }) => {
        if (row.original.transaction_type === "replacement") {
          return <span className="text-muted-foreground italic">Free</span>
        }
        const val = row.original.computed_total
        return safeCell(val ? formatCurrency(Number(val)) : null)
      },
    },
    {
      accessorKey: "total_paid",
      header: "Total Payment",
      cell: ({ row }) => {
        if (row.original.transaction_type === "replacement") {
          return <span className="text-muted-foreground italic">—</span>
        }
        const val = row.original.total_paid
        return safeCell(val ? formatCurrency(Number(val)) : null)
      },
    },
    {
      accessorKey: "balance",
      header: "Balance",
      cell: ({ row }) => {
        if (row.original.transaction_type === "replacement") {
          return <span className="text-muted-foreground italic">—</span>
        }
        const total = Number(row.original.computed_total || 0)
        const paid = Number(row.original.total_paid || 0)
        const balance = total - paid
        return safeCell(
          balance > 0 ? formatCurrency(balance) : formatCurrency(0),
        )
      },
    },
    {
      accessorKey: "payment_status",
      header: "Status",
      cell: ({ getValue }) => (
        <Badge variant={getBadgeVariant(getValue() as string)}>
          {safeCell(getValue())}
        </Badge>
      ),
    },
    ...(mode === "voided"
      ? [
          {
            accessorKey: "void_reason" as const,
            header: "Void Reason",
            cell: ({ getValue }: { getValue: () => unknown }) =>
              safeCell(getValue() as string) || "—",
          },
        ]
      : []),
    {
      id: "action",
      header: "Action",
      cell: ({ row }) => {
        const isServiceTransaction = row.original.items?.some(
          (item) => item.item === null,
        )

        if (mode === "archived" && onRestore) {
          return (
            <DataTableActions
              items={[
                {
                  label: "Restore",
                  icon: RotateCcw,
                  onClick: () => onRestore(row.original),
                },
                ...(onHardDelete
                  ? [
                      {
                        label: "Delete Permanently",
                        icon: Trash2,
                        onClick: () => onHardDelete(row.original),
                        destructive: true,
                        confirmText: `Permanently delete this transaction? This cannot be undone.`,
                      },
                    ]
                  : []),
              ]}
            />
          )
        }

        if (mode === "voided") {
          return (
            <DataTableActions
              items={[
                {
                  label: "View",
                  icon: Eye,
                  onClick: () => onView?.(row.original),
                },
                ...(onUnvoid
                  ? [
                      {
                        label: "Unvoid",
                        icon: Undo2,
                        onClick: () => onUnvoid(row.original),
                        confirmText: `Restore this voided transaction? Stock will be deducted again.`,
                      },
                    ]
                  : []),
                ...(onHardDelete
                  ? [
                      {
                        label: "Delete Permanently",
                        icon: Trash2,
                        onClick: () => onHardDelete(row.original),
                        destructive: true,
                        confirmText: `Permanently delete this voided transaction? This cannot be undone.`,
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
                label: "View",
                icon: Eye,
                onClick: () => onView?.(row.original),
              },
              ...(!isServiceTransaction
                ? [
                    {
                      label: "Edit",
                      icon: Edit,
                      onClick: () => onEdit?.(row.original),
                    },
                  ]
                : []),
              {
                label: "Print Receipt",
                icon: Printer,
                onClick: () => onPrint?.(row.original),
              },
              {
                label: "Archive",
                icon: Archive,
                onClick: () => onDelete?.(row.original),
                confirmText: `Archive sale transaction from ${
                  row.original.client?.full_name || "this client"
                }?`,
              },
            ]}
          />
        )
      },
    },
  ]

  return columns
}
