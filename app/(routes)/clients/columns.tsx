"use client"

import { DataTableActions } from "@/components/custom/table/components/DataTableActions"
import { Badge } from "@/components/ui/badge"
import { GetColumnsProps } from "@/lib/constants/interface"
import { Client } from "@/lib/constants/types"
import { safeCell } from "@/lib/utils/helpers"
import { ColumnDef, Row } from "@tanstack/react-table"
import {
  Archive,
  Ban,
  Edit,
  Eye,
  Merge,
  RotateCcw,
  ShieldCheck,
  Trash2,
} from "lucide-react"
import Link from "next/link"

export function getClientColumns({
  onEdit,
  onDelete,
  onCustomAction,
  onView,
  onRestore,
  onHardDelete,
  onMerge,
}: GetColumnsProps<Client>): ColumnDef<Client>[] {
  return [
    {
      accessorKey: "full_name",
      header: "Name",
      cell: ({ row }) => {
        const client = row.original
        return (
          <Link
            href={`/clients/${client.id}`}
            className="font-medium text-primary hover:underline"
          >
            {safeCell(client.full_name)}
          </Link>
        )
      },
    },
    {
      accessorKey: "contact_number",
      header: "Contact Number",
      cell: ({ getValue }) => safeCell(getValue()),
    },
    {
      accessorKey: "address",
      header: "Address",
      cell: ({ getValue }) => safeCell(getValue()),
    },
    {
      accessorKey: "barangay",
      header: "Barangay",
      cell: ({ getValue }) => safeCell(getValue()),
    },
    {
      accessorKey: "city",
      header: "City",
      cell: ({ getValue }) => safeCell(getValue()),
    },
    {
      accessorKey: "province",
      header: "Province",
      cell: ({ getValue }) => safeCell(getValue()),
    },
    {
      accessorKey: "is_blocklisted",
      header: "Blocklisted",
      cell: ({ row }) => {
        const is_blocklisted = row.original.is_blocklisted
        return (
          <Badge
            variant={is_blocklisted ? "destructive" : "success"}
            className="flex items-center gap-1"
          >
            {is_blocklisted ? (
              <>
                <Ban className="size-3" /> Blocklisted
              </>
            ) : (
              <>
                <ShieldCheck className="size-3" /> Clear
              </>
            )}
          </Badge>
        )
      },
    },
    {
      accessorKey: "action",
      header: "Action",
      cell: ({ row }: { row: Row<Client> }) => {
        const client = row.original
        const is_blocklisted = client.is_blocklisted

        if (onRestore) {
          return (
            <DataTableActions
              items={[
                {
                  label: "Restore",
                  icon: RotateCcw,
                  onClick: () => onRestore(client),
                },
                ...(onHardDelete
                  ? [
                      {
                        label: "Delete Permanently",
                        icon: Trash2,
                        onClick: () => onHardDelete(client),
                        destructive: true,
                        confirmText: `Permanently delete ${safeCell(client.full_name)}? This cannot be undone.`,
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
                label: is_blocklisted
                  ? "Remove from blocklist"
                  : "Add to blocklist",
                icon: is_blocklisted ? ShieldCheck : Ban,
                onClick: () => onCustomAction?.(client),
              },
              {
                label: "View",
                icon: Eye,
                onClick: () => onView?.(client),
              },
              ...(onMerge
                ? [
                    {
                      label: "Merge into another",
                      icon: Merge,
                      onClick: () => onMerge(client),
                    },
                  ]
                : []),
              {
                label: "Edit",
                icon: Edit,
                onClick: () => onEdit(client),
              },
              {
                label: "Archive",
                icon: Archive,
                onClick: () => onDelete(client),
                confirmText: `Archive ${safeCell(client.full_name)}?`,
              },
            ]}
          />
        )
      },
    },
  ]
}
