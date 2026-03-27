import { DataTableActions } from "@/components/custom/table/components/DataTableActions"
import { Badge } from "@/components/ui/badge"
import { DailyAttendance } from "@/lib/constants/types"
import {
  formatAttendanceDate,
  formatAttendanceTime,
  getAttendanceStatusVariant,
  getAttendanceTypeColor,
} from "@/lib/utils/attendance"
import { safeCell } from "@/lib/utils/helpers"
import { ColumnDef, Row } from "@tanstack/react-table"
import {
  Archive,
  CheckCircle2,
  Clock3,
  Edit,
  XCircle,
} from "lucide-react"

interface GetAttendanceColumnsProps {
  onEdit: (attendance: DailyAttendance) => void
  onDelete: (id: number) => void
  onApprove: (attendance: DailyAttendance) => void
  onReject: (attendance: DailyAttendance) => void
}

const formatMoney = (value: string) => {
  const amount = Number.parseFloat(value || "0")
  if (!Number.isFinite(amount) || amount <= 0) return "-"
  return `PHP ${amount.toFixed(2)}`
}

export function getAttendanceColumns({
  onEdit,
  onDelete,
  onApprove,
  onReject,
}: GetAttendanceColumnsProps): ColumnDef<DailyAttendance>[] {
  return [
    {
      accessorKey: "employee_name",
      header: "Employee",
      cell: ({ row }: { row: Row<DailyAttendance> }) => (
        <div className="flex flex-col">
          <span className="font-medium">{safeCell(row.original.employee_name)}</span>
          <span className="text-xs text-muted-foreground">
            {safeCell(row.original.notes || "No notes")}
          </span>
        </div>
      ),
    },
    {
      accessorKey: "date",
      header: "Date",
      cell: ({ row }: { row: Row<DailyAttendance> }) => (
        <div className="font-medium">{formatAttendanceDate(row.original.date)}</div>
      ),
    },
    {
      accessorKey: "clock_in",
      header: "Clock In",
      cell: ({ row }: { row: Row<DailyAttendance> }) => (
        <div className="flex items-center gap-2 text-sm">
          <Clock3 className="h-4 w-4 text-muted-foreground" />
          {formatAttendanceTime(row.original.clock_in)}
        </div>
      ),
    },
    {
      accessorKey: "clock_out",
      header: "Clock Out",
      cell: ({ row }: { row: Row<DailyAttendance> }) => (
        <div className="flex items-center gap-2 text-sm">
          <Clock3 className="h-4 w-4 text-muted-foreground" />
          {formatAttendanceTime(row.original.clock_out)}
        </div>
      ),
    },
    {
      accessorKey: "attendance_type",
      header: "Type",
      cell: ({ row }: { row: Row<DailyAttendance> }) => (
        <Badge
          variant="outline"
          className={getAttendanceTypeColor(row.original.attendance_type)}
        >
          {row.original.attendance_type_display}
        </Badge>
      ),
    },
    {
      accessorKey: "paid_hours",
      header: "Paid Hours",
      cell: ({ row }: { row: Row<DailyAttendance> }) => (
        <span className="font-medium">{safeCell(row.original.paid_hours)}</span>
      ),
    },
    {
      accessorKey: "late_penalty_amount",
      header: "Late Penalty",
      cell: ({ row }: { row: Row<DailyAttendance> }) => (
        <span className="text-sm">{formatMoney(row.original.late_penalty_amount)}</span>
      ),
    },
    {
      accessorKey: "uniform_penalty_amount",
      header: "Uniform Penalty",
      cell: ({ row }: { row: Row<DailyAttendance> }) => (
        <span className="text-sm">
          {formatMoney(row.original.uniform_penalty_amount)}
        </span>
      ),
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }: { row: Row<DailyAttendance> }) => (
        <Badge variant={getAttendanceStatusVariant(row.original.status)}>
          {row.original.status_display}
        </Badge>
      ),
    },
    {
      accessorKey: "actions",
      header: "Actions",
      cell: ({ row }: { row: Row<DailyAttendance> }) => {
        const attendance = row.original
        const isPending = attendance.status === "PENDING"

        return (
          <DataTableActions
            items={[
              {
                label: "Edit",
                icon: Edit,
                onClick: () => onEdit(attendance),
              },
              ...(isPending
                ? [
                    {
                      label: "Approve",
                      icon: CheckCircle2,
                      onClick: () => onApprove(attendance),
                    },
                    {
                      label: "Reject",
                      icon: XCircle,
                      onClick: () => onReject(attendance),
                    },
                  ]
                : []),
              {
                label: "Archive",
                icon: Archive,
                onClick: () => onDelete(attendance.id),
                destructive: true,
                confirmText: `Archive attendance for ${attendance.employee_name}?`,
              },
            ]}
          />
        )
      },
    },
  ]
}