import { DataTableActions } from "@/components/custom/table/components/DataTableActions"
import { Badge } from "@/components/ui/badge"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { GetColumnsProps, Service } from "@/lib/constants/interface"
import {
  formatCurrency,
  formatTimeTo12Hour,
  getBadgeVariant,
  safeCell,
} from "@/lib/utils/helpers"
import { formatDate } from "@/lib/utils/helpers/date"
import {
  getServiceModeLabel,
  getServiceStatusLabel,
  getServiceTypeBadgeClass,
  getServiceTypeLabel,
} from "@/lib/utils/helpers/service"
import { ColumnDef } from "@tanstack/react-table"
import { formatDistanceToNow } from "date-fns"
import {
  Archive,
  Calendar,
  CheckCircle,
  Edit,
  Eye,
  Package,
  RotateCcw,
  Shield,
  Sparkles,
  Trash2,
  Truck,
} from "lucide-react"

// --- Helpers ---

function extractTimeFromDatetime(datetime: string): string | null {
  try {
    const date = new Date(datetime)
    if (isNaN(date.getTime())) return null
    const hours = String(date.getHours()).padStart(2, "0")
    const minutes = String(date.getMinutes()).padStart(2, "0")
    if (hours === "00" && minutes === "00") return null
    return `${hours}:${minutes}`
  } catch {
    return null
  }
}

function relativeTime(dateString: string): string {
  try {
    return formatDistanceToNow(new Date(dateString), { addSuffix: true })
  } catch {
    return ""
  }
}

function hasActiveWarranty(service: Service): boolean {
  return (
    service.appliances?.some(
      (a) => a.is_labor_warranty_active || a.is_unit_warranty_active,
    ) ?? false
  )
}

function hasFreeCleaningAvailable(service: Service): boolean {
  return (
    service.installation_units?.some(
      (u) =>
        u.free_cleaning_redeemed === false &&
        u.free_cleaning_status === "available",
    ) ?? false
  )
}

function getPrimarySchedule(service: Service): {
  label: string
  date: string
  time: string | null
  icon: "calendar" | "truck" | "truck-green" | "truck-blue"
} | null {
  const schedule = service.next_schedule
  const pickup = service.pickup_date
  const delivery = service.delivery_date

  if (schedule) {
    const dateStr = formatDate(new Date(schedule.scheduled_date), "MMM dd")
    const time = schedule.scheduled_time
      ? formatTimeTo12Hour(schedule.scheduled_time)
      : null
    const typeMap: Record<string, string> = {
      home_service: "Home Svc",
      pull_out: "Pull Out",
      return: "Return",
    }
    const iconMap: Record<
      string,
      "calendar" | "truck" | "truck-green" | "truck-blue"
    > = {
      home_service: "calendar",
      pull_out: "truck",
      return: "truck-blue",
    }
    return {
      label: typeMap[schedule.schedule_type] || schedule.schedule_type,
      date: dateStr,
      time,
      icon: iconMap[schedule.schedule_type] || "calendar",
    }
  }

  if (pickup) {
    const time = extractTimeFromDatetime(pickup)
    return {
      label: "Pickup",
      date: formatDate(new Date(pickup), "MMM dd"),
      time: time ? formatTimeTo12Hour(time) : null,
      icon: "truck",
    }
  }

  if (delivery) {
    const time = extractTimeFromDatetime(delivery)
    return {
      label: "Delivery",
      date: formatDate(new Date(delivery), "MMM dd"),
      time: time ? formatTimeTo12Hour(time) : null,
      icon: "truck-green",
    }
  }

  return null
}

function getScheduleTooltipLines(service: Service): string[] {
  const lines: string[] = []
  const schedule = service.next_schedule
  const pickup = service.pickup_date
  const delivery = service.delivery_date

  if (schedule?.schedule_type === "home_service") {
    const time = schedule.scheduled_time
      ? ` at ${formatTimeTo12Hour(schedule.scheduled_time)}`
      : ""
    lines.push(
      `Home Service: ${formatDate(new Date(schedule.scheduled_date), "MMM dd, yyyy")}${time}`,
    )
  }
  if (schedule?.schedule_type === "pull_out" || pickup) {
    if (schedule?.schedule_type === "pull_out") {
      const time = schedule.scheduled_time
        ? ` at ${formatTimeTo12Hour(schedule.scheduled_time)}`
        : ""
      lines.push(
        `Pull-Out: ${formatDate(new Date(schedule.scheduled_date), "MMM dd, yyyy")}${time}`,
      )
    } else if (pickup) {
      const time = extractTimeFromDatetime(pickup)
      const timeStr = time ? ` at ${formatTimeTo12Hour(time)}` : ""
      lines.push(
        `Pickup: ${formatDate(new Date(pickup), "MMM dd, yyyy")}${timeStr}`,
      )
    }
  }
  if (delivery) {
    const time = extractTimeFromDatetime(delivery)
    const timeStr = time ? ` at ${formatTimeTo12Hour(time)}` : ""
    lines.push(
      `Delivery: ${formatDate(new Date(delivery), "MMM dd, yyyy")}${timeStr}`,
    )
  }
  if (schedule?.schedule_type === "return") {
    const time = schedule.scheduled_time
      ? ` at ${formatTimeTo12Hour(schedule.scheduled_time)}`
      : ""
    lines.push(
      `Return: ${formatDate(new Date(schedule.scheduled_date), "MMM dd, yyyy")}${time}`,
    )
  }
  return lines
}

// --- Status colours (used by Kanban too) ---
export const statusConfig: Record<
  string,
  {
    label: string
    color: string
    bgColor: string
    borderColor: string
    dotColor: string
  }
> = {
  in_progress: {
    label: "In Progress",
    color: "text-blue-700 dark:text-blue-400",
    bgColor: "bg-blue-50 dark:bg-blue-950/30",
    borderColor: "border-blue-200 dark:border-blue-800",
    dotColor: "bg-blue-500",
  },
  completed: {
    label: "Completed",
    color: "text-success",
    bgColor: "bg-emerald-50 dark:bg-emerald-950/30",
    borderColor: "border-emerald-200 dark:border-emerald-800",
    dotColor: "bg-emerald-500",
  },
  cancelled: {
    label: "Cancelled",
    color: "text-destructive",
    bgColor: "bg-red-50 dark:bg-red-950/30",
    borderColor: "border-red-200 dark:border-red-800",
    dotColor: "bg-red-500",
  },
}

export const applianceStatusLabels: Record<string, string> = {
  received: "Received",
  diagnosed: "Diagnosed",
  in_repair: "In Repair",
  completed: "Completed",
  ready_for_pickup: "Ready",
  delivered: "Delivered",
  reserved: "Reserved",
  installed: "Installed",
}

// --- Column definition ---

interface GetServiceColumnsProps extends GetColumnsProps<Service> {
  onComplete?: (service: Service) => void
  onStatusChange?: (service: Service, newStatus: string) => void
}

export function getServiceColumns({
  role,
  onView,
  onEdit,
  onDelete,
  onComplete,
  onStatusChange,
  onRestore,
  onHardDelete,
}: GetServiceColumnsProps): ColumnDef<Service>[] {
  const canManageServices = role === "admin" || role === "manager"

  const columns: ColumnDef<Service>[] = [
    // -- Client --
    {
      accessorKey: "client.full_name",
      header: "Client",
      cell: ({ row }) => {
        const service = row.original
        const warranty = hasActiveWarranty(service)
        const freeCleaning = hasFreeCleaningAvailable(service)
        const applianceCount = service.appliances?.length || 0
        const pendingItems = service.has_pending_items

        return (
          <div className="min-w-0">
            <div className="flex items-center gap-1">
              <span className="font-medium text-sm truncate max-w-32">
                {safeCell(service.client?.full_name || "Unknown")}
              </span>
              {pendingItems && (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Package className="h-3 w-3 text-orange-500 shrink-0" />
                  </TooltipTrigger>
                  <TooltipContent>Items pending review</TooltipContent>
                </Tooltip>
              )}
              {warranty && (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Shield className="h-3 w-3 text-blue-500 shrink-0" />
                  </TooltipTrigger>
                  <TooltipContent>Active warranty</TooltipContent>
                </Tooltip>
              )}
              {freeCleaning && (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Sparkles className="h-3 w-3 text-success shrink-0" />
                  </TooltipTrigger>
                  <TooltipContent>Free cleaning available</TooltipContent>
                </Tooltip>
              )}
            </div>
            {applianceCount > 0 && (
              <span className="text-[10px] text-muted-foreground">
                {applianceCount} appliance{applianceCount > 1 ? "s" : ""}
              </span>
            )}
          </div>
        )
      },
    },

    // -- Status (interactive) --
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }) => {
        const service = row.original
        const value = service.status
        const config = statusConfig[value]
        const isTerminal = value === "completed" || value === "cancelled"

        if (isTerminal || !canManageServices || !onStatusChange) {
          return (
            <Badge
              variant={getBadgeVariant(value)}
              className="text-[11px]"
            >
              {getServiceStatusLabel(value)}
            </Badge>
          )
        }

        const transitions: { label: string; status: string }[] = []
        if (value === "in_progress") {
          transitions.push({ label: "Complete", status: "completed" })
        }

        return (
          <div className="flex items-center gap-1">
            <Badge
              variant={getBadgeVariant(value)}
              className="text-[11px] cursor-default"
            >
              {getServiceStatusLabel(value)}
            </Badge>
            {transitions.map((t) => (
              <Tooltip key={t.status}>
                <TooltipTrigger asChild>
                  <button
                    aria-label={t.label}
                    onClick={(e) => {
                      e.stopPropagation()
                      onStatusChange(service, t.status)
                    }}
                    className="inline-flex items-center justify-center h-5 w-5 rounded-full bg-muted hover:bg-primary/10 transition-colors cursor-pointer"
                  >
                    <CheckCircle
                      className={`h-3 w-3 ${config?.color || "text-muted-foreground"}`}
                    />
                  </button>
                </TooltipTrigger>
                <TooltipContent>{t.label}</TooltipContent>
              </Tooltip>
            ))}
          </div>
        )
      },
    },

    // -- Type / Mode (combined) --
    {
      accessorKey: "service_type",
      header: "Service",
      cell: ({ row }) => {
        const service = row.original
        const typeColor = getServiceTypeBadgeClass(service.service_type)
        return (
          <div className="flex flex-wrap gap-0.5">
            <Badge
              variant="outline"
              className={`text-[10px] px-1.5 py-0 ${typeColor}`}
            >
              {getServiceTypeLabel(service.service_type)}
            </Badge>
            <Badge
              variant="secondary"
              className="text-[10px] px-1.5 py-0"
            >
              {getServiceModeLabel(service.service_mode)}
            </Badge>
          </div>
        )
      },
    },

    // -- Schedule (compact single line with tooltip) --
    {
      accessorKey: "pickup_date",
      header: "Schedule",
      cell: ({ row }) => {
        const service = row.original
        const primary = getPrimarySchedule(service)
        if (!primary) {
          return <span className="text-muted-foreground text-xs">—</span>
        }

        const tooltipLines = getScheduleTooltipLines(service)
        const iconEl =
          primary.icon === "calendar" ? (
            <Calendar className="h-3 w-3 text-muted-foreground shrink-0" />
          ) : primary.icon === "truck-green" ? (
            <Truck className="h-3 w-3 text-success shrink-0" />
          ) : primary.icon === "truck-blue" ? (
            <Truck className="h-3 w-3 text-blue-500 shrink-0" />
          ) : (
            <Truck className="h-3 w-3 text-muted-foreground shrink-0" />
          )

        return (
          <Tooltip>
            <TooltipTrigger asChild>
              <div className="flex items-center gap-1 text-xs cursor-default whitespace-nowrap">
                {iconEl}
                <span className="text-muted-foreground">{primary.label}:</span>
                <span className="font-medium">{primary.date}</span>
                {primary.time && (
                  <span className="text-muted-foreground">{primary.time}</span>
                )}
              </div>
            </TooltipTrigger>
            {tooltipLines.length > 0 && (
              <TooltipContent className="text-xs">
                <div className="space-y-0.5">
                  {tooltipLines.map((line, i) => (
                    <div key={i}>{line}</div>
                  ))}
                </div>
              </TooltipContent>
            )}
          </Tooltip>
        )
      },
    },

    // -- Revenue --
    {
      accessorKey: "total_revenue",
      header: "Revenue",
      cell: ({ getValue }) => {
        const value = getValue()
        return value ? (
          <span className="font-medium tabular-nums text-sm">
            {formatCurrency(Number(value))}
          </span>
        ) : (
          <span className="text-muted-foreground text-sm">₱0</span>
        )
      },
    },

    // -- Payment Status --
    {
      accessorKey: "payment_status",
      header: "Payment",
      cell: ({ getValue }) => (
        <Badge
          variant={getBadgeVariant(getValue() as string)}
          className="text-[11px]"
        >
          {safeCell(getValue())}
        </Badge>
      ),
    },

    // -- Created date (compact relative) --
    {
      accessorKey: "created_at",
      header: "Added",
      cell: ({ getValue }) => {
        const value = getValue() as string
        if (!value) return <span className="text-muted-foreground">—</span>

        return (
          <Tooltip>
            <TooltipTrigger asChild>
              <span className="text-xs text-muted-foreground cursor-default whitespace-nowrap">
                {relativeTime(value)}
              </span>
            </TooltipTrigger>
            <TooltipContent>
              {formatDate(new Date(value), "EEEE, MMMM dd, yyyy 'at' h:mm a")}
            </TooltipContent>
          </Tooltip>
        )
      },
    },

    // -- Actions --
    {
      id: "actions",
      header: "",
      cell: ({ row }) => {
        const service = row.original
        const canComplete = service.status === "in_progress"

        if (onRestore) {
          return (
            <DataTableActions
              items={[
                {
                  label: "Restore",
                  icon: RotateCcw,
                  onClick: () => onRestore(service),
                },
                ...(onHardDelete
                  ? [
                      {
                        label: "Delete Permanently",
                        icon: Trash2,
                        onClick: () => onHardDelete(service),
                        destructive: true,
                        confirmText: `Permanently delete service #${service.id}? This cannot be undone.`,
                      },
                    ]
                  : []),
              ]}
            />
          )
        }

        return (
          <DataTableActions
            items={[
              {
                label: "View Details",
                icon: Eye,
                onClick: () => onView?.(service),
              },
              ...(canManageServices
                ? [
                    {
                      label: "Edit",
                      icon: Edit,
                      onClick: () => onEdit?.(service),
                      disabled: service.status === "completed",
                    },
                  ]
                : []),
              ...(canComplete && canManageServices && onComplete
                ? [
                    {
                      label: "Complete Service",
                      icon: CheckCircle,
                      onClick: () => onComplete(service),
                    },
                  ]
                : []),
              ...(canManageServices
                ? [
                    {
                      label: "Archive",
                      icon: Archive,
                      onClick: () => onDelete?.(service),
                      disabled: service.status === "completed",
                    },
                  ]
                : []),
            ]}
          />
        )
      },
    },
  ]

  return columns
}
