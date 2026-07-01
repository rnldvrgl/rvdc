import { AnimatedNumber } from "@/components/custom/shared/AnimatedNumber"
import { withTooltipHeader } from "@/components/custom/table/components/ColumnHeaderWithTooltip"
import { DataTableActions } from "@/components/custom/table/components/DataTableActions"
import { Badge } from "@/components/ui/badge"
import { GetColumnsProps, RemittanceRecord } from "@/lib/constants/interface"
import {
    formatCurrency,
    getBoolBadgeVariant,
    getHashedStallBadgeClass,
    safeCell,
} from "@/lib/utils/helpers"
import { formatBackDate, formatDate } from "@/lib/utils/helpers/date"
import { ColumnDef, Row } from "@tanstack/react-table"
import { Edit, Eye, Trash2 } from "lucide-react"

export function getRemittanceColumns({
    role,
    onView,
    onEdit,
    onDelete,
}: GetColumnsProps<RemittanceRecord>): ColumnDef<RemittanceRecord>[] {
    const columns: ColumnDef<RemittanceRecord>[] = [
        ...(role === "admin"
            ? [
                {
                    accessorKey: "stall_data.name",
                    header: withTooltipHeader("Stall", "Market stall name"),
                    cell: ({ row }: { row: Row<RemittanceRecord> }) => {
                        const name = safeCell(row.original.stall_data?.name)
                        return (
                            <Badge className={getHashedStallBadgeClass(name)}>{name}</Badge>
                        )
                    },
                    enableSorting: true,
                },
            ]
            : []),

        {
            accessorKey: "created_at",
            header: withTooltipHeader("Date", "Remittance date"),
            cell: ({ getValue }) =>
                safeCell(
                    getValue()
                        ? formatDate(getValue() as Date, "EEE, MMM dd yyyy")
                        : null,
                ),
            enableSorting: true,
        },

        {
            accessorKey: "total_sales_cash",
            header: withTooltipHeader(
                "Cash Collected",
                "Total cash collected from sales",
            ),
            cell: ({ row }) => (
                <span className="flex items-center gap-1.5">
                    <AnimatedNumber value={Number(row.original.total_sales_cash)} prefix="₱" className="font-medium" />
                    {row.original.manually_adjusted && (
                        <Badge
                            variant="outline"
                            className="text-[10px] px-1 py-0 text-amber-600 border-amber-300"
                        >
                            Adjusted
                        </Badge>
                    )}
                </span>
            ),
            enableSorting: true,
        },

        {
            accessorKey: "cod_for_today",
            header: withTooltipHeader("Drawer In", "Cash left in drawer today (COD)"),
            cell: ({ row }) => {
                return (
                    <AnimatedNumber value={Number(row.original.cod_for_today.cod_amount) || 0} prefix="₱" className="font-medium" />
                )
            }
        },

        {
            accessorKey: "total_expenses",
            header: withTooltipHeader(
                "Expenses",
                "Cash expenses deducted from drawer",
            ),
            cell: ({ getValue }) => {
                return (
                    <AnimatedNumber value={Number(getValue()) || 0} prefix="₱" className="font-medium" />
                )
            },
            enableSorting: true,
        },

        {
            accessorKey: "expected_remittance",
            header: withTooltipHeader(
                "Expected",
                "Cash expected to be remitted: Cash Collected + Drawer In - Expenses",
            ),
            cell: ({ getValue }) => {
                const value = getValue() as number
                return (
                    <AnimatedNumber value={value} prefix="₱" className="font-medium" />
                )
            },
            enableSorting: true,
        },

        {
            accessorKey: "declared_amount",
            header: withTooltipHeader(
                "Declared",
                "Cash physically counted in drawer",
            ),
            cell: ({ getValue }) => {
                const value = getValue() as number
                return (
                    <AnimatedNumber value={value} prefix="₱" className="font-medium" />
                )
            },
        },

        {
            accessorKey: "remitted_amount",
            header: withTooltipHeader("Remitted", "Cash turned over to admin"),
            cell: ({ getValue }) => {
                const value = getValue() as number
                return (
                    <AnimatedNumber value={value} prefix="₱" className="font-medium" />
                )
            },
        },

        {
            accessorKey: "cod_for_next_day",
            header: withTooltipHeader(
                "Drawer Next",
                "Cash reserved for tomorrow’s drawer",
            ),
            cell: ({ getValue }) => {
                const value = getValue() as number
                return (
                    <AnimatedNumber value={value} prefix="₱" className="font-medium" />
                )
            },
        },

        {
            id: "remit_status",
            header: withTooltipHeader(
                "Declared VS Expected",
                "Over, short, or balanced",
            ),
            cell: ({ row }) => {
                const balance = Number(row.original.balance)
                if (balance > 0) {
                    return <Badge variant="warning">Over {formatCurrency(balance)}</Badge>
                }
                if (balance < 0) {
                    return (
                        <Badge variant="destructive">
                            Short {formatCurrency(Math.abs(balance))}
                        </Badge>
                    )
                }
                return <Badge variant="success">Balanced</Badge>
            },
        },

        {
            accessorKey: "is_remitted",
            header: withTooltipHeader(
                "Remitted?",
                "Marked by admin to confirm this remittance was received and verified.",
            ),
            cell: ({ getValue }) => (
                <Badge variant={getBoolBadgeVariant({ status: !!getValue() })}>
                    {getValue() ? "Yes" : "No"}
                </Badge>
            ),
            enableSorting: true,
        },

        {
            id: "action",
            header: "Actions",
            cell: ({ row }) => {
                const actions = [
                    {
                        label: "View",
                        icon: Eye,
                        onClick: () => onView?.(row.original),
                    },
                    ...(row.original.is_remitted
                        ? []
                        : [
                            {
                                label: "Edit",
                                icon: Edit,
                                onClick: () => onEdit?.(row.original),
                            },
                        ]),
                    ...(!row.original.is_remitted || role === "admin"
                        ? [
                            {
                                label: "Delete",
                                icon: Trash2,
                                onClick: () => onDelete?.(row.original),
                                destructive: true,
                                confirmText: `Delete remittance record for ${row.original.stall_data?.name
                                    } (${formatBackDate(new Date(row.original.created_at))})?`,
                            },
                        ]
                        : []),
                ]
                return <DataTableActions items={actions} />
            },
        },
    ]

    return columns
}
