import { DataTableActions } from "@/components/custom/table/components/DataTableActions"
import { Badge } from "@/components/ui/badge"
import { Offense } from "@/lib/constants/types"
import { safeCell } from "@/lib/utils/helpers"
import { formatDate } from "@/lib/utils/helpers/date"
import { ColumnDef, Row } from "@tanstack/react-table"
import {
  AlertCircle,
  AlertTriangle,
  Ban,
  Calendar,
  Clock,
  Edit,
  Trash2,
  UserX,
} from "lucide-react"

interface GetOffenseColumnsProps {
  onEdit: (offense: Offense) => void
  onDelete: (id: number) => void
  isAdmin: boolean
}

const getOffenseTypeBadge = (offenseType: string) => {
  const config: Record<
    string,
    { color: string; icon: typeof UserX; label: string }
  > = {
    AWOL: {
      color:
        "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200 border-red-300",
      icon: UserX,
      label: "AWOL",
    },
    LATE: {
      color:
        "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200 border-yellow-300",
      icon: Clock,
      label: "Late",
    },
    CURFEW: {
      color:
        "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200 border-purple-300",
      icon: AlertCircle,
      label: "Curfew",
    },
    OTHER: {
      color:
        "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200 border-gray-300",
      icon: AlertTriangle,
      label: "Other",
    },
  }

  const { color, icon: Icon, label } = config[offenseType] || config.OTHER

  return (
    <Badge
      variant="outline"
      className={color}
    >
      <Icon className="mr-1 h-3 w-3" />
      {label}
    </Badge>
  )
}

const getSeverityBadge = (severity: string) => {
  const config: Record<
    string,
    { color: string; icon: typeof AlertTriangle; label: string }
  > = {
    WARNING: {
      color:
        "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200 border-yellow-300",
      icon: AlertTriangle,
      label: "Warning",
    },
    SUSPENSION: {
      color:
        "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200 border-orange-300",
      icon: Ban,
      label: "Suspension",
    },
    TERMINATION: {
      color:
        "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200 border-red-300",
      icon: UserX,
      label: "Termination",
    },
  }

  const { color, icon: Icon, label } = config[severity] || config.WARNING

  return (
    <Badge
      variant="outline"
      className={color}
    >
      <Icon className="mr-1 h-3 w-3" />
      {label}
    </Badge>
  )
}

export function getOffenseColumns({
  onEdit,
  onDelete,
  isAdmin,
}: GetOffenseColumnsProps): ColumnDef<Offense>[] {
  return [
    {
      accessorKey: "employee_name",
      header: "Employee",
      cell: ({ row }: { row: Row<Offense> }) => {
        const name = safeCell(row.original.employee_name)
        const idNumber = row.original.employee_id_number
        return (
          <div className="flex flex-col">
            <span className="font-medium">{name}</span>
            {idNumber && (
              <span className="text-xs text-muted-foreground">{idNumber}</span>
            )}
          </div>
        )
      },
    },
    {
      accessorKey: "offense_type",
      header: "Offense Type",
      cell: ({ row }: { row: Row<Offense> }) =>
        getOffenseTypeBadge(row.original.offense_type),
    },
    {
      accessorKey: "severity_level",
      header: "Severity",
      cell: ({ row }: { row: Row<Offense> }) =>
        getSeverityBadge(row.original.severity_level),
    },
    {
      accessorKey: "date",
      header: "Date",
      cell: ({ getValue }) => (
        <div className="flex items-center gap-2">
          <Calendar className="h-4 w-4 text-muted-foreground" />
          <span>
            {getValue()
              ? formatDate(new Date(getValue() as string), "MMM dd, yyyy")
              : "—"}
          </span>
        </div>
      ),
    },
    {
      accessorKey: "description",
      header: "Description",
      cell: ({ getValue }) => (
        <p className="truncate max-w-md">{safeCell(getValue())}</p>
      ),
    },
    {
      accessorKey: "penalty_days",
      header: "Penalty Days",
      cell: ({ row }: { row: Row<Offense> }) => {
        const days = row.original.penalty_days
        return days > 0 ? (
          <Badge
            variant="outline"
            className="font-mono"
          >
            {days} {days === 1 ? "day" : "days"}
          </Badge>
        ) : (
          <span className="text-muted-foreground">—</span>
        )
      },
    },
    {
      accessorKey: "suspension_start_date",
      header: "Suspension Period",
      cell: ({ row }: { row: Row<Offense> }) => {
        const startDate = row.original.suspension_start_date
        const endDate = row.original.suspension_end_date
        if (!startDate || !endDate) {
          return <span className="text-muted-foreground">—</span>
        }
        return (
          <div className="text-xs">
            <div>{formatDate(new Date(startDate), "MMM dd")}</div>
            <div className="text-muted-foreground">
              to {formatDate(new Date(endDate), "MMM dd")}
            </div>
          </div>
        )
      },
    },
    {
      accessorKey: "created_by_name",
      header: "Recorded By",
      cell: ({ getValue }) => (
        <span className="text-sm text-muted-foreground">
          {safeCell(getValue())}
        </span>
      ),
    },
    {
      accessorKey: "action",
      header: "Action",
      cell: ({ row }) => {
        const offense = row.original
        return (
          <DataTableActions
            items={
              isAdmin
                ? [
                    {
                      label: "Edit",
                      icon: Edit,
                      onClick: () => onEdit(offense),
                    },
                    {
                      label: "Delete",
                      icon: Trash2,
                      onClick: () => onDelete(offense.id),
                      destructive: true,
                      confirmText: `Delete offense for ${offense.employee_name}?`,
                    },
                  ]
                : []
            }
          />
        )
      },
    },
  ]
}
