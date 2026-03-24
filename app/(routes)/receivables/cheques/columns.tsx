import { withTooltipHeader } from "@/components/custom/table/components/ColumnHeaderWithTooltip"
import { DataTableActions } from "@/components/custom/table/components/DataTableActions"
import { Badge } from "@/components/ui/badge"
import { ChequeCollection, GetColumnsProps } from "@/lib/constants/interface"
import {
  formatCurrency,
  getBadgeVariant,
  getHashedStallBadgeClass,
  safeCell,
} from "@/lib/utils/helpers"
import { formatDate } from "@/lib/utils/helpers/date"
import { ColumnDef } from "@tanstack/react-table"
import { Edit, Eye, Trash2 } from "lucide-react"
export function getChequeCollectionColumns({
  role,
  onView,
  onEdit,
  onDelete,
}: GetColumnsProps<ChequeCollection>): ColumnDef<ChequeCollection>[] {
  const columns: ColumnDef<ChequeCollection>[] = [
    {
      accessorKey: "date_collected",
      header: withTooltipHeader(
        "Date Collected",
        "Date when cheque was collected",
      ),
      cell: ({ getValue }) =>
        safeCell(
          getValue() ? formatDate(getValue() as Date, "MMM dd, yyyy") : null,
        ),
      enableSorting: true,
    },
    {
      accessorKey: "client_name",
      header: withTooltipHeader("Client", "Name of the client"),
      cell: ({ row }) => safeCell(row.original.client_name),
      enableSorting: true,
    },
    {
      accessorKey: "cheque_number",
      header: withTooltipHeader("Cheque #", "Cheque number"),
      cell: ({ getValue }) => safeCell(getValue()),
    },
    {
      accessorKey: "cheque_date",
      header: withTooltipHeader("Cheque Date", "Date written on the cheque"),
      cell: ({ getValue }) =>
        safeCell(
          getValue() ? formatDate(getValue() as Date, "MMM dd, yyyy") : null,
        ),
    },
    {
      accessorKey: "billing_amount",
      header: withTooltipHeader("Billing", "Billing Amount"),
      cell: ({ getValue }) => formatCurrency(getValue() as number),
    },
    {
      accessorKey: "cheque_amount",
      header: withTooltipHeader("Cheque", "Cheque Amount"),
      cell: ({ getValue }) => formatCurrency(getValue() as number),
    },
    {
      accessorKey: "bank_name",
      header: withTooltipHeader("Bank", "Issuing Bank"),
      cell: ({ row }) => {
        const bankName = safeCell(row.original.bank_name)
        return (
          <Badge className={getHashedStallBadgeClass(bankName)}>
            {bankName}
          </Badge>
        )
      },
    },
    {
      accessorKey: "status",
      header: withTooltipHeader("Status", "Current status"),
      cell: ({ getValue }) => {
        const value = getValue() as string
        return <Badge variant={getBadgeVariant(value)}>{value}</Badge>
      },
    },
    {
      id: "action",
      header: "Actions",
      cell: ({ row }) => {
        const isAdminOrManager = role === "admin" || role === "manager"
        const actions = [
          {
            label: "View",
            icon: Eye,
            onClick: () => onView?.(row.original),
          },
          ...(isAdminOrManager
            ? [
                {
                  label: "Edit",
                  icon: Edit,
                  onClick: () => onEdit?.(row.original),
                },
              ]
            : []),
          ...(role === "admin"
            ? [
                {
                  label: "Delete",
                  icon: Trash2,
                  onClick: () => onDelete?.(row.original),
                  destructive: true,
                  confirmText: `Delete cheque ${row.original.cheque_number}?`,
                },
              ]
            : []),
        ]
        return <DataTableActions items={actions} />
      },
    },
  ]
  return columns
}
