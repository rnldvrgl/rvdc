"use client"

import { LeaveRequestForm } from "@/components/custom/attendance/LeaveRequestForm"
import { DataTablePagination } from "@/components/custom/table/components/DataTablePagination"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Textarea } from "@/components/ui/textarea"
import { LeaveRequest, ShiftPeriod } from "@/lib/constants/types"
import { useCurrentUser } from "@/lib/hooks/useCurrentUser"
import useSearchParameters from "@/lib/hooks/useSearchParameters"
import { useLeaveRequestMutations } from "@/lib/mutations/useAttendanceMutations"
import {
  useLeaveRequests,
  useMyLeaveBalance,
  usePendingLeaveApprovals,
} from "@/lib/queries/useAttendance"
import { canApprove, formatAttendanceDate } from "@/lib/utils/attendance"
import {
  CheckCircle,
  Clock,
  FileText,
  Loader2,
  Pencil,
  Plane,
  XCircle,
} from "lucide-react"
import { useState } from "react"

const getLeaveStatusBadge = (status: string) => {
  switch (status) {
    case "PENDING":
      return (
        <Badge
          variant="outline"
          className="bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200"
        >
          <Clock className="mr-1 h-3 w-3" />
          Pending
        </Badge>
      )
    case "APPROVED":
      return (
        <Badge
          variant="outline"
          className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
        >
          <CheckCircle className="mr-1 h-3 w-3" />
          Approved
        </Badge>
      )
    case "CANCELLED":
      return (
        <Badge
          variant="outline"
          className="bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200"
        >
          <XCircle className="mr-1 h-3 w-3" />
          Cancelled
        </Badge>
      )
    case "REJECTED":
      return (
        <Badge
          variant="outline"
          className="bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200"
        >
          <XCircle className="mr-1 h-3 w-3" />
          Rejected
        </Badge>
      )
    default:
      return <Badge variant="secondary">{status}</Badge>
  }
}

const getLeaveTypeBadge = (leaveType: string) => {
  const colors: Record<string, string> = {
    SICK: "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200",
    EMERGENCY:
      "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200",
    SPECIAL: "bg-teal-100 text-teal-800 dark:bg-teal-900 dark:text-teal-200",
  }

  return (
    <Badge
      variant="outline"
      className={colors[leaveType] || "bg-gray-100 text-gray-800"}
    >
      {leaveType.charAt(0).toUpperCase() + leaveType.slice(1) + " LEAVE"}
    </Badge>
  )
}

const formatLeaveDate = (leave: LeaveRequest) => {
  if (
    leave.start_date &&
    leave.end_date &&
    leave.start_date !== leave.end_date
  ) {
    return `${formatAttendanceDate(leave.start_date)} - ${formatAttendanceDate(leave.end_date)}`
  }
  return formatAttendanceDate(leave.start_date || leave.date)
}

const formatLeaveDuration = (leave: LeaveRequest) => {
  const days = parseFloat(leave.days_count || "1")
  if (days === 0.5) {
    return `Half Day (${leave.shift_period === "AM" ? "Morning" : "Afternoon"})`
  }
  if (days === 1) {
    return leave.shift_period === "FULL"
      ? "Full Day"
      : `Half Day (${leave.shift_period === "AM" ? "Morning" : "Afternoon"})`
  }
  return `${days} Day(s)`
}

export function LeaveOverview() {
  const { role, user_id } = useCurrentUser()
  const { filter, page, limit } = useSearchParameters()
  const [selectedLeaveId, setSelectedLeaveId] = useState<number | null>(null)
  const [rejectDialogOpen, setRejectDialogOpen] = useState(false)
  const [rejectReason, setRejectReason] = useState("")
  const [leaveToReject, setLeaveToReject] = useState<number | null>(null)
  const [selectedItems, setSelectedItems] = useState<Set<number>>(new Set())
  const [adminStatusFilter, setAdminStatusFilter] = useState<string>("PENDING")
  const [editDialogOpen, setEditDialogOpen] = useState(false)
  const [leaveToEdit, setLeaveToEdit] = useState<LeaveRequest | null>(null)
  const [editShiftPeriod, setEditShiftPeriod] = useState<ShiftPeriod>("FULL")

  const toggleSelectItem = (id: number) => {
    const newSelected = new Set(selectedItems)
    if (newSelected.has(id)) {
      newSelected.delete(id)
    } else {
      newSelected.add(id)
    }
    setSelectedItems(newSelected)
  }

  const toggleSelectAll = () => {
    if (selectedItems.size === pendingLeaves?.length) {
      setSelectedItems(new Set())
    } else {
      setSelectedItems(new Set(pendingLeaves?.map((l) => l.id) || []))
    }
  }

  const handleBulkApprove = async () => {
    await approveLeave.mutateAsync({
      leave_request_ids: Array.from(selectedItems),
    })
    setSelectedItems(new Set())
  }

  const handleBulkReject = () => {
    // Open reject dialog for bulk rejection
    setLeaveToReject(-1) // Use -1 to indicate bulk operation
    setRejectReason("")
    setRejectDialogOpen(true)
  }

  const hasApprovalRights = canApprove(role || "")

  // Admin - pending (for quick actions) + filtered list
  const { data: pendingLeaves, isLoading: pendingLoading } =
    usePendingLeaveApprovals(
      { filter },
      hasApprovalRights && adminStatusFilter === "PENDING",
    )

  const { data: adminLeavesData, isLoading: adminLeavesLoading } =
    useLeaveRequests(
      {
        filter: {
          ...filter,
          status:
            adminStatusFilter !== "PENDING" ? adminStatusFilter : undefined,
        },
        page,
        limit,
      },
      hasApprovalRights && adminStatusFilter !== "PENDING",
    )

  // Employee
  const { data: myLeavesData, isLoading: myLeavesLoading } = useLeaveRequests(
    {
      filter: { employee_id: user_id },
      page,
      limit,
    },
    !hasApprovalRights && !!user_id,
  )

  const { data: leaveBalance } = useMyLeaveBalance({
    enabled: !hasApprovalRights,
  })
  // Mutations
  const { approveLeave, rejectLeave, cancelLeave, updateLeaveRequest } =
    useLeaveRequestMutations()

  const handleApprove = async (leaveId: number) => {
    setSelectedLeaveId(leaveId)
    try {
      await approveLeave.mutateAsync({
        leave_request_ids: [leaveId],
      })
    } finally {
      setSelectedLeaveId(null)
    }
  }

  const handleRejectClick = (leaveId: number) => {
    setLeaveToReject(leaveId)
    setRejectReason("")
    setRejectDialogOpen(true)
  }

  const handleRejectConfirm = async () => {
    if (!leaveToReject) return

    // Check if bulk operation (leaveToReject === -1)
    const idsToReject =
      leaveToReject === -1 ? Array.from(selectedItems) : [leaveToReject]

    try {
      await rejectLeave.mutateAsync({
        leave_request_ids: idsToReject,
        reason: rejectReason || "Rejected by manager",
      })
      setRejectDialogOpen(false)
      setLeaveToReject(null)
      setRejectReason("")
      if (leaveToReject === -1) {
        setSelectedItems(new Set())
      }
    } catch {
      setRejectDialogOpen(false)
      setLeaveToReject(null)
    }
  }

  const handleCancel = async (leaveId: number) => {
    setSelectedLeaveId(leaveId)
    try {
      await cancelLeave.mutateAsync(leaveId)
    } finally {
      setSelectedLeaveId(null)
    }
  }

  const isLoading =
    approveLeave.isPending || rejectLeave.isPending || cancelLeave.isPending

  const handleEditClick = (leave: LeaveRequest) => {
    setLeaveToEdit(leave)
    setEditShiftPeriod(leave.shift_period)
    setEditDialogOpen(true)
  }

  const handleEditConfirm = async () => {
    if (!leaveToEdit) return
    const isHalfDay = editShiftPeriod !== "FULL"
    await updateLeaveRequest.mutateAsync({
      id: leaveToEdit.id,
      data: {
        is_half_day: isHalfDay,
        shift_period: editShiftPeriod,
      },
    })
    setEditDialogOpen(false)
    setLeaveToEdit(null)
  }

  // Shared Edit & Reject dialogs
  const editDialog = (
    <Dialog
      open={editDialogOpen}
      onOpenChange={setEditDialogOpen}
    >
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>Edit Leave Duration</DialogTitle>
          <DialogDescription>
            {leaveToEdit && (
              <>
                {leaveToEdit.employee_name} &mdash;{" "}
                {formatLeaveDate(leaveToEdit)}
              </>
            )}
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div className="space-y-2">
            <Label>Duration</Label>
            <Select
              value={editShiftPeriod}
              onValueChange={(v) => setEditShiftPeriod(v as ShiftPeriod)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="FULL">Full Day</SelectItem>
                <SelectItem value="AM">
                  Half Day &mdash; Morning (on leave AM)
                </SelectItem>
                <SelectItem value="PM">
                  Half Day &mdash; Afternoon (on leave PM)
                </SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => setEditDialogOpen(false)}
            disabled={updateLeaveRequest.isPending}
          >
            Cancel
          </Button>
          <Button
            onClick={handleEditConfirm}
            disabled={updateLeaveRequest.isPending}
          >
            {updateLeaveRequest.isPending ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Saving...
              </>
            ) : (
              "Save Changes"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )

  const rejectDialog = (
    <Dialog
      open={rejectDialogOpen}
      onOpenChange={setRejectDialogOpen}
    >
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Reject Leave Request</DialogTitle>
          <DialogDescription>
            Please provide a reason for rejecting this leave request.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="reject-reason">Rejection Reason</Label>
            <Textarea
              id="reject-reason"
              placeholder="Enter reason for rejection..."
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              rows={4}
            />
          </div>
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
            onClick={handleRejectConfirm}
            disabled={rejectLeave.isPending}
          >
            {rejectLeave.isPending ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Rejecting...
              </>
            ) : (
              "Reject Leave"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )

  // Admin View
  if (hasApprovalRights) {
    const showingPending = adminStatusFilter === "PENDING"
    const adminLeaves = showingPending
      ? pendingLeaves || []
      : adminLeavesData?.results || []
    const adminLoading = showingPending ? pendingLoading : adminLeavesLoading
    const adminTotalCount = showingPending
      ? pendingLeaves?.length || 0
      : adminLeavesData?.count || 0
    const adminHasNext = !showingPending && !!adminLeavesData?.next
    const adminHasPrev = !showingPending && !!adminLeavesData?.previous

    if (adminLoading) {
      return (
        <Card>
          <CardHeader className="border-b">
            <CardTitle className="flex items-center gap-2">
              <Plane className="h-5 w-5" />
              Leave Requests
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex justify-center py-6">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          </CardContent>
        </Card>
      )
    }

    return (
      <Card>
        <CardHeader className="pb-4">
          <div className="flex flex-col gap-3 md:gap-4">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-lg bg-slate-100 dark:bg-slate-800">
                  <Plane className="h-3.5 md:h-4 w-3.5 md:w-4 text-slate-600 dark:text-slate-400" />
                </div>
                <CardTitle className="text-sm md:text-base lg:text-lg font-semibold">
                  Leave Requests
                </CardTitle>
              </div>
              <div className="flex items-center gap-2">
                <Select
                  value={adminStatusFilter}
                  onValueChange={(v) => {
                    setAdminStatusFilter(v)
                    setSelectedItems(new Set())
                  }}
                >
                  <SelectTrigger className="h-8 w-[140px] text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="PENDING">Pending</SelectItem>
                    <SelectItem value="APPROVED">Approved</SelectItem>
                    <SelectItem value="REJECTED">Rejected</SelectItem>
                    <SelectItem value="CANCELLED">Cancelled</SelectItem>
                  </SelectContent>
                </Select>
                <Badge
                  variant="secondary"
                  className="text-xs"
                >
                  {adminTotalCount} {adminStatusFilter.toLowerCase()}
                </Badge>
              </div>
            </div>
            {showingPending && selectedItems.size > 0 && (
              <div className="flex items-center gap-1.5 md:gap-2 flex-wrap">
                <span className="text-xs md:text-sm text-muted-foreground">
                  {selectedItems.size} selected
                </span>
                <Button
                  size="sm"
                  variant="outline"
                  className="text-green-600 hover:text-green-700 hover:bg-green-50 h-8 text-xs md:text-sm"
                  onClick={handleBulkApprove}
                  disabled={isLoading}
                >
                  <CheckCircle className="h-3.5 w-3.5 md:h-4 md:w-4 mr-1" />
                  <span className="hidden sm:inline">Approve </span>Selected
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  className="text-red-600 hover:text-red-700 hover:bg-red-50 h-8 text-xs md:text-sm"
                  onClick={handleBulkReject}
                  disabled={isLoading}
                >
                  <XCircle className="h-3.5 w-3.5 md:h-4 md:w-4 mr-1" />
                  <span className="hidden sm:inline">Reject </span>Selected
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => setSelectedItems(new Set())}
                  className="h-8 text-xs md:text-sm"
                >
                  Clear
                </Button>
              </div>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {adminLeaves.length === 0 ? (
            <div className="text-center py-6 text-muted-foreground">
              No {adminStatusFilter.toLowerCase()} leave requests.
            </div>
          ) : (
            <>
              <div className="overflow-x-auto -mx-6 px-6 md:mx-0 md:px-0">
                <div className="rounded-md border min-w-[700px]">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        {showingPending && (
                          <TableHead className="w-10">
                            <Checkbox
                              checked={
                                selectedItems.size === adminLeaves.length &&
                                adminLeaves.length > 0
                              }
                              onCheckedChange={toggleSelectAll}
                            />
                          </TableHead>
                        )}
                        <TableHead>Employee</TableHead>
                        <TableHead>Leave Type</TableHead>
                        <TableHead>Date</TableHead>
                        <TableHead>Duration</TableHead>
                        {!showingPending && <TableHead>Status</TableHead>}
                        <TableHead>Reason</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {adminLeaves.map((leave: LeaveRequest) => (
                        <TableRow key={leave.id}>
                          {showingPending && (
                            <TableCell>
                              <Checkbox
                                checked={selectedItems.has(leave.id)}
                                onCheckedChange={() =>
                                  toggleSelectItem(leave.id)
                                }
                              />
                            </TableCell>
                          )}
                          <TableCell className="font-medium">
                            {leave.employee_name || "Unknown"}
                          </TableCell>
                          <TableCell>
                            {getLeaveTypeBadge(leave.leave_type)}
                          </TableCell>
                          <TableCell>{formatLeaveDate(leave)}</TableCell>
                          <TableCell>{formatLeaveDuration(leave)}</TableCell>
                          {!showingPending && (
                            <TableCell>
                              {getLeaveStatusBadge(leave.status)}
                            </TableCell>
                          )}
                          <TableCell className="max-w-xs truncate">
                            {leave.reason || "—"}
                          </TableCell>
                          <TableCell>
                            <div className="flex justify-end gap-1">
                              {showingPending && (
                                <>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    className="text-green-600 hover:text-green-700 hover:bg-green-50"
                                    disabled={
                                      isLoading || selectedLeaveId === leave.id
                                    }
                                    onClick={() => handleApprove(leave.id)}
                                  >
                                    {selectedLeaveId === leave.id &&
                                    approveLeave.isPending ? (
                                      <Loader2 className="h-4 w-4 animate-spin" />
                                    ) : (
                                      <>
                                        <CheckCircle className="h-4 w-4 mr-1" />
                                        Approve
                                      </>
                                    )}
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    className="text-red-600 hover:text-red-700 hover:bg-red-50"
                                    disabled={isLoading}
                                    onClick={() => handleRejectClick(leave.id)}
                                  >
                                    <XCircle className="h-4 w-4 mr-1" />
                                    Reject
                                  </Button>
                                </>
                              )}
                              {(leave.status === "APPROVED" ||
                                leave.status === "PENDING") && (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => handleEditClick(leave)}
                                >
                                  <Pencil className="h-4 w-4 mr-1" />
                                  Edit
                                </Button>
                              )}
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </div>

              {!showingPending && adminTotalCount > 0 && (
                <div className="mt-4">
                  <DataTablePagination
                    hasNextPage={adminHasNext}
                    hasPrevPage={adminHasPrev}
                    count={adminTotalCount}
                  />
                </div>
              )}
            </>
          )}

          {rejectDialog}
          {editDialog}
        </CardContent>
      </Card>
    )
  }

  // Employee View
  const myLeavesList = myLeavesData?.results || []
  const hasNextPage = !!myLeavesData?.next
  const hasPrevPage = !!myLeavesData?.previous
  const totalCount = myLeavesData?.count || 0

  return (
    <div className="space-y-6">
      {/* Leave Balance Card */}
      {leaveBalance && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card>
            <CardContent>
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-lg bg-purple-100 dark:bg-purple-900/30">
                  <Plane className="h-6 w-6 text-purple-600 dark:text-purple-400" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Sick Leave</p>
                  <p className="text-2xl font-bold">
                    {leaveBalance.sick_leave_remaining || 0}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    of {leaveBalance.sick_leave_total || 0} days
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent>
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-lg bg-orange-100 dark:bg-orange-900/30">
                  <Plane className="h-6 w-6 text-orange-600 dark:text-orange-400" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">
                    Emergency Leave
                  </p>
                  <p className="text-2xl font-bold">
                    {leaveBalance.emergency_leave_remaining || 0}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    of {leaveBalance.emergency_leave_total || 0} days
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* My Leave Requests */}
      <Card>
        <CardHeader className="pb-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-lg bg-slate-100 dark:bg-slate-800">
                <FileText className="h-3.5 md:h-4 w-3.5 md:w-4 text-slate-600 dark:text-slate-400" />
              </div>
              <CardTitle className="text-sm md:text-base lg:text-lg font-semibold">
                My Leave Requests
              </CardTitle>
            </div>
            <LeaveRequestForm />
          </div>
        </CardHeader>
        <CardContent>
          {myLeavesLoading ? (
            <div className="flex justify-center py-6">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : myLeavesList.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-3 py-10 text-center">
              <div className="flex items-center justify-center size-14 rounded-xl bg-muted/60 text-muted-foreground">
                <Plane className="size-7" />
              </div>
              <div className="space-y-1">
                <p className="text-base font-medium text-foreground">
                  No leave requests found
                </p>
                <p className="text-sm text-muted-foreground">
                  Submit a new leave request to see it here
                </p>
              </div>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto -mx-6 px-6 md:mx-0 md:px-0">
                <div className="rounded-md border min-w-[700px]">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Leave Type</TableHead>
                        <TableHead>Date</TableHead>
                        <TableHead>Duration</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Reason</TableHead>
                        <TableHead>Rejection Reason</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {myLeavesList.map((leave: LeaveRequest) => (
                        <TableRow key={leave.id}>
                          <TableCell>
                            {getLeaveTypeBadge(leave.leave_type)}
                          </TableCell>
                          <TableCell>{formatLeaveDate(leave)}</TableCell>
                          <TableCell>{formatLeaveDuration(leave)}</TableCell>
                          <TableCell>
                            {getLeaveStatusBadge(leave.status)}
                          </TableCell>
                          <TableCell className="max-w-xs truncate">
                            {leave.reason || "—"}
                          </TableCell>
                          <TableCell className="max-w-xs truncate">
                            {leave.rejection_reason || "—"}
                          </TableCell>
                          <TableCell>
                            {leave.status === "PENDING" ? (
                              <Button
                                size="sm"
                                variant="outline"
                                className="text-red-600 hover:text-red-700 hover:bg-red-50"
                                disabled={
                                  isLoading && selectedLeaveId === leave.id
                                }
                                onClick={() => handleCancel(leave.id)}
                              >
                                {selectedLeaveId === leave.id &&
                                cancelLeave.isPending ? (
                                  <Loader2 className="h-4 w-4 animate-spin" />
                                ) : (
                                  <>
                                    <XCircle className="h-4 w-4 mr-1" />
                                    Cancel
                                  </>
                                )}
                              </Button>
                            ) : (
                              "—"
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </div>

              {/* Pagination */}
              {totalCount > 0 && (
                <div className="mt-4">
                  <DataTablePagination
                    hasNextPage={hasNextPage}
                    hasPrevPage={hasPrevPage}
                    count={totalCount}
                  />
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
