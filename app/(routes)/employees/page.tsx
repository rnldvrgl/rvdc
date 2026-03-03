"use client"

import { getEmployeeColumns } from "@/app/(routes)/employees/columns"
import { ArchiveToggle } from "@/components/custom/shared/ArchiveToggle"
import EntitySheet from "@/components/custom/shared/EntitySheet"
import PageHeader from "@/components/custom/shared/PageHeader"
import { Wrapper } from "@/components/custom/shared/Wrapper"
import { DataTable } from "@/components/custom/table/DataTable"
import EmployeeForm from "@/components/forms/EmployeeForm"
import { Button } from "@/components/ui/button"
import { Employee } from "@/lib/constants/types"
import { useArchive } from "@/lib/hooks/useArchive"
import { useCurrentUser } from "@/lib/hooks/useCurrentUser"
import { useEntitySheet } from "@/lib/hooks/useEntitySheet"
import useSearchParameters from "@/lib/hooks/useSearchParameters"
import { useEmployeeMutations } from "@/lib/mutations/useEmployeeMutations"
import { useEmployees } from "@/lib/queries/useEmployees"
import { Plus, Users } from "lucide-react"
import { useRouter } from "next/navigation"
import { useState } from "react"

const emptyData = {
  count: 0,
  next: null,
  previous: null,
  results: [] as Employee[],
}

export default function EmployeesPage() {
  const router = useRouter()
  const { isAdmin } = useCurrentUser()
  const searchParams = useSearchParameters()
  const { page, limit, search, ordering, filter } = searchParams
  const [isArchived, setIsArchived] = useState(false)

  const { deleteEmployee } = useEmployeeMutations()
  const { data, isLoading, refetch } = useEmployees({
    page,
    limit,
    search,
    ordering,
    filter,
  })

  const { archivedQuery, restoreItem, hardDeleteItem } = useArchive<Employee>(
    "/users/employees/",
    "employees",
    searchParams,
    isArchived,
  )

  // Separate sheets
  const {
    entityState: { open: editOpen, entity },
    openEntity: openEditSheet,
    closeEntity: closeEditSheet,
  } = useEntitySheet<Employee>()

  const {
    entityState: { open: addOpen },
    openEntity: openAddSheet,
    closeEntity: closeAddSheet,
  } = useEntitySheet<Employee>()

  const handleDelete = (employee: Employee) => {
    if (employee.id !== undefined) {
      deleteEmployee.mutate(employee.id)
    }
  }

  const handleView = (employee: Employee) => {
    router.push(`/employees/${employee.id}`)
  }

  const handleRestore = (employee: Employee) => {
    if (employee.id !== undefined) restoreItem.mutate(employee.id)
  }

  const handleHardDelete = (employee: Employee) => {
    if (employee.id !== undefined) hardDeleteItem.mutate(employee.id)
  }

  const columns = isArchived
    ? getEmployeeColumns({
        onEdit: () => {},
        onDelete: () => {},
        onRestore: handleRestore,
        onHardDelete: handleHardDelete,
      })
    : getEmployeeColumns({
        onEdit: openEditSheet,
        onDelete: handleDelete,
        onView: handleView,
      })

  const tableData = isArchived
    ? archivedQuery.data || emptyData
    : data || emptyData

  return (
    <Wrapper>
      <PageHeader
        icon={Users}
        title="Employee Management"
        description="Manage your staff members, assign roles, and track employee information across all departments."
        breadcrumbs={["Dashboard", "Staff", "Employees"]}
        isAdminOnly
        onRefresh={isArchived ? archivedQuery.refetch : refetch}
        actionButton={
          isAdmin && !isArchived ? (
            <Button onClick={() => openAddSheet()}>
              <Plus className="size-4 mr-2" />
              Add Employee
            </Button>
          ) : undefined
        }
      />

      {/* Edit Employee Sheet */}
      {!isArchived && (
        <EntitySheet<Employee>
          className="min-w-xl"
          open={editOpen}
          onClose={closeEditSheet}
          entity={entity}
          title="Edit Employee"
          description="Update the employee details below."
          withCloseConfirmation
          renderForm={({ forceClose, entity }) => (
            <EmployeeForm
              onClose={forceClose}
              employee={entity}
            />
          )}
        />
      )}

      {/* Add Employee Sheet */}
      {!isArchived && (
        <EntitySheet<Employee>
          className="min-w-xl"
          open={addOpen}
          onClose={closeAddSheet}
          title="Add Employee"
          description="Fill out the form below to add a new employee."
          withCloseConfirmation
          renderForm={({ forceClose }) => <EmployeeForm onClose={forceClose} />}
        />
      )}

      <ArchiveToggle
        isArchived={isArchived}
        onToggle={setIsArchived}
        archivedCount={archivedQuery.data?.count}
      />

      {/* Main Content */}
      <DataTable
        title={isArchived ? "Archived Employees" : "Employees"}
        description={
          isArchived
            ? "Restore or permanently delete archived employees"
            : "Manage your staff members and their information"
        }
        isLoading={isArchived ? archivedQuery.isLoading : isLoading}
        columns={columns}
        data={tableData}
        withoutDateRangeFilter
        emptyIcon={Users}
        emptyTitle={isArchived ? "No archived employees" : "No employees found"}
        emptyDescription={
          isArchived
            ? "Archived employees will appear here"
            : "Add your first employee to manage staff records"
        }
      />
    </Wrapper>
  )
}
