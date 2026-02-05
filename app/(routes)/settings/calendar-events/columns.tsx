import { DataTableActions } from "@/components/custom/table/components/DataTableActions"
import { Badge } from "@/components/ui/badge"
import { CustomCalendarEvent } from "@/lib/queries/calendar/useCustomCalendarEvents"
import { safeCell } from "@/lib/utils/helpers"
import { ColumnDef } from "@tanstack/react-table"
import { format } from "date-fns"
import { Edit2, Trash2 } from "lucide-react"

interface GetColumnsProps {
  onEdit: (event: CustomCalendarEvent) => void
  onDelete: (id: number) => void
}

const eventTypeColors: Record<string, string> = {
  meeting: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
  maintenance:
    "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200",
  training:
    "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200",
  deadline:
    "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200",
  other: "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200",
}

export function getCalendarEventColumns({
  onEdit,
  onDelete,
}: GetColumnsProps): ColumnDef<CustomCalendarEvent>[] {
  return [
    {
      accessorKey: "title",
      header: "Title",
      cell: ({ row }) => {
        const title = row.original.title
        return <span className="font-medium">{safeCell(title)}</span>
      },
    },
    {
      accessorKey: "event_date",
      header: "Date",
      cell: ({ row }) => {
        const date = row.original.event_date
        return safeCell(format(new Date(date), "MMM dd, yyyy"))
      },
    },
    {
      accessorKey: "event_type",
      header: "Type",
      cell: ({ row }) => {
        const eventType = row.original.event_type
        const eventTypeDisplay = row.original.event_type_display
        return (
          <Badge
            className={`inline-block px-2 py-1 rounded text-sm font-medium ${
              eventTypeColors[eventType] || eventTypeColors.other
            }`}
          >
            {eventTypeDisplay}
          </Badge>
        )
      },
    },
    {
      accessorKey: "description",
      header: "Description",
      cell: ({ row }) => {
        const description = row.original.description
        if (!description)
          return <span className="text-muted-foreground">—</span>
        return (
          <span className="truncate max-w-[300px] block">
            {safeCell(description)}
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
      id: "actions",
      header: "Actions",
      cell: ({ row }) => {
        const event = row.original
        return (
          <DataTableActions
            items={[
              {
                label: "Edit",
                icon: Edit2,
                onClick: () => onEdit(event),
              },
              {
                label: "Delete",
                icon: Trash2,
                onClick: () => onDelete(event.id),
                destructive: true,
              },
            ]}
          />
        )
      },
    },
  ]
}
