import { DataTableActions } from "@/components/custom/table/components/DataTableActions"
import { Badge } from "@/components/ui/badge"
import { GetColumnsProps, Service } from "@/lib/constants/interface"
import { formatCurrency, getBadgeVariant, safeCell } from "@/lib/utils/helpers"
import { formatDate } from "@/lib/utils/helpers/date"
import { ColumnDef } from "@tanstack/react-table"
import { CheckCircle, Edit, Eye, Trash2 } from "lucide-react"

const serviceTypeLabels: Record<string, string> = {
  repair: "Repair",
  inspection: "Inspection",
  cleaning: "Cleaning",
  motor_rewind: "Motor Rewind",
  installation: "Installation",
}

const serviceModeLabels: Record<string, string> = {
  home_service: "Home Service",
  carry_in: "Carry In",
  pull_out: "Pull-Out",
}

const serviceStatusLabels: Record<string, string> = {
  pending: "Pending",
  in_progress: "In Progress",
  completed: "Completed",
  cancelled: "Cancelled",
}

interface GetServiceColumnsProps extends GetColumnsProps<Service> {
  onComplete?: (service: Service) => void
}

export function getServiceColumns({
  role,
  onView,
  onEdit,
  onDelete,
  onComplete,
}: GetServiceColumnsProps): ColumnDef<Service>[] {
  const canManageServices = role === "admin" || role === "manager"
  const columns: ColumnDef<Service>[] = [
    {
      accessorKey: "id",
      header: "Service #",
      cell: ({ getValue }) => (
        <span className="font-mono text-sm">
          #{String(getValue()).padStart(4, "0")}
        </span>
      ),
    },
    {
      accessorKey: "client.full_name",
      header: "Client",
      cell: ({ row }) =>
        safeCell(row.original.client?.full_name || "Unknown Client"),
    },
    {
      accessorKey: "service_type",
      header: "Type",
      cell: ({ getValue }) => {
        const value = getValue() as string
        const typeVariants: Record<
          string,
          | "default"
          | "secondary"
          | "outline"
          | "destructive"
          | "success"
          | "warning"
        > = {
          repair: "warning",
          inspection: "default",
          cleaning: "success",
          motor_rewind: "destructive",
          installation: "default",
        }
        return (
          <Badge variant={typeVariants[value] || "outline"}>
            {serviceTypeLabels[value] || safeCell(value)}
          </Badge>
        )
      },
    },
    {
      accessorKey: "service_mode",
      header: "Mode",
      cell: ({ getValue }) => {
        const value = getValue() as string
        const modeVariants: Record<
          string,
          | "default"
          | "secondary"
          | "outline"
          | "destructive"
          | "success"
          | "warning"
        > = {
          home_service: "default",
          carry_in: "secondary",
          pull_out: "outline",
        }
        return (
          <Badge variant={modeVariants[value] || "secondary"}>
            {serviceModeLabels[value] || safeCell(value)}
          </Badge>
        )
      },
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ getValue }) => {
        const value = getValue() as string
        return (
          <Badge variant={getBadgeVariant(value)}>
            {serviceStatusLabels[value] || safeCell(value)}
          </Badge>
        )
      },
    },
    {
      accessorKey: "total_revenue",
      header: "Revenue",
      cell: ({ getValue }) => {
        const value = getValue()
        return value ? (
          formatCurrency(Number(value))
        ) : (
          <span className="text-muted-foreground">₱0.00</span>
        )
      },
    },
    {
      accessorKey: "payment_status",
      header: "Payment",
      cell: ({ getValue }) => (
        <Badge variant={getBadgeVariant(getValue() as string)}>
          {safeCell(getValue())}
        </Badge>
      ),
    },
    {
      accessorKey: "pickup_date",
      header: "Schedule",
      cell: ({ row }) => {
        const service = row.original
        const pickup = service.pickup_date
        const delivery = service.delivery_date

        if (!pickup && !delivery) {
          return <span className="text-muted-foreground text-sm">—</span>
        }

        return (
          <div className="text-sm space-y-0.5">
            {pickup && (
              <div>
                <span className="text-xs text-muted-foreground">
                  Pull out:{" "}
                </span>
                {formatDate(new Date(pickup), "MMM dd, h:mm a")}
              </div>
            )}
            {delivery && (
              <div>
                <span className="text-xs text-muted-foreground">
                  Delivery:{" "}
                </span>
                {formatDate(new Date(delivery), "MMM dd, h:mm a")}
              </div>
            )}
          </div>
        )
      },
    },
    {
      accessorKey: "created_at",
      header: "Added date",
      cell: ({ getValue }) =>
        safeCell(
          getValue()
            ? formatDate(new Date(getValue() as string), "MMM dd, yyyy")
            : null,
        ),
    },
    {
      id: "actions",
      header: "Actions",
      cell: ({ row }) => {
        const service = row.original
        const canComplete =
          service.status === "in_progress" || service.status === "pending"

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
                      label: "Delete",
                      icon: Trash2,
                      onClick: () => onDelete?.(service),
                      destructive: true,
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
