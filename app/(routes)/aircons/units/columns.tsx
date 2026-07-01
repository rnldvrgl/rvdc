import { DataTableActions } from "@/components/custom/table/components/DataTableActions"
import { AirconUnits, GetColumnsProps } from "@/lib/constants/interface"
import { safeCell } from "@/lib/utils/helpers"
import { formatDate } from "@/lib/utils/helpers/date"
import { ColumnDef, Row } from "@tanstack/react-table"
import { Archive, Edit, Eye, RotateCcw, Trash2, Wrench } from "lucide-react"

export function getAirconUnitsColumns({
    onEdit,
    onDelete,
    onView,
    onInstall,
    onRestore,
    onHardDelete,
}: GetColumnsProps<AirconUnits>): ColumnDef<AirconUnits>[] {
    return [
        {
            accessorKey: "serial_number",
            header: "Indoor S/N",
            cell: ({ getValue }) => (
                <span className="font-mono font-medium">{safeCell(getValue())}</span>
            ),
        },
        {
            accessorKey: "outdoor_serial_number",
            header: "Outdoor S/N",
            cell: ({ getValue }) => {
                const value = getValue()
                return value ? (
                    <span className="font-mono font-medium">{safeCell(value)}</span>
                ) : (
                    <span className="text-muted-foreground text-xs">N/A</span>
                )
            },
        },
        {
            accessorKey: "model.brand.name",
            header: "Brand",
            cell: ({ row }: { row: Row<AirconUnits> }) =>
                safeCell(row.original.model?.brand?.name),
        },
        {
            accessorKey: "model.name",
            header: "Model",
            cell: ({ row }: { row: Row<AirconUnits> }) =>
                safeCell(row.original.model?.name),
        },
        {
            accessorKey: "model.aircon_type",
            header: "Type",
            cell: ({ row }: { row: Row<AirconUnits> }) =>
                safeCell(row.original.model?.aircon_type),
        },
        {
            accessorKey: "client_name",
            header: "Client",
            cell: ({ row }: { row: Row<AirconUnits> }) => {
                const name = row.original.client_name
                return name ? (
                    <span className="font-medium">{name}</span>
                ) : (
                    <span className="text-muted-foreground text-xs">—</span>
                )
            },
        },
        {
            accessorKey: "unit_status",
            header: "Status",
            cell: ({ row }: { row: Row<AirconUnits> }) => {
                const status = row.original.unit_status ?? "Available"

                const variants: Record<
                    string,
                    { bg: string; text: string; ring: string }
                > = {
                    Installed: {
                        bg: "bg-success/10 dark:bg-success/15",
                        text: "text-success",
                        ring: "ring-success/30",
                    },
                    "For Installation": {
                        bg: "bg-info/10 dark:bg-info/15",
                        text: "text-info",
                        ring: "ring-info/30",
                    },
                    Sold: {
                        bg: "bg-success/10 dark:bg-success/15",
                        text: "text-success",
                        ring: "ring-success/30",
                    },
                    Reserved: {
                        bg: "bg-warning/10 dark:bg-warning/15",
                        text: "text-warning",
                        ring: "ring-warning/30",
                    },
                    Available: {
                        bg: "bg-muted/60 dark:bg-muted/30",
                        text: "text-muted-foreground",
                        ring: "ring-border",
                    },
                }

                const v = variants[status] ?? variants.Available
                const isSold = row.original.is_sold

                return (
                    <div className="flex items-center gap-1.5">
                        <span
                            className={`inline-flex items-center rounded-md px-2 py-1 text-xs font-medium ring-1 ring-inset ${v.bg} ${v.text} ${v.ring}`}
                        >
                            {status}
                        </span>
                        {status === "Installed" && isSold && (
                            <span
                                className={`inline-flex items-center rounded-md px-2 py-1 text-xs font-medium ring-1 ring-inset ${variants.Sold.bg} ${variants.Sold.text} ${variants.Sold.ring}`}
                            >
                                Sold
                            </span>
                        )}
                    </div>
                )
            },
        },
        {
            accessorKey: "sold_date",
            header: "Sold Date",
            cell: ({ row }: { row: Row<AirconUnits> }) => {
                const date = row.original.sold_date
                return date ? (
                    <span className="font-mono tabular-nums">{formatDate(new Date(date), "MMM dd, yyyy")}</span>
                ) : (
                    <span className="text-muted-foreground text-xs">—</span>
                )
            },
        },
        {
            accessorKey: "installed_date",
            header: "Installed Date",
            cell: ({ row }: { row: Row<AirconUnits> }) => {
                const date = row.original.installed_date
                return date ? (
                    <span className="font-mono tabular-nums">{formatDate(new Date(date), "MMM dd, yyyy")}</span>
                ) : (
                    <span className="text-muted-foreground text-xs">—</span>
                )
            },
        },
        {
            accessorKey: "created_at",
            header: "Added Date",
            cell: ({ getValue }) =>
                getValue()
                    ? <span className="font-mono tabular-nums">{formatDate(new Date(getValue() as string), "MMM dd, yyyy")}</span>
                    : "—",
        },
        {
            accessorKey: "action",
            header: "Action",
            cell: ({ row }) => {
                const unit = row.original

                if (onRestore) {
                    return (
                        <DataTableActions
                            items={[
                                {
                                    label: "Restore",
                                    icon: RotateCcw,
                                    onClick: () => onRestore(unit),
                                },
                                ...(onHardDelete
                                    ? [
                                        {
                                            label: "Delete Permanently",
                                            icon: Trash2,
                                            onClick: () => onHardDelete(unit),
                                            destructive: true,
                                            confirmText: `Permanently delete unit SN: ${unit.serial_number}? This cannot be undone.`,
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
                            ...(onView
                                ? [{ label: "View", icon: Eye, onClick: () => onView(unit) }]
                                : []),
                            ...(onInstall &&
                                unit.is_sold &&
                                !unit.installation_service &&
                                unit.unit_status !== "Installed" &&
                                unit.unit_status !== "For Installation"
                                ? [
                                    {
                                        label: "Schedule Installation",
                                        icon: Wrench,
                                        onClick: () => onInstall(unit),
                                    },
                                ]
                                : []),
                            ...(onEdit
                                ? [{ label: "Edit", icon: Edit, onClick: () => onEdit(unit) }]
                                : []),
                            ...(onDelete
                                ? [
                                    {
                                        label: "Archive",
                                        icon: Archive,
                                        onClick: () => onDelete(unit),
                                        confirmText: `Archive Aircon Unit with SN: ${unit.serial_number}?`,
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
