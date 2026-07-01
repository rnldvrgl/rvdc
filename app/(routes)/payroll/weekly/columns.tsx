import { DataTableActions } from "@/components/custom/table/components/DataTableActions"
import { Badge } from "@/components/ui/badge"
import { WeeklyPayroll } from "@/lib/constants/types"
import { safeCell } from "@/lib/utils/helpers"
import { formatDate } from "@/lib/utils/helpers/date"
import {
    getStatusConfig,
    payrollStatusConfigMap,
} from "@/lib/utils/statusMapping"
import { ColumnDef, Row } from "@tanstack/react-table"
import {
    Archive,
    Calendar,
    Clock,
    Eye,
    FileText,
    RotateCcw,
    Trash2,
} from "lucide-react"

interface GetPayrollColumnsProps {
    onView: (payroll: WeeklyPayroll) => void
    onDelete: (id: number) => void
    isAdmin: boolean
    onRestore?: (payroll: WeeklyPayroll) => void
    onHardDelete?: (payroll: WeeklyPayroll) => void
}

export function getPayrollColumns({
    onView,
    onDelete,
    isAdmin,
    onRestore,
    onHardDelete,
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
                            <div className="font-mono tabular-nums">
                                {weekStart ? formatDate(new Date(weekStart), "MMM dd") : "—"}
                            </div>
                            <div className="font-mono tabular-nums text-xs text-muted-foreground">
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
            cell: ({ row }: { row: Row<WeeklyPayroll> }) => {
                const config = getStatusConfig(
                    payrollStatusConfigMap,
                    row.original.status,
                    { label: row.original.status, variant: "secondary" },
                )
                return (
                    <Badge
                        variant={config.variant}
                        className="w-fit font-semibold text-xs"
                    >
                        {config.label}
                    </Badge>
                )
            },
        },
        {
            accessorKey: "total_hours",
            header: "Hours / Days",
            cell: ({ row }: { row: Row<WeeklyPayroll> }) => {
                const regularHours = Number(row.original.regular_hours || 0)
                const overtimeHours = Number(row.original.approved_ot_hours || 0)
                const totalHours = regularHours + overtimeHours
                // Use 8 as default paid hours per day; can be replaced with payroll settings if available in row
                const hoursPerDay = Number(row.original.holiday_day_hours || 8)
                const totalDays = totalHours / hoursPerDay
                return (
                    <div className="flex items-center gap-2">
                        <Clock className="h-4 w-4 text-muted-foreground" />
                        <div className="text-sm">
                            <div className="font-mono font-medium tabular-nums">
                                {totalHours.toFixed(2)}h
                                <span className="ml-1 text-xs text-muted-foreground">
                                    ({totalDays.toFixed(2)}d)
                                </span>
                            </div>
                            <div className="font-mono tabular-nums text-xs text-muted-foreground">
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
                return <span className="font-mono font-medium tabular-nums">₱{amount.toLocaleString()}</span>
            },
        },
        {
            accessorKey: "total_deductions",
            header: "Deductions",
            cell: ({ getValue }) => {
                const amount = Number(getValue() || 0)
                return <span className="font-mono tabular-nums text-destructive">-₱{amount.toLocaleString()}</span>
            },
        },
        {
            accessorKey: "net_pay",
            header: "Net Pay",
            cell: ({ getValue }) => {
                const amount = Number(getValue() || 0)
                return (
                    <div className="font-mono font-bold tabular-nums text-success">
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
                        items={
                            onRestore
                                ? [
                                    {
                                        label: "Restore",
                                        icon: RotateCcw,
                                        onClick: () => onRestore(payroll),
                                        confirmText: `Restore payroll for ${payroll.employee_name}?`,
                                    },
                                    ...(onHardDelete
                                        ? [
                                            {
                                                label: "Delete Permanently",
                                                icon: Trash2,
                                                onClick: () => onHardDelete(payroll),
                                                destructive: true,
                                                confirmText: `Permanently delete payroll for ${payroll.employee_name}?`,
                                            },
                                        ]
                                        : []),
                                ]
                                : [
                                    {
                                        label: "View Details",
                                        icon: Eye,
                                        onClick: () => onView(payroll),
                                    },
                                    ...(isAdmin
                                        ? [
                                            {
                                                label: "Archive",
                                                icon: Archive,
                                                onClick: () => onDelete(payroll.id),
                                                confirmText: `Archive payroll for ${payroll.employee_name}?`,
                                            },
                                        ]
                                        : []),
                                ]
                        }
                    />
                )
            },
        },
    ]
}
