"use client"

import { ColumnDef } from "@tanstack/react-table"
import { format } from "date-fns"
import { CheckCircle2, Clock, MoreHorizontal, X } from "lucide-react"

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
import type { OvertimeRequest } from "@/lib/queries/useOvertimeRequests"

const getBadgeStatus = (approved: boolean) => {
  if (approved) {
    return {
      icon: CheckCircle2,
      label: "Approved",
      variant: "success" as const,
      className: "",
    }
  }

  return {
    icon: Clock,
    label: "Pending",
    variant: "secondary" as const,
    className: "",
  }
}

export type OvertimeRequestsColumnsProps = {
  onEdit?: (id: number) => void
  onApprove?: (id: number) => void
  onReject?: (id: number) => void
  onCancel?: (id: number) => void
  isAdmin?: boolean
}

export const getOvertimeRequestsColumns = ({
  onEdit,
  onApprove,
  onReject,
  onCancel,
  isAdmin,
}: OvertimeRequestsColumnsProps): ColumnDef<OvertimeRequest>[] => [
  {
    accessorKey: "employee_detail.full_name",
    header: "Employee",
    cell: ({ row }) => (
      <div className="font-medium">
        {row.original.employee_detail?.full_name || "Unknown"}
      </div>
    ),
  },
  {
    accessorKey: "date",
    header: "Date",
    cell: ({ row }) => format(new Date(row.original.date), "MMM dd, yyyy"),
  },
  {
    id: "time_range",
    header: "Time Range",
    cell: ({ row }) => {
      const start = format(new Date(row.original.time_start), "h:mm a")
      const end = format(new Date(row.original.time_end), "h:mm a")
      return (
        <div className="flex items-center gap-2 text-sm">
          <Clock className="h-4 w-4 text-muted-foreground" />
          <span>
            {start} - {end}
          </span>
        </div>
      )
    },
  },
  {
    id: "duration",
    header: "Duration",
    cell: ({ row }) => {
      const start = new Date(row.original.time_start)
      const end = new Date(row.original.time_end)
      const hours = (end.getTime() - start.getTime()) / (1000 * 60 * 60)
      return <span>{hours.toFixed(2)} hrs</span>
    },
  },
  {
    accessorKey: "reason",
    header: "Reason",
    cell: ({ row }) => (
      <div className="max-w-[200px] truncate text-sm text-muted-foreground">
        {row.original.reason || "—"}
      </div>
    ),
  },
  {
    accessorKey: "approved",
    header: "Status",
    cell: ({ row }) => {
      const status = getBadgeStatus(row.original.approved)
      const Icon = status.icon
      return (
        <Badge
          variant={status.variant}
          className="gap-1.5 text-xs font-semibold"
        >
          <Icon className="h-3 w-3" />
          {status.label}
        </Badge>
      )
    },
  },
  {
    accessorKey: "approved_at",
    header: "Approved At",
    cell: ({ row }) => {
      if (!row.original.approved_at)
        return <span className="text-muted-foreground">—</span>
      return format(new Date(row.original.approved_at), "MMM dd, yyyy")
    },
  },
  {
    id: "actions",
    header: "Actions",
    cell: ({ row }) => {
      const overtimeRequest = row.original

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
            {isAdmin && !overtimeRequest.approved && (
              <>
                <DropdownMenuItem
                  onClick={() => onEdit?.(overtimeRequest.id)}
                >
                  Edit
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => onApprove?.(overtimeRequest.id)}
                  className="text-success"
                >
                  <CheckCircle2 className="mr-2 h-4 w-4" />
                  Approve
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => onReject?.(overtimeRequest.id)}
                  className="text-orange-600"
                >
                  <X className="mr-2 h-4 w-4" />
                  Reject
                </DropdownMenuItem>
                <DropdownMenuSeparator />
              </>
            )}
            <DropdownMenuItem
              onClick={() => onCancel?.(overtimeRequest.id)}
              className="text-destructive"
            >
              Cancel Request
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      )
    },
  },
]
