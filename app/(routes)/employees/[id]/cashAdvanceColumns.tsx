"use client"

import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { CashAdvance } from "@/lib/constants/interface"
import { formatDate } from "@/lib/utils/helpers/date"
import { ColumnDef } from "@tanstack/react-table"
import { MoreHorizontal, Trash2 } from "lucide-react"

interface GetCashAdvanceColumnsProps {
  onDelete: (cashAdvance: CashAdvance) => void
  canManage: boolean
}

export const getCashAdvanceColumns = ({
  onDelete,
  canManage,
}: GetCashAdvanceColumnsProps): ColumnDef<CashAdvance>[] => {
  const columns: ColumnDef<CashAdvance>[] = [
    {
      accessorKey: "date",
      header: "Date",
      cell: ({ row }) => {
        const date = row.getValue("date") as string
        return (
          <span className="font-medium">
            {formatDate(new Date(date), "MMM dd, yyyy")}
          </span>
        )
      },
    },
    {
      accessorKey: "amount",
      header: "Amount",
      cell: ({ row }) => {
        const amount = Number(row.getValue("amount"))
        return (
          <span className="font-semibold text-red-600">
            -₱{amount.toLocaleString()}
          </span>
        )
      },
    },
    {
      accessorKey: "remaining_balance",
      header: "Balance After",
      cell: ({ row }) => {
        const balance = Number(row.original.remaining_balance)
        return (
          <span className="font-medium text-green-600">
            ₱{balance.toLocaleString()}
          </span>
        )
      },
    },
    {
      accessorKey: "reason",
      header: "Reason",
      cell: ({ row }) => {
        const reason = row.getValue("reason") as string
        return (
          <span className="text-sm text-muted-foreground">{reason || "—"}</span>
        )
      },
    },
    {
      accessorKey: "created_by_name",
      header: "Approved By",
      cell: ({ row }) => {
        const name = row.getValue("created_by_name") as string
        return <span className="text-sm">{name || "—"}</span>
      },
    },
    {
      accessorKey: "created_at",
      header: "Recorded At",
      cell: ({ row }) => {
        const date = row.getValue("created_at") as string
        return (
          <span className="text-xs text-muted-foreground">
            {formatDate(new Date(date), "MMM dd, yyyy h:mm a")}
          </span>
        )
      },
    },
  ]

  // Only add actions column if user can manage
  if (canManage) {
    columns.push({
      id: "actions",
      cell: ({ row }) => {
        const cashAdvance = row.original

        return (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                className="h-8 w-8 p-0"
              >
                <span className="sr-only">Open menu</span>
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>Actions</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={() => onDelete(cashAdvance)}
                className="text-destructive focus:text-destructive"
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Delete & Restore Balance
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )
      },
    })
  }

  return columns
}
