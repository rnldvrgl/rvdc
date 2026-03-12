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
import type { StockRequest } from "@/lib/constants/interface"
import { ColumnDef } from "@tanstack/react-table"
import { format } from "date-fns"
import { Check, MoreHorizontal, X } from "lucide-react"

interface GetStockRequestColumnsProps {
  onApprove?: (request: StockRequest) => void
  onDecline?: (request: StockRequest) => void
  isAdmin?: boolean
}

const statusVariantMap: Record<
  string,
  "default" | "secondary" | "destructive" | "outline"
> = {
  pending: "secondary",
  approved: "default",
  declined: "destructive",
  cancelled: "outline",
}

export function getStockRequestColumns({
  onApprove,
  onDecline,
  isAdmin,
}: GetStockRequestColumnsProps): ColumnDef<StockRequest>[] {
  return [
    {
      accessorKey: "item_name",
      header: "Item",
      cell: ({ row }) => (
        <div>
          <div className="font-medium">{row.original.item_name}</div>
          <div className="text-xs text-muted-foreground">
            {row.original.item_sku}
          </div>
        </div>
      ),
    },
    {
      accessorKey: "stall_name",
      header: "Stall",
    },
    {
      accessorKey: "requested_quantity",
      header: "Requested Qty",
      cell: ({ getValue }) => getValue(),
    },
    {
      accessorKey: "available_stock",
      header: "Available Stock",
      cell: ({ getValue }) => getValue(),
    },
    {
      accessorKey: "source",
      header: "Source",
      cell: ({ getValue }) => {
        const source = getValue() as string
        return source === "service_appliance" ? "Appliance" : "Service"
      },
    },
    {
      accessorKey: "service_id",
      header: "Service #",
      cell: ({ getValue }) => getValue() ?? "—",
    },
    {
      accessorKey: "requested_by_name",
      header: "Requested By",
      cell: ({ getValue }) => getValue() ?? "—",
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }) => {
        const status = row.original.status
        return (
          <Badge variant={statusVariantMap[status] ?? "outline"}>
            {status.charAt(0).toUpperCase() + status.slice(1)}
          </Badge>
        )
      },
    },
    {
      accessorKey: "created_at",
      header: "Date Requested",
      cell: ({ getValue }) =>
        format(new Date(getValue() as string), "MMM dd, yyyy hh:mm a"),
    },
    {
      id: "actions",
      header: "Actions",
      cell: ({ row }) => {
        const request = row.original
        if (request.status !== "pending" || !isAdmin) return null

        return (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                className="h-8 w-8 p-0"
              >
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>Actions</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={() => onApprove?.(request)}
                className="text-green-600"
              >
                <Check className="mr-2 h-4 w-4" />
                Approve
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => onDecline?.(request)}
                className="text-red-600"
              >
                <X className="mr-2 h-4 w-4" />
                Decline
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )
      },
    },
  ]
}
