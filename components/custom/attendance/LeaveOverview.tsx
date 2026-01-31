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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Textarea } from "@/components/ui/textarea"
import { LeaveRequest } from "@/lib/constants/types"
import { useCurrentUser } from "@/lib/hooks/useCurrentUser"
import useSearchParameters from "@/lib/hooks/useSearchParameters"
import { useLeaveRequestMutations } from "@/lib/mutations/useAttendanceMutations"
import {
  useLeaveRequests,
  useMyLeaveBalance,
  usePendingLeaveApprovals,
} from "@/lib/queries/useAttendance"
import { canApprove, formatDate } from "@/lib/utils/attendance"
import {
  CheckCircle,
  Clock,
  FileText,
  Loader2,
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

export function LeaveOverview() {
  const { role, user_id } = useCurrentUser()
  const { filter, page, limit } = useSearchParameters()
  const [selectedLeaveId, setSelectedLeaveId] = useState<number | null>(null)
  const [rejectDialogOpen, setRejectDialogOpen] = useState(false)
  const [rejectReason, setRejectReason] = useState("")
  const [leaveToReject, setLeaveToReject] = useState<number | null>(null)
  const [selectedItems, setSelectedItems] = useState<Set<number>>(new Set())

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
    await approveLeave.mutateAsync(
      {
        leave_request_ids: Array.from(selectedItems),
      },
      {
        onSuccess: () => {
          setSelectedItems(new Set())
        },
      },
    )
  }

  const handleBulkReject = () => {
    // Open reject dialog for bulk rejection
    setLeaveToReject(-1) // Use -1 to indicate bulk operation
    setRejectReason("")
    setRejectDialogOpen(true)
  }

  const hasApprovalRights = canApprove(role || "")

  // Admin
  const { data: pendingLeaves, isLoading: pendingLoading } =
    usePendingLeaveApprovals({ filter }, hasApprovalRights)

  // Employee
  const { data: myLeavesData, isLoading: myLeavesLoading } = useLeaveRequests(
    {
      filter: { employee_id: user_id },
      page,
      limit,
    },
    !hasApprovalRights && !!user_id,
  )

  const { data: leaveBalance, isLoading: balanceLoading } = useMyLeaveBalance({
    enabled: !hasApprovalRights,
  })
  // Mutations
  const { approveLeave, rejectLeave, cancelLeave } = useLeaveRequestMutations()

  const handleApprove = async (leaveId: number) => {
    setSelectedLeaveId(leaveId)
    await approveLeave.mutateAsync(
      {
        leave_request_ids: [leaveId],
      },
      {
        onSuccess: () => {
          setSelectedLeaveId(null)
        },
        onError: () => {
          setSelectedLeaveId(null)
        },
      },
    )
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

    await rejectLeave.mutateAsync(
      {
        leave_request_ids: idsToReject,
        reason: rejectReason || "Rejected by manager",
      },
      {
        onSuccess: () => {
          setRejectDialogOpen(false)
          setLeaveToReject(null)
          setRejectReason("")
          if (leaveToReject === -1) {
            setSelectedItems(new Set())
          }
        },
        onError: () => {
          setRejectDialogOpen(false)
          setLeaveToReject(null)
        },
      },
    )
  }

  const handleCancel = async (leaveId: number) => {
    setSelectedLeaveId(leaveId)
    await cancelLeave.mutateAsync(leaveId, {
      onSuccess: () => {
        setSelectedLeaveId(null)
      },
      onError: () => {
        setSelectedLeaveId(null)
      },
    })
  }

  const isLoading =
    approveLeave.isPending || rejectLeave.isPending || cancelLeave.isPending

  // Admin View
  if (hasApprovalRights) {
    if (pendingLoading) {
      return (
        <Card>
          <CardHeader className="border-b">
            <CardTitle className="flex items-center gap-2">
              <Plane className="h-5 w-5" />
              Pending Leave Approvals
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

    if (!pendingLeaves || pendingLeaves.length === 0) {
      return (
        <Card>
          <CardHeader className="border-b">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-lg bg-slate-100 dark:bg-slate-800">
                  <Plane className="h-4 w-4 text-slate-600 dark:text-slate-400" />
                </div>
                <CardTitle className="text-base md:text-lg font-semibold">
                  Pending Leave Approvals
                </CardTitle>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-center py-6 text-muted-foreground">
              No pending leave requests to review.
            </div>
          </CardContent>
        </Card>
      )
    }

    return (
      <Card>
        <CardHeader>
          <div className="flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-lg bg-slate-100 dark:bg-slate-800">
                  <Plane className="h-4 w-4 text-slate-600 dark:text-slate-400" />
                </div>
                <CardTitle className="text-base md:text-lg font-semibold">
                  Pending Leave Approvals
                </CardTitle>
              </div>
              <Badge variant="secondary">{pendingLeaves.length} pending</Badge>
            </div>
            {selectedItems.size > 0 && (
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-sm text-muted-foreground">
                  {selectedItems.size} selected
                </span>
                <Button
                  size="sm"
                  variant="outline"
                  className="text-green-600 hover:text-green-700 hover:bg-green-50"
                  onClick={handleBulkApprove}
                  disabled={isLoading}
                >
                  <CheckCircle className="h-4 w-4 mr-1" />
                  Approve Selected
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  className="text-red-600 hover:text-red-700 hover:bg-red-50"
                  onClick={handleBulkReject}
                  disabled={isLoading}
                >
                  <XCircle className="h-4 w-4 mr-1" />
                  Reject Selected
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => setSelectedItems(new Set())}
                >
                  Clear
                </Button>
              </div>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-10">
                    <Checkbox
                      checked={
                        selectedItems.size === pendingLeaves?.length &&
                        pendingLeaves?.length > 0
                      }
                      onCheckedChange={toggleSelectAll}
                    />
                  </TableHead>
                  <TableHead>Employee</TableHead>
                  <TableHead>Leave Type</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Duration</TableHead>
                  <TableHead>Reason</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {pendingLeaves?.map((leave: LeaveRequest) => (
                  <TableRow key={leave.id}>
                    <TableCell>
                      <Checkbox
                        checked={selectedItems.has(leave.id)}
                        onCheckedChange={() => toggleSelectItem(leave.id)}
                      />
                    </TableCell>
                    <TableCell className="font-medium">
                      {leave.employee_name || "Unknown"}
                    </TableCell>
                    <TableCell>{getLeaveTypeBadge(leave.leave_type)}</TableCell>
                    <TableCell>{formatDate(leave.date)}</TableCell>
                    <TableCell>
                      {leave.shift_period === "FULL"
                        ? "Full Day"
                        : `Half Day (${leave.shift_period === "AM" ? "Morning" : "Afternoon"})`}
                    </TableCell>
                    <TableCell className="max-w-xs truncate">
                      {leave.reason || "—"}
                    </TableCell>
                    <TableCell>
                      <div className="flex justify-end gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          className="text-green-600 hover:text-green-700 hover:bg-green-50"
                          disabled={isLoading || selectedLeaveId === leave.id}
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
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {/* Reject Dialog */}
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
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-lg bg-slate-100 dark:bg-slate-800">
                <FileText className="h-4 w-4 text-slate-600 dark:text-slate-400" />
              </div>
              <CardTitle className="text-base md:text-lg font-semibold">
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
            <div className="text-center py-8 text-muted-foreground">
              <Plane className="h-12 w-12 mx-auto mb-3 opacity-50" />
              <p>No leave requests found.</p>
              <p className="text-sm mt-1">
                Submit a new leave request to see it here.
              </p>
            </div>
          ) : (
            <>
              <div className="rounded-md border">
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
                        <TableCell>{formatDate(leave.date)}</TableCell>
                        <TableCell>
                          {leave.shift_period === "FULL"
                            ? "Full Day"
                            : `Half Day (${leave.shift_period === "AM" ? "Morning" : "Afternoon"})`}
                        </TableCell>
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
