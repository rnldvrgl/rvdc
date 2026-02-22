"use client"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { CashAdvanceMovement } from "@/lib/constants/interface"
import { formatDate } from "@/lib/utils/helpers/date"
import { ColumnDef } from "@tanstack/react-table"
import {
  ArrowDownCircle,
  ArrowUpCircle,
  MoreHorizontal,
  Trash2,
} from "lucide-react"

interface GetCashAdvanceColumnsProps {
  onDelete: (movement: CashAdvanceMovement) => void
  canManage: boolean
}

export const getCashAdvanceColumns = ({
  onDelete,
  canManage,
}: GetCashAdvanceColumnsProps): ColumnDef<CashAdvanceMovement>[] => {
  const columns: ColumnDef<CashAdvanceMovement>[] = [
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
      accessorKey: "movement_type",
      header: "Type",
      cell: ({ row }) => {
        const type = row.getValue("movement_type") as string
        const isCredit = type === "credit"
        return (
          <Badge
            variant={isCredit ? "default" : "destructive"}
            className="gap-1"
          >
            {isCredit ? (
              <ArrowUpCircle className="h-3 w-3" />
            ) : (
              <ArrowDownCircle className="h-3 w-3" />
            )}
            {isCredit ? "Credit" : "Debit"}
          </Badge>
        )
      },
    },
    {
      accessorKey: "amount",
      header: "Amount",
      cell: ({ row }) => {
        const amount = Number(row.getValue("amount"))
        const type = row.original.movement_type
        const isCredit = type === "credit"
        return (
          <span
            className={`font-semibold ${isCredit ? "text-green-600" : "text-red-600"}`}
          >
            {isCredit ? "+" : "-"}₱{amount.toLocaleString()}
          </span>
        )
      },
    },
    {
      accessorKey: "balance_after",
      header: "Balance After",
      cell: ({ row }) => {
        const isPending = row.original.is_pending
        if (isPending) {
          return (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-yellow-100 text-yellow-800 cursor-help">
                    Pending
                  </span>
                </TooltipTrigger>
                <TooltipContent>
                  <p className="text-xs">
                    This movement will be applied when the payroll is approved
                  </p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )
        }
        const balance = Number(row.original.balance_after)
        return <span className="font-medium">₱{balance.toLocaleString()}</span>
      },
    },
    {
      accessorKey: "description",
      header: "Description",
      cell: ({ row }) => {
        const description = row.getValue("description") as string
        return (
          <span className="text-sm text-muted-foreground max-w-[200px] truncate block">
            {description || "—"}
          </span>
        )
      },
    },
    {
      accessorKey: "reference",
      header: "Reference",
      cell: ({ row }) => {
        const reference = row.original.reference
        return (
          <span className="text-xs text-muted-foreground">
            {reference || "—"}
          </span>
        )
      },
    },
    {
      accessorKey: "created_by_name",
      header: "Recorded By",
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
        const movement = row.original

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
                onClick={() => onDelete(movement)}
                className="text-destructive focus:text-destructive"
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Delete & Reverse Balance
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )
      },
    })
  }

  return columns
}
