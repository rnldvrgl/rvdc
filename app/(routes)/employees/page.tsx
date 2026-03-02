"use client"

import { getEmployeeColumns } from "@/app/(routes)/employees/columns"
import EntitySheet from "@/components/custom/shared/EntitySheet"
import PageHeader from "@/components/custom/shared/PageHeader"
import { Wrapper } from "@/components/custom/shared/Wrapper"
import { DataTable } from "@/components/custom/table/DataTable"
import EmployeeForm from "@/components/forms/EmployeeForm"
import { Button } from "@/components/ui/button"
import { Employee } from "@/lib/constants/types"
import { useCurrentUser } from "@/lib/hooks/useCurrentUser"
import { useEntitySheet } from "@/lib/hooks/useEntitySheet"
import useSearchParameters from "@/lib/hooks/useSearchParameters"
import { useEmployeeMutations } from "@/lib/mutations/useEmployeeMutations"
import { useEmployees } from "@/lib/queries/useEmployees"
import { Plus, Users } from "lucide-react"
import { useRouter } from "next/navigation"

export default function EmployeesPage() {
  const router = useRouter()
  const { isAdmin } = useCurrentUser()
  const { page, limit, search, ordering, filter } = useSearchParameters()
  const { deleteEmployee } = useEmployeeMutations()
  const { data, isLoading, refetch } = useEmployees({
    page,
    limit,
    search,
    ordering,
    filter,
  })

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

  const columns = getEmployeeColumns({
    onEdit: openEditSheet,
    onDelete: handleDelete,
    onView: handleView,
  })

  return (
    <Wrapper>
      <PageHeader
        icon={Users}
        title="Employee Management"
        description="Manage your staff members, assign roles, and track employee information across all departments."
        breadcrumbs={["Dashboard", "Staff", "Employees"]}
        isAdminOnly
        onRefresh={refetch}
        actionButton={
          isAdmin && (
            <Button onClick={() => openAddSheet()}>
              <Plus className="size-4 mr-2" />
              Add Employee
            </Button>
          )
        }
      />

      {/* Edit Employee Sheet */}
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

      {/* Add Employee Sheet */}
      <EntitySheet<Employee>
        className="min-w-xl"
        open={addOpen}
        onClose={closeAddSheet}
        title="Add Employee"
        description="Fill out the form below to add a new employee."
        withCloseConfirmation
        renderForm={({ forceClose }) => <EmployeeForm onClose={forceClose} />}
      />

      {/* Main Content */}
      <DataTable
        title="Employees"
        description="Manage your staff members and their information"
        isLoading={isLoading}
        columns={columns}
        data={
          data || {
            count: 0,
            next: null,
            previous: null,
            results: [],
          }
        }
        withoutDateRangeFilter
        emptyIcon={Users}
        emptyTitle="No employees found"
        emptyDescription="Add your first employee to manage staff records"
      />
    </Wrapper>
  )
}
