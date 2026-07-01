"use client"

import { ColumnDef } from "@tanstack/react-table"
import { format } from "date-fns"
import { Check, Clock, MoreHorizontal, X } from "lucide-react"

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
import type { WorkRequest } from "@/lib/constants/types"

export type WorkRequestColumnsProps = {
    onApprove?: (id: number) => void
    onDecline?: (id: number) => void
    isAdmin?: boolean
}

export const getWorkRequestColumns = ({
    onApprove,
    onDecline,
    isAdmin,
}: WorkRequestColumnsProps): ColumnDef<WorkRequest>[] => [
        {
            accessorKey: "employee_name",
            header: "Employee",
            cell: ({ row }) => (
                <div className="font-medium">{row.original.employee_name}</div>
            ),
        },
        {
            accessorKey: "date",
            header: "Date",
            cell: ({ row }) => (
                <span className="font-mono tabular-nums">{format(new Date(row.original.date), "MMM dd, yyyy")}</span>
            ),
        },
        {
            accessorKey: "reason",
            header: "Reason",
            cell: ({ row }) => (
                <div className="max-w-[250px] truncate text-sm text-muted-foreground">
                    {row.original.reason || "—"}
                </div>
            ),
        },
        {
            accessorKey: "status",
            header: "Status",
            cell: ({ row }) => {
                const status = row.original.status
                return (
                    <Badge
                        variant={
                            status === "approved"
                                ? "default"
                                : status === "declined"
                                    ? "destructive"
                                    : "secondary"
                        }
                        className={status === "approved" ? "bg-green-100 text-success" : ""}
                    >
                        {status === "approved" ? (
                            <>
                                <Check className="mr-1 h-3 w-3" />
                                Approved
                            </>
                        ) : status === "declined" ? (
                            <>
                                <X className="mr-1 h-3 w-3" />
                                Declined
                            </>
                        ) : (
                            <>
                                <Clock className="mr-1 h-3 w-3" />
                                Pending
                            </>
                        )}
                    </Badge>
                )
            },
        },
        {
            accessorKey: "reviewed_by_name",
            header: "Reviewed By",
            cell: ({ row }) => (
                <span className="text-sm">{row.original.reviewed_by_name || "—"}</span>
            ),
        },
        {
            accessorKey: "created_at",
            header: "Requested",
            cell: ({ row }) => (
                <span className="font-mono tabular-nums">{format(new Date(row.original.created_at), "MMM dd, yyyy h:mm a")}</span>
            ),
        },
        {
            id: "actions",
            header: "Actions",
            cell: ({ row }) => {
                const request = row.original

                if (!isAdmin || request.status !== "pending") return null

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
                                onClick={() => onApprove?.(request.id)}
                                className="text-success"
                            >
                                <Check className="mr-2 h-4 w-4" />
                                Approve
                            </DropdownMenuItem>
                            <DropdownMenuItem
                                onClick={() => onDecline?.(request.id)}
                                className="text-destructive"
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
