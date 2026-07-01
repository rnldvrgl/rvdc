import { DataTableActions } from "@/components/custom/table/components/DataTableActions"
import { Badge } from "@/components/ui/badge"
import { LeaveRequest } from "@/lib/constants/types"
import { formatAttendanceDate } from "@/lib/utils/attendance"
import { ColumnDef } from "@tanstack/react-table"
import { Archive, CheckCircle2, Edit, MessageSquareWarning } from "lucide-react"

interface GetLeaveColumnsProps {
    onEdit: (leave: LeaveRequest) => void
    onDelete: (id: number) => void
    onApprove: (leave: LeaveRequest) => void
    onReject: (leave: LeaveRequest) => void
}

const getStatusBadge = (status: LeaveRequest["status"]) => {
    switch (status) {
        case "APPROVED":
            return <Badge variant="success">Approved</Badge>
        case "REJECTED":
            return <Badge variant="destructive">Rejected</Badge>
        case "CANCELLED":
            return <Badge variant="outline">Cancelled</Badge>
        default:
            return <Badge variant="secondary">Pending</Badge>
    }
}

const formatDuration = (leave: LeaveRequest) => {
    const days = Number.parseFloat(leave.days_count || "1")
    if (leave.is_half_day || days === 0.5) {
        const period = leave.shift_period === "AM" ? "AM" : "PM"
        return `Half-day (${period})`
    }
    if (days === 1) return "1 day"
    return `${days} days`
}

const formatRange = (leave: LeaveRequest) => {
    const start = leave.start_date || leave.date
    const end = leave.end_date || leave.date

    if (!start || !end) return "-"
    if (start === end) return formatAttendanceDate(start)
    return `${formatAttendanceDate(start)} - ${formatAttendanceDate(end)}`
}

export function getLeaveColumns({
    onEdit,
    onDelete,
    onApprove,
    onReject,
}: GetLeaveColumnsProps): ColumnDef<LeaveRequest>[] {
    return [
        {
            accessorKey: "employee_name",
            header: "Employee",
            cell: ({ row }) => (
                <div className="font-medium">{row.original.employee_name}</div>
            ),
        },
        {
            accessorKey: "leave_type",
            header: "Type",
            cell: ({ row }) => (
                <Badge
                    variant="outline"
                    className="uppercase"
                >
                    {row.original.leave_type}
                </Badge>
            ),
        },
        {
            accessorKey: "date",
            header: "Date Range",
            cell: ({ row }) => (
                <span className="font-mono tabular-nums">{formatRange(row.original)}</span>
            ),
        },
        {
            accessorKey: "days_count",
            header: "Duration",
            cell: ({ row }) => (
                <span className="font-mono tabular-nums">{formatDuration(row.original)}</span>
            ),
        },
        {
            accessorKey: "status",
            header: "Status",
            cell: ({ row }) => getStatusBadge(row.original.status),
        },
        {
            accessorKey: "reason",
            header: "Reason",
            cell: ({ row }) => (
                <span className="block max-w-md truncate">{row.original.reason}</span>
            ),
        },
        {
            id: "actions",
            header: "Actions",
            cell: ({ row }) => {
                const leave = row.original
                const isPending = leave.status === "PENDING"

                return (
                    <DataTableActions
                        items={[
                            {
                                label: "Edit",
                                icon: Edit,
                                onClick: () => onEdit(leave),
                            },
                            ...(isPending
                                ? [
                                    {
                                        label: "Approve",
                                        icon: CheckCircle2,
                                        onClick: () => onApprove(leave),
                                    },
                                    {
                                        label: "Reject",
                                        icon: MessageSquareWarning,
                                        onClick: () => onReject(leave),
                                    },
                                ]
                                : []),
                            {
                                label: "Archive",
                                icon: Archive,
                                onClick: () => onDelete(leave.id),
                                destructive: true,
                                confirmText: `Archive leave request for ${leave.employee_name}?`,
                            },
                        ]}
                    />
                )
            },
        },
    ]
}
