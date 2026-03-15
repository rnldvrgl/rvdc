"use client"

import { DataTableActions } from "@/components/custom/table/components/DataTableActions"
import { GetColumnsProps } from "@/lib/constants/interface"
import { Employee } from "@/lib/constants/types"
import { safeCell } from "@/lib/utils/helpers"
import { ColumnDef } from "@tanstack/react-table"
import { Edit, Eye, RotateCcw, UserX } from "lucide-react"
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
              onRestore
                ? [
                    {
                      label: "Reactivate",
                      icon: RotateCcw,
                      onClick: () => onRestore(employee),
                      confirmText: `Reactivate ${employee.first_name} ${employee.last_name}?`,
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
                      label: "Deactivate",
                      icon: UserX,
                      onClick: () => onDelete(employee),
                      confirmText: `Deactivate ${employee.first_name} ${employee.last_name}? They will no longer be able to log in or process transactions.`,
                    },
                  ]
            }
          />
        )
      },
    },
  ]
}
