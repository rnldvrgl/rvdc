import { DataTableActions } from "@/components/custom/table/components/DataTableActions"
import { Badge } from "@/components/ui/badge"
import { WeeklyPayroll } from "@/lib/constants/types"
import { safeCell } from "@/lib/utils/helpers"
import { formatDate } from "@/lib/utils/helpers/date"
import { ColumnDef, Row } from "@tanstack/react-table"
import { Calendar, Clock, Eye, FileText, Trash2 } from "lucide-react"

interface GetPayrollColumnsProps {
  onView: (payroll: WeeklyPayroll) => void
  onDelete: (id: number) => void
  isAdmin: boolean
}

const getStatusBadge = (status: string) => {
  const config: Record<string, { color: string; label: string }> = {
    draft: {
      color:
        "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200 border-gray-300",
      label: "Draft",
    },
    approved: {
      color:
        "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200 border-blue-300",
      label: "Approved",
    },
    paid: {
      color:
        "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200 border-green-300",
      label: "Paid",
    },
  }

  const { color, label } = config[status] || config.draft

  return (
    <Badge
      variant="outline"
      className={color}
    >
      {label}
    </Badge>
  )
}

export function getPayrollColumns({
  onView,
  onDelete,
  isAdmin,
}: GetPayrollColumnsProps): ColumnDef<WeeklyPayroll>[] {
  return [
    {
      accessorKey: "employee_name",
      header: "Employee",
      cell: ({ row }: { row: Row<WeeklyPayroll> }) => {
        const name = safeCell(row.original.employee_name)
        return (
          <div className="flex flex-col">
            <span className="font-medium">{name}</span>
          </div>
        )
      },
    },
    {
      accessorKey: "week_start",
      header: "Week Period",
      cell: ({ row }: { row: Row<WeeklyPayroll> }) => {
        const weekStart = row.original.week_start
        const weekEnd = row.original.week_end
        return (
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4 text-muted-foreground" />
            <div className="text-sm">
              <div>
                {weekStart ? formatDate(new Date(weekStart), "MMM dd") : "—"}
              </div>
              <div className="text-xs text-muted-foreground">
                to{" "}
                {weekEnd ? formatDate(new Date(weekEnd), "MMM dd, yyyy") : "—"}
              </div>
            </div>
          </div>
        )
      },
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }: { row: Row<WeeklyPayroll> }) =>
        getStatusBadge(row.original.status),
    },
    {
      accessorKey: "total_hours",
      header: "Hours",
      cell: ({ row }: { row: Row<WeeklyPayroll> }) => {
        const regularHours = Number(row.original.regular_hours || 0)
        const overtimeHours = Number(row.original.overtime_hours || 0)
        const totalHours = regularHours + overtimeHours
        return (
          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4 text-muted-foreground" />
            <div className="text-sm">
              <div className="font-medium">{totalHours.toFixed(2)}h</div>
              <div className="text-xs text-muted-foreground">
                {regularHours.toFixed(1)}r + {overtimeHours.toFixed(1)}ot
              </div>
            </div>
          </div>
        )
      },
    },
    {
      accessorKey: "gross_pay",
      header: "Gross Pay",
      cell: ({ getValue }) => {
        const amount = Number(getValue() || 0)
        return <span className="font-medium">₱{amount.toLocaleString()}</span>
      },
    },
    {
      accessorKey: "total_deductions",
      header: "Deductions",
      cell: ({ getValue }) => {
        const amount = Number(getValue() || 0)
        return <span className="text-red-600">-₱{amount.toLocaleString()}</span>
      },
    },
    {
      accessorKey: "net_pay",
      header: "Net Pay",
      cell: ({ getValue }) => {
        const amount = Number(getValue() || 0)
        return (
          <div className="font-bold text-green-600">
            ₱{amount.toLocaleString()}
          </div>
        )
      },
    },
    {
      accessorKey: "notes",
      header: "Notes",
      cell: ({ getValue }) => {
        const notes = getValue() as string
        return notes ? (
          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            <FileText className="h-3 w-3" />
            <span className="truncate max-w-[150px]">{notes}</span>
          </div>
        ) : (
          <span className="text-muted-foreground">—</span>
        )
      },
    },
    {
      id: "actions",
      header: "Actions",
      cell: ({ row }: { row: Row<WeeklyPayroll> }) => {
        const payroll = row.original
        return (
          <DataTableActions
            items={[
              {
                label: "View Details",
                icon: <Eye className="size-4" />,
                onClick: () => onView(payroll),
              },
              ...(isAdmin
                ? [
                    {
                      label: "Delete",
                      icon: <Trash2 className="size-4 text-destructive" />,
                      onClick: () => onDelete(payroll.id),
                      destructive: true,
                    },
                  ]
                : []),
            ]}
          />
        )
      },
    },
  ]
}
