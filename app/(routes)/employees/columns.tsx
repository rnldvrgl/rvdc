"use client"

import { DataTableActions } from "@/components/custom/table/components/DataTableActions"
import { GetColumnsProps } from "@/lib/constants/interface"
import { Employee } from "@/lib/constants/types"
import { safeCell } from "@/lib/utils/helpers"
import { ColumnDef } from "@tanstack/react-table"
import { Archive, Edit, Eye, RotateCcw, Trash2 } from "lucide-react"
import Link from "next/link"

export function getEmployeeColumns({
  onEdit,
  onDelete,
  onView,
  onRestore,
  onHardDelete,
}: GetColumnsProps<Employee> & {
  onManageBenefits?: (employee: Employee) => void
  onRestore?: (employee: Employee) => void
  onHardDelete?: (employee: Employee) => void
}): ColumnDef<Employee>[] {
  return [
    {
      accessorKey: "full_name",
      header: "Full Name",
      cell: ({ row }) => {
        const employee = row.original
        const fullName = `${employee.first_name} ${employee.last_name}`
        return (
          <Link
            href={`/employees/${employee.id}`}
            className="font-medium text-primary hover:underline"
          >
            {safeCell(fullName)}
          </Link>
        )
      },
    },
    {
      accessorKey: "role",
      header: "Role",
      cell: ({ getValue }) => {
        const value = getValue<string>()
        return safeCell(value.charAt(0).toUpperCase() + value.slice(1))
      },
    },
    {
      accessorKey: "contact_number",
      header: "Contact Number",
      cell: ({ getValue }) => {
        return safeCell(getValue<string>())
      },
    },
    {
      accessorKey: "address",
      header: "Address",
      cell: ({ getValue }) => {
        return safeCell(getValue<string>())
      },
    },
    {
      accessorKey: "barangay",
      header: "Barangay",
      cell: ({ getValue }) => {
        return safeCell(getValue<string>())
      },
    },
    {
      accessorKey: "city",
      header: "City",
      cell: ({ getValue }) => {
        return safeCell(getValue<string>())
      },
    },
    {
      accessorKey: "province",
      header: "Province",
      cell: ({ getValue }) => {
        return safeCell(getValue<string>())
      },
    },
    {
      accessorKey: "basic_salary",
      header: "Basic Salary",
      cell: ({ getValue }) => {
        return safeCell(getValue<number>())
      },
    },
    {
      accessorKey: "cash_ban_balance",
      header: "Cash Ban Balance",
      cell: ({ getValue }) => {
        const balance = getValue<number>()
        return (
          <span className="font-medium text-green-600">
            ₱{balance.toLocaleString()}
          </span>
        )
      },
    },
    {
      accessorKey: "action",
      header: "Action",
      cell: ({ row }) => {
        const employee = row.original
        return (
          <DataTableActions
            items={
              onRestore && onHardDelete
                ? [
                    {
                      label: "Restore",
                      icon: RotateCcw,
                      onClick: () => onRestore(employee),
                      confirmText: `Restore ${employee.first_name} ${employee.last_name}?`,
                    },
                    {
                      label: "Delete Permanently",
                      icon: Trash2,
                      onClick: () => onHardDelete(employee),
                      destructive: true,
                      confirmText: `Permanently delete ${employee.first_name} ${employee.last_name}?`,
                    },
                  ]
                : [
                    ...(onView
                      ? [
                          {
                            label: "View",
                            icon: Eye,
                            onClick: () => onView(employee),
                          },
                        ]
                      : []),
                    {
                      label: "Edit",
                      icon: Edit,
                      onClick: () => onEdit(employee),
                    },
                    {
                      label: "Archive",
                      icon: Archive,
                      onClick: () => onDelete(employee),
                      confirmText: `Archive ${employee.first_name} ${employee.last_name}?`,
                    },
                  ]
            }
          />
        )
      },
    },
  ]
}
