import { DataTableActions } from "@/components/custom/table/components/DataTableActions"
import { Badge } from "@/components/ui/badge"
import { GetColumnsProps, Stock } from "@/lib/constants/interface"
import { getBadgeVariant, safeCell } from "@/lib/utils/helpers"
import { ColumnDef } from "@tanstack/react-table"
import {
    ClipboardCheck,
    Edit,
    PackageMinus,
    PackagePlus,
    Plus,
    RotateCcw,
    Trash2,
} from "lucide-react"

export function getStallStockColumns({
    onEdit,
    onRestock,
    onAddStock,
    onAudit,
    onPullOut,
    onRestore,
    onHardDelete,
    role,
}: GetColumnsProps<Stock>): ColumnDef<Stock>[] {
    const columnMap: Record<string, ColumnDef<Stock>> = {
        item_name: {
            accessorKey: "item_name",
            header: "Item",
            cell: ({ row }) => {
                const { item } = row.original
                return safeCell(item.display_name || item.name)
            },
        },
        item_sku: {
            accessorKey: "item_sku",
            header: "SKU",
            cell: ({ row }) => safeCell(row.original.item.sku),
        },
        category_name: {
            accessorKey: "category_name",
            header: "Category",
            cell: ({ row }) => safeCell(row.original.item.category?.name),
        },
        quantity: {
            accessorKey: "quantity",
            header: "Total Qty",
            cell: ({ row }) => {
                const { quantity, item, track_stock } = row.original
                if (!track_stock)
                    return <span className="text-muted-foreground">—</span>
                return <span className="font-mono tabular-nums">{quantity} {item.unit_of_measure}</span>
            },
        },
        reserved_quantity: {
            accessorKey: "reserved_quantity",
            header: "Reserved",
            cell: ({ row }) => {
                const { reserved_quantity, item, track_stock } = row.original
                if (!track_stock)
                    return <span className="text-muted-foreground">—</span>
                return (
                    <span className="font-mono tabular-nums text-yellow-500 font-medium">
                        {reserved_quantity} {item.unit_of_measure}
                    </span>
                )
            },
        },
        available_quantity: {
            accessorKey: "available_quantity",
            header: "Available",
            cell: ({ row }) => {
                const { available_quantity, item, track_stock } = row.original
                if (!track_stock)
                    return <span className="text-muted-foreground">—</span>
                const isLow = available_quantity === 0
                return (
                    <span
                        className={
                            isLow
                                ? "text-destructive font-semibold"
                                : "text-success font-medium"
                        }
                    >
                        <span className="font-mono tabular-nums">{available_quantity} {item.unit_of_measure}</span>
                    </span>
                )
            },
        },
        low_stock_threshold: {
            accessorKey: "low_stock_threshold",
            header: "Low Threshold",
            cell: ({ row }) => {
                const { low_stock_threshold, item } = row.original
                return <span className="font-mono tabular-nums">{low_stock_threshold} {item.unit_of_measure}</span>
            },
        },
        status: {
            accessorKey: "status",
            header: "Status",
            cell: ({ row }) => {
                const { status, track_stock } = row.original
                if (!track_stock) {
                    return (
                        <Badge
                            variant="outline"
                            className="bg-violet-50 text-violet-700 border-violet-200 dark:bg-violet-900/30 dark:text-violet-300 dark:border-violet-700"
                        >
                            Untracked
                        </Badge>
                    )
                }
                return (
                    <Badge variant={getBadgeVariant(status)}>
                        {status.replace("_", " ")}
                    </Badge>
                )
            },
        },
        action: {
            accessorKey: "action",
            header: "Action",
            cell: ({ row }) => {
                const stock = row.original
                if (onRestore) {
                    return (
                        <DataTableActions
                            items={[
                                {
                                    label: "Restore",
                                    icon: RotateCcw,
                                    onClick: () => onRestore(stock),
                                },
                                ...(onHardDelete
                                    ? [
                                        {
                                            label: "Delete Permanently",
                                            icon: Trash2,
                                            onClick: () => onHardDelete(stock),
                                            destructive: true,
                                            confirmText: `Permanently delete this stock? This cannot be undone.`,
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
                            ...(stock.track_stock
                                ? [
                                    {
                                        label: "Add Stock",
                                        icon: Plus,
                                        onClick: () => onAddStock?.(stock),
                                    },
                                    {
                                        label: "Pull Out",
                                        icon: PackageMinus,
                                        onClick: () => onPullOut?.(stock),
                                    },
                                    ...(role === "admin"
                                        ? [
                                            {
                                                label: "Restock",
                                                icon: PackagePlus,
                                                onClick: () => onRestock?.(stock),
                                            },
                                            {
                                                label: "Audit Stock",
                                                icon: ClipboardCheck,
                                                onClick: () => onAudit?.(stock),
                                            },
                                        ]
                                        : []),
                                ]
                                : []),
                            {
                                label: "Edit",
                                icon: Edit,
                                onClick: () => onEdit(stock),
                            },
                        ]}
                    />
                )
            },
        },
    }

    const roleColumns: Record<string, Array<keyof typeof columnMap>> = {
        admin: [
            "item_name",
            "item_sku",
            "category_name",
            "quantity",
            "reserved_quantity",
            "available_quantity",
            "low_stock_threshold",
            "status",
            "action",
        ],
        manager: [
            "item_name",
            "item_sku",
            "category_name",
            "quantity",
            "reserved_quantity",
            "available_quantity",
            "low_stock_threshold",
            "status",
            "action",
        ],
        clerk: [
            "item_name",
            "item_sku",
            "category_name",
            "quantity",
            "reserved_quantity",
            "available_quantity",
            "low_stock_threshold",
            "status",
            "action",
        ],
    }

    return (roleColumns[role ?? ""] ?? []).map((key) => columnMap[key])
}
