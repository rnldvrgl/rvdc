"use client"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { LeaveRequest } from "@/lib/constants/types"
import { useCurrentUser } from "@/lib/hooks/useCurrentUser"
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
    sick: "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200",
    vacation: "bg-cyan-100 text-cyan-800 dark:bg-cyan-900 dark:text-cyan-200",
    emergency:
      "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200",
    maternity: "bg-pink-100 text-pink-800 dark:bg-pink-900 dark:text-pink-200",
    paternity: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
  }

  return (
    <Badge
      variant="outline"
      className={colors[leaveType] || "bg-gray-100 text-gray-800"}
    >
      {leaveType.charAt(0).toUpperCase() + leaveType.slice(1)}
    </Badge>
  )
}

export function LeaveOverview() {
  const { role, user_id } = useCurrentUser()
  const [selectedLeaveId, setSelectedLeaveId] = useState<number | null>(null)

  const hasApprovalRights = canApprove(role || "")

  // Admin view: Fetch all pending leave approvals
  const { data: pendingLeaves, isLoading: pendingLoading } =
    usePendingLeaveApprovals()

  // Employee view: Fetch own leave requests and balance
  const { data: myLeaves, isLoading: myLeavesLoading } = useLeaveRequests({
    filter: { employee_id: user_id },
  })
  const { data: leaveBalance, isLoading: balanceLoading } = useMyLeaveBalance()

  // Mutations
  const { approveLeave, rejectLeave } = useLeaveRequestMutations()

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
      },
    )
  }

  const handleReject = async (leaveId: number) => {
    setSelectedLeaveId(leaveId)
    await rejectLeave.mutateAsync(
      {
        leave_request_ids: [leaveId],
        reason: "Rejected by manager",
      },
      {
        onSuccess: () => {
          setSelectedLeaveId(null)
        },
      },
    )
  }

  const isLoading = approveLeave.isPending || rejectLeave.isPending

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
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Employee</TableHead>
                  <TableHead>Leave Type</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Reason</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {pendingLeaves?.map((leave: LeaveRequest) => (
                  <TableRow key={leave.id}>
                    <TableCell className="font-medium">
                      {leave.employee_name || "Unknown"}
                    </TableCell>
                    <TableCell>{getLeaveTypeBadge(leave.leave_type)}</TableCell>
                    <TableCell>{formatDate(leave.date)}</TableCell>
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
                          disabled={isLoading || selectedLeaveId === leave.id}
                          onClick={() => handleReject(leave.id)}
                        >
                          {selectedLeaveId === leave.id &&
                          rejectLeave.isPending ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <>
                              <XCircle className="h-4 w-4 mr-1" />
                              Reject
                            </>
                          )}
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    )
  }

  // Employee View
  const myLeavesList = myLeaves?.results || []

  return (
    <div className="space-y-6">
      {/* Leave Balance Card */}
      {leaveBalance && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-lg bg-purple-100 dark:bg-purple-900/30">
                  <Plane className="h-6 w-6 text-purple-600 dark:text-purple-400" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Sick Leave</p>
                  <p className="text-2xl font-bold">
                    {Number(leaveBalance.sick_leave_remaining).toFixed(0) || 0}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    of {leaveBalance.sick_leave_total || 0} days
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-lg bg-orange-100 dark:bg-orange-900/30">
                  <Plane className="h-6 w-6 text-orange-600 dark:text-orange-400" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">
                    Emergency Leave
                  </p>
                  <p className="text-2xl font-bold">
                    {Number(leaveBalance.emergency_leave_remaining).toFixed(
                      0,
                    ) || 0}
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
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Leave Type</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Reason</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {myLeavesList.map((leave: LeaveRequest) => (
                    <TableRow key={leave.id}>
                      <TableCell>
                        {getLeaveTypeBadge(leave.leave_type)}
                      </TableCell>
                      <TableCell>{formatDate(leave.date)}</TableCell>
                      <TableCell>{getLeaveStatusBadge(leave.status)}</TableCell>
                      <TableCell className="max-w-xs truncate">
                        {leave.reason || "—"}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
