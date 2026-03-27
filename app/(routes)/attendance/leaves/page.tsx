"use client"

import { getLeaveColumns } from "@/app/(routes)/attendance/leaves/columns"
import { LeaveOverview } from "@/components/custom/attendance/LeaveOverview"
import { ConfirmDialog } from "@/components/custom/shared/ConfirmDialog"
import EntitySheet from "@/components/custom/shared/EntitySheet"
import PageHeader from "@/components/custom/shared/PageHeader"
import { Wrapper } from "@/components/custom/shared/Wrapper"
import { DataTable } from "@/components/custom/table/DataTable"
import LeaveRequestAdminForm from "@/components/forms/LeaveRequestAdminForm"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { LeaveRequest } from "@/lib/constants/types"
import { useCurrentUser } from "@/lib/hooks/useCurrentUser"
import { useEntitySheet } from "@/lib/hooks/useEntitySheet"
import useSearchParameters from "@/lib/hooks/useSearchParameters"
import { useLeaveRequestMutations } from "@/lib/mutations/useAttendanceMutations"
import { useLeaveRequests } from "@/lib/queries/useAttendance"
import { useEmployeeChoices } from "@/lib/queries/useChoices"
import {
  CheckCircle2,
  Loader2,
  MessageSquareWarning,
  Plane,
  Plus,
  Trash2,
} from "lucide-react"
import { useMemo, useState } from "react"
import { toast } from "sonner"

/**
 * Leave Overview Page
 * Shows different views based on user role:
 * - Admin/Manager: Pending leave approvals + all leave requests
 * - Employee: Personal leave balance + own leave requests
 */
export default function LeavesPage() {
  const { role } = useCurrentUser()
  const isAdminView = role === "admin"
  const searchParams = useSearchParameters()
  const { page, limit, search, ordering, filter } = searchParams
  const { data: employeeChoices = [] } = useEmployeeChoices({
    includeInPayroll: true,
  })
  const { data, isLoading, refetch } = useLeaveRequests(
    {
      page,
      limit,
      search,
      ordering,
      filter,
    },
    isAdminView,
  )

  const { approveLeave, rejectLeave, deleteLeaveRequest } =
    useLeaveRequestMutations()

  const {
    entityState: { open: editOpen, entity },
    openEntity: openEdit,
    closeEntity: closeEdit,
  } = useEntitySheet<LeaveRequest>()

  const [addOpen, setAddOpen] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [leaveToDelete, setLeaveToDelete] = useState<number | null>(null)
  const [rejectDialogOpen, setRejectDialogOpen] = useState(false)
  const [rejectReason, setRejectReason] = useState("")
  const [leaveIdsToReject, setLeaveIdsToReject] = useState<number[]>([])

  const filters = useMemo(
    () => [
      {
        key: "employee_id",
        label: "Employee",
        options: employeeChoices.map((employee) => ({
          label: employee.full_name,
          value: String(employee.id),
        })),
      },
      {
        key: "status",
        label: "Status",
        options: [
          { label: "Pending", value: "PENDING" },
          { label: "Approved", value: "APPROVED" },
          { label: "Rejected", value: "REJECTED" },
          { label: "Cancelled", value: "CANCELLED" },
        ],
      },
      {
        key: "leave_type",
        label: "Leave Type",
        options: [
          { label: "Sick", value: "SICK" },
          { label: "Emergency", value: "EMERGENCY" },
          { label: "Special", value: "SPECIAL" },
        ],
      },
    ],
    [employeeChoices],
  )

  const orderingOptions = [
    { label: "Newest", value: "-created_at" },
    { label: "Oldest", value: "created_at" },
    { label: "Start Date (Newest)", value: "-start_date" },
    { label: "Start Date (Oldest)", value: "start_date" },
    { label: "Employee (A-Z)", value: "employee__first_name" },
  ]

  const handleDelete = (id: number) => {
    setLeaveToDelete(id)
    setDeleteDialogOpen(true)
  }

  const handleOpenRejectDialog = (ids: number[]) => {
    if (ids.length === 0) {
      toast.warning("No leave requests selected for rejection.")
      return
    }

    setLeaveIdsToReject(ids)
    setRejectReason("")
    setRejectDialogOpen(true)
  }

  const handleConfirmReject = async () => {
    if (!leaveIdsToReject.length) return

    await rejectLeave.mutateAsync({
      leave_request_ids: leaveIdsToReject,
      reason: rejectReason.trim() || "Rejected by admin.",
    })

    setRejectDialogOpen(false)
    setRejectReason("")
    setLeaveIdsToReject([])
  }

  const handleBulkApprove = async (rows: LeaveRequest[]) => {
    const pendingIds = rows
      .filter((row) => row.status === "PENDING")
      .map((row) => row.id)

    if (!pendingIds.length) {
      toast.warning("Only pending leave requests can be approved.")
      return
    }

    await approveLeave.mutateAsync({ leave_request_ids: pendingIds })
  }

  const handleBulkReject = (rows: LeaveRequest[]) => {
    const pendingIds = rows
      .filter((row) => row.status === "PENDING")
      .map((row) => row.id)

    handleOpenRejectDialog(pendingIds)
  }

  const handleBulkArchive = async (rows: LeaveRequest[]) => {
    if (!rows.length) return

    await Promise.all(rows.map((row) => deleteLeaveRequest.mutateAsync(row.id)))
    toast.success(`${rows.length} leave request(s) archived.`)
  }

  const confirmDelete = async () => {
    if (!leaveToDelete) return
    await deleteLeaveRequest.mutateAsync(leaveToDelete)
    setDeleteDialogOpen(false)
    setLeaveToDelete(null)
  }

  const columns = getLeaveColumns({
    onEdit: openEdit,
    onDelete: handleDelete,
    onApprove: (leave) =>
      approveLeave.mutate({ leave_request_ids: [leave.id] }),
    onReject: (leave) => handleOpenRejectDialog([leave.id]),
  })

  return (
    <Wrapper>
      <div className="space-y-4 md:space-y-6">
        <PageHeader
          icon={Plane}
          title={isAdminView ? "Leave Management" : "My Leaves"}
          description={
            isAdminView
              ? "Manage employee leave requests without opening Django admin."
              : "View your leave balance and requests"
          }
          breadcrumbs={["Attendance", "Leaves"]}
          onRefresh={isAdminView ? refetch : undefined}
          actionButton={
            isAdminView ? (
              <Button onClick={() => setAddOpen(true)}>
                <Plus className="mr-2 h-4 w-4" />
                Add Leave
              </Button>
            ) : undefined
          }
        />

        {isAdminView && (
          <DataTable
            enableRowSelection
            title="Leave Records"
            description="Create, edit, approve, reject, or archive leave requests."
            columns={columns}
            data={
              data || {
                count: 0,
                next: null,
                previous: null,
                results: [],
              }
            }
            isLoading={isLoading}
            filters={filters}
            orderingOptions={orderingOptions}
            onRefresh={refetch}
            bulkActions={[
              {
                label: "Approve Selected",
                icon: CheckCircle2,
                variant: "outline",
                onClick: handleBulkApprove,
              },
              {
                label: "Reject Selected",
                icon: MessageSquareWarning,
                variant: "destructive",
                onClick: handleBulkReject,
              },
              {
                label: "Archive Selected",
                icon: Trash2,
                variant: "destructive",
                onClick: handleBulkArchive,
              },
            ]}
            emptyTitle="No leave records found"
            emptyDescription="Try changing filters or add a leave request manually."
          />
        )}

        {!isAdminView && <LeaveOverview />}

        {isAdminView && (
          <>
            <EntitySheet<LeaveRequest>
              open={editOpen}
              onClose={closeEdit}
              entity={entity}
              title="Edit Leave Request"
              description="Adjust leave type, date range, half-day period, or reason."
              withCloseConfirmation
              renderForm={({ forceClose, entity: leaveRequest }) => (
                <LeaveRequestAdminForm
                  leaveRequest={leaveRequest}
                  onClose={closeEdit}
                  forceClose={forceClose}
                />
              )}
              className="min-w-xl"
            />

            <EntitySheet
              open={addOpen}
              onClose={() => setAddOpen(false)}
              title="Add Leave Request"
              description="Create a leave request on behalf of an employee."
              withCloseConfirmation
              renderForm={({ forceClose }) => (
                <LeaveRequestAdminForm
                  onClose={() => setAddOpen(false)}
                  forceClose={forceClose}
                />
              )}
              className="min-w-xl"
            />

            <ConfirmDialog
              open={deleteDialogOpen}
              onCancel={() => setDeleteDialogOpen(false)}
              onConfirm={confirmDelete}
              title="Archive leave request"
              description="This removes the leave request from the active list."
              confirmText="Archive"
            />

            <Dialog
              open={rejectDialogOpen}
              onOpenChange={setRejectDialogOpen}
            >
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Reject Leave Request</DialogTitle>
                  <DialogDescription>
                    {leaveIdsToReject.length > 1
                      ? `Provide a rejection reason for ${leaveIdsToReject.length} selected leave requests.`
                      : "Provide a rejection reason for this leave request."}
                  </DialogDescription>
                </DialogHeader>

                <div className="space-y-2 py-2">
                  <Label htmlFor="leave-reject-reason">Rejection Reason</Label>
                  <Textarea
                    id="leave-reject-reason"
                    value={rejectReason}
                    onChange={(event) => setRejectReason(event.target.value)}
                    placeholder="Enter reason for rejection..."
                    rows={4}
                  />
                </div>

                <DialogFooter>
                  <Button
                    variant="outline"
                    onClick={() => setRejectDialogOpen(false)}
                    disabled={rejectLeave.isPending}
                  >
                    Cancel
                  </Button>
                  <Button
                    variant="destructive"
                    onClick={handleConfirmReject}
                    disabled={rejectLeave.isPending}
                  >
                    {rejectLeave.isPending && (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    )}
                    Reject
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </>
        )}
      </div>
    </Wrapper>
  )
}
