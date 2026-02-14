import { DataTableActions } from "@/components/custom/table/components/DataTableActions"
import { HalfDaySchedule } from "@/lib/queries/useHalfDaySchedules"
import { safeCell } from "@/lib/utils/helpers"
import { ColumnDef } from "@tanstack/react-table"
import { format } from "date-fns"
import { Edit2, Trash2 } from "lucide-react"

interface GetColumnsProps {
  onEdit: (schedule: HalfDaySchedule) => void
  onDelete: (id: number) => void
}

export function getHalfDayScheduleColumns({
  onEdit,
  onDelete,
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
        return (
          <DataTableActions
            items={[
              {
                label: "Edit",
                icon: Edit2,
                onClick: () => onEdit(schedule),
              },
              {
                label: "Delete",
                icon: Trash2,
                onClick: () => onDelete(schedule.id),
                destructive: true,
              },
            ]}
          />
        )
      },
    },
  ]
}
