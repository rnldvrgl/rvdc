"use client"

import { DataTableActions } from "@/components/custom/table/components/DataTableActions"
import { GetColumnsProps, Stall } from "@/lib/constants/interface"
import { safeCell } from "@/lib/utils/helpers"
import { formatDate } from "@/lib/utils/helpers/date"
import { ColumnDef } from "@tanstack/react-table"
import { Edit } from "lucide-react"

export function getStallColumns({
    onEdit,
}: GetColumnsProps<Stall>): ColumnDef<Stall>[] {
    return [
        {
            accessorKey: "name",
            header: "Name",
            cell: ({ getValue }) => safeCell(getValue()),
        },
        {
            accessorKey: "location",
            header: "Location",
            cell: ({ getValue }) => safeCell(getValue()),
        },
        {
            accessorKey: "created_at",
            header: "Created At",
            cell: ({ getValue }) => <span className="font-mono tabular-nums">{formatDate(getValue() as Date)}</span>,
        },
        {
            accessorKey: "action",
            header: "Action",
            cell: ({ row }) => {
                const stall = row.original
                return (
                    <DataTableActions
                        items={[
                            {
                                label: "Edit",
                                icon: Edit,
                                onClick: () => onEdit(stall),
                            },
                        ]}
                    />
                )
            },
        },
    ]
}
