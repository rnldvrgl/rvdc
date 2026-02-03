import { DataTableActions } from "@/components/custom/table/components/DataTableActions"
import { Badge } from "@/components/ui/badge"
import { GetColumnsProps, SalesTransaction } from "@/lib/constants/interface"
import {
  formatCurrency,
  getBadgeVariant,
  getBoolBadgeVariant,
  getHashedStallBadgeClass,
  safeCell,
} from "@/lib/utils/helpers"
import { formatDate } from "@/lib/utils/helpers/date"
import { ColumnDef, Row } from "@tanstack/react-table"
import { Edit, Eye, Printer, Trash2 } from "lucide-react"

export function getSalesTransactionColumns({
  role,
  onView,
  onEdit,
  onPrint,
  onDelete,
}: GetColumnsProps<SalesTransaction>): ColumnDef<SalesTransaction>[] {
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
      accessorKey: "manual_receipt_number",
      header: "Receipt #",
      cell: ({ row }) => safeCell(row.original.manual_receipt_number),
    },
    {
      accessorKey: "client.full_name",
      header: "Client",
      cell: ({ row }) =>
        safeCell(
          `${row.original.client?.full_name ?? ""} (${
            row.original.client?.contact_number ?? ""
          })`,
        ),
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
      cell: ({ getValue }) =>
        safeCell(getValue() ? formatCurrency(Number(getValue())) : null),
    },
    {
      accessorKey: "total_paid",
      header: "Total Payment",
      cell: ({ getValue }) =>
        safeCell(getValue() ? formatCurrency(Number(getValue())) : null),
    },
    {
      accessorKey: "balance",
      header: "Balance",
      cell: ({ row }) => {
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
      header: "Paid",
      cell: ({ getValue }) => (
        <Badge variant={getBadgeVariant(getValue() as string)}>
          {safeCell(getValue())}
        </Badge>
      ),
    },
    {
      accessorKey: "voided",
      header: "Voided",
      cell: ({ getValue }) => {
        const voided = Boolean(getValue())
        return (
          <Badge
            variant={getBoolBadgeVariant({
              status: voided,
              reverse: true,
            })}
          >
            {voided ? "Yes" : "No"}
          </Badge>
        )
      },
    },
    {
      id: "action",
      header: "Action",
      cell: ({ row }) => {
        // Check if this is a service-related transaction (has items with null inventory item)
        const isServiceTransaction = row.original.items?.some(
          (item) => item.item === null,
        )

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
                label: "Delete",
                icon: Trash2,
                onClick: () => onDelete?.(row.original),
                destructive: true,
                confirmText: `Delete sale transaction from ${
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
