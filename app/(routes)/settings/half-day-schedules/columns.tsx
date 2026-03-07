import { DataTableActions } from "@/components/custom/table/components/DataTableActions"
import { Badge } from "@/components/ui/badge"
import { HalfDaySchedule } from "@/lib/queries/useHalfDaySchedules"
import { safeCell } from "@/lib/utils/helpers"
import { ColumnDef } from "@tanstack/react-table"
import { format } from "date-fns"
import { Archive, Edit2, RotateCcw, Trash2 } from "lucide-react"

interface GetColumnsProps {
  onEdit: (schedule: HalfDaySchedule) => void
  onDelete: (id: number) => void
  onRestore?: (schedule: HalfDaySchedule) => void
  onHardDelete?: (schedule: HalfDaySchedule) => void
}

export function getHalfDayScheduleColumns({
  onEdit,
  onDelete,
  onRestore,
  onHardDelete,
}: GetColumnsProps): ColumnDef<HalfDaySchedule>[] {
  return [
    {
      accessorKey: "date",
      header: "Date",
      cell: ({ row }) => {
        const date = row.original.date
        return (
          <span className="font-medium">
            {safeCell(format(new Date(date), "MMMM dd, yyyy (EEEE)"))}
          </span>
        )
      },
    },
    {
      accessorKey: "schedule_type",
      header: "Type",
      cell: ({ row }) => {
        const type = row.original.schedule_type
        return (
          <Badge variant={type === "shop_closed" ? "destructive" : "secondary"}>
            {type === "shop_closed" ? "Shop Closed" : "Half Day"}
          </Badge>
        )
      },
    },
    {
      accessorKey: "reason",
      header: "Reason",
      cell: ({ row }) => {
        const reason = row.original.reason
        if (!reason) return <span className="text-muted-foreground">—</span>
        return (
          <span className="truncate max-w-[300px] block">
            {safeCell(reason)}
          </span>
        )
      },
    },
    {
      accessorKey: "created_by_name",
      header: "Created By",
      cell: ({ row }) => {
        const createdBy = row.original.created_by_name
        return safeCell(createdBy)
      },
    },
    {
      accessorKey: "created_at",
      header: "Created",
      cell: ({ row }) => {
        const createdAt = row.original.created_at
        return safeCell(format(new Date(createdAt), "MMM dd, yyyy"))
      },
    },
    {
      id: "actions",
      header: "Actions",
      cell: ({ row }) => {
        const schedule = row.original
        if (onRestore && onHardDelete) {
          return (
            <DataTableActions
              items={[
                {
                  label: "Restore",
                  icon: RotateCcw,
                  onClick: () => onRestore(schedule),
                },
                {
                  label: "Delete Permanently",
                  icon: Trash2,
                  onClick: () => onHardDelete(schedule),
                  destructive: true,
                  confirmText: `Permanently delete this day schedule? This cannot be undone.`,
                },
              ]}
            />
          )
        }
        return (
          <DataTableActions
            items={[
              {
                label: "Edit",
                icon: Edit2,
                onClick: () => onEdit(schedule),
              },
              {
                label: "Archive",
                icon: Archive,
                onClick: () => onDelete(schedule.id),
              },
            ]}
          />
        )
      },
    },
  ]
}
