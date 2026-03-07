"use client"

import {
  AttendanceTypeBadge,
  AwolBadge,
} from "@/components/custom/attendance/AttendanceBadges"
import { UniformPenaltyCheckboxes } from "@/components/custom/attendance/UniformPenaltyCheckboxes"
import { DataTable } from "@/components/custom/table/DataTable"
import { Button } from "@/components/ui/button"
import { DailyAttendance } from "@/lib/constants/types"
import { useCurrentUser } from "@/lib/hooks/useCurrentUser"
import useSearchParameters from "@/lib/hooks/useSearchParameters"
import { useAttendanceMutations } from "@/lib/mutations/useAttendanceMutations"
import { usePendingAttendanceApprovals } from "@/lib/queries/useAttendance"
import { canApprove, formatDate, formatTime } from "@/lib/utils/attendance"
import { formatMinutesToHours } from "@/lib/utils/helpers"
import { ColumnDef } from "@tanstack/react-table"
import {
  AlertTriangle,
  CheckCircle,
  ChevronDown,
  ChevronRight,
  Clock,
  Loader2,
  XCircle,
} from "lucide-react"
import { Fragment, useMemo, useState } from "react"

export function AttendanceApproval() {
  const { role } = useCurrentUser()
  const { filter } = useSearchParameters()
  const [selectedAttendanceId, setSelectedAttendanceId] = useState<
    number | null
  >(null)
  const [expandedRows, setExpandedRows] = useState<Set<number>>(new Set())

  // Check if user can approve
  const hasApprovalRights = canApprove(role || "")

  // Fetch pending approvals
  const { data: pendingApprovals, isLoading: approvalsLoading } =
    usePendingAttendanceApprovals({ filter })

  // Mutations
  const { approveAttendance, rejectAttendance } = useAttendanceMutations()

  const isLoading = approveAttendance.isPending || rejectAttendance.isPending

  const handleApprove = async (attendanceId: number) => {
    setSelectedAttendanceId(attendanceId)
    try {
      await approveAttendance.mutateAsync({
        attendance_ids: [attendanceId],
      })
      setSelectedAttendanceId(null)
    } catch {
      setSelectedAttendanceId(null)
    }
  }

  const handleReject = async (attendanceId: number) => {
    setSelectedAttendanceId(attendanceId)
    try {
      await rejectAttendance.mutateAsync({
        attendance_ids: [attendanceId],
      })
      setSelectedAttendanceId(null)
    } catch {
      setSelectedAttendanceId(null)
    }
  }

  const handleBulkApprove = async (rows: DailyAttendance[]) => {
    try {
      await approveAttendance.mutateAsync({
        attendance_ids: rows.map((r) => r.id),
      })
    } catch {
      // Error is handled by useApiMutation
    }
  }

  const handleBulkReject = async (rows: DailyAttendance[]) => {
    try {
      await rejectAttendance.mutateAsync({
        attendance_ids: rows.map((r) => r.id),
      })
    } catch {
      // Error is handled by useApiMutation
    }
  }

  const toggleRow = (attendanceId: number) => {
    const newExpanded = new Set(expandedRows)
    if (newExpanded.has(attendanceId)) {
      newExpanded.delete(attendanceId)
    } else {
      newExpanded.add(attendanceId)
    }
    setExpandedRows(newExpanded)
  }

  const columns: ColumnDef<DailyAttendance>[] = useMemo(
    () => [
      {
        id: "expand",
        header: "",
        cell: ({ row }) => (
          <Button
            variant="ghost"
            size="sm"
            className="h-8 w-8 p-0"
            onClick={(e) => {
              e.stopPropagation()
              toggleRow(row.original.id)
            }}
          >
            {expandedRows.has(row.original.id) ? (
              <ChevronDown className="h-4 w-4" />
            ) : (
              <ChevronRight className="h-4 w-4" />
            )}
          </Button>
        ),
        enableSorting: false,
      },
      {
        accessorKey: "employee_name",
        header: "Employee",
        cell: ({ row }) => {
          const attendance = row.original
          return (
            <div className="space-y-1">
              <div className="font-medium">
                {attendance.employee_name || "Unknown"}
              </div>
              {attendance.is_awol && (
                <AwolBadge
                  isAwol={attendance.is_awol}
                  consecutiveAbsences={attendance.consecutive_absences}
                />
              )}
            </div>
          )
        },
      },
      {
        accessorKey: "date",
        header: "Date",
        cell: ({ row }) => formatDate(row.original.date),
      },
      {
        accessorKey: "clock_in",
        header: "Clock In",
        cell: ({ row }) => {
          const attendance = row.original
          const clockInTime = attendance.clock_in
            ? formatTime(attendance.clock_in)
            : "—"
          return (
            <div>
              {clockInTime}
              {attendance.is_late && (
                <div className="text-xs text-amber-600 flex items-center gap-1 mt-1">
                  <AlertTriangle className="h-3 w-3" />
                  Late {formatMinutesToHours(attendance.late_minutes)}
                </div>
              )}
            </div>
          )
        },
      },
      {
        accessorKey: "clock_out",
        header: "Clock Out",
        cell: ({ row }) =>
          row.original.clock_out ? formatTime(row.original.clock_out) : "—",
      },
      {
        accessorKey: "paid_hours",
        header: "Hours",
        cell: ({ row }) => {
          const attendance = row.original
          return (
            <div>
              {attendance.paid_hours || "—"}
              {attendance.late_penalty_amount &&
                parseFloat(attendance.late_penalty_amount) > 0 && (
                  <div className="text-xs text-red-600 mt-1">
                    -₱{attendance.late_penalty_amount}
                  </div>
                )}
              {attendance.uniform_penalty_amount &&
                parseFloat(attendance.uniform_penalty_amount) > 0 && (
                  <div className="text-xs text-red-600 mt-1">
                    Uniform: -₱{attendance.uniform_penalty_amount}
                  </div>
                )}
            </div>
          )
        },
      },
      {
        accessorKey: "attendance_type",
        header: "Status",
        cell: ({ row }) => (
          <AttendanceTypeBadge type={row.original.attendance_type} />
        ),
      },
      {
        accessorKey: "notes",
        header: "Notes",
        cell: ({ row }) => (
          <span className="max-w-xs truncate block">
            {row.original.notes || "—"}
          </span>
        ),
      },
      {
        id: "actions",
        header: "Actions",
        cell: ({ row }) => {
          const attendance = row.original
          return (
            <div className="flex justify-end gap-2">
              <Button
                size="sm"
                variant="outline"
                className="text-green-600 hover:text-green-700 hover:bg-green-50"
                disabled={isLoading || selectedAttendanceId === attendance.id}
                onClick={() => handleApprove(attendance.id)}
              >
                {selectedAttendanceId === attendance.id &&
                approveAttendance.isPending ? (
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
                disabled={isLoading || selectedAttendanceId === attendance.id}
                onClick={() => handleReject(attendance.id)}
              >
                {selectedAttendanceId === attendance.id &&
                rejectAttendance.isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <>
                    <XCircle className="h-4 w-4 mr-1" />
                    Reject
                  </>
                )}
              </Button>
            </div>
          )
        },
      },
    ],
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [expandedRows, isLoading, selectedAttendanceId],
  )

  // Wrap array data into PaginatedResult format for DataTable
  const paginatedData = useMemo(
    () => ({
      count: pendingApprovals?.length ?? 0,
      next: null,
      previous: null,
      results: pendingApprovals ?? [],
    }),
    [pendingApprovals],
  )

  if (!hasApprovalRights) {
    return null
  }

  return (
    <>
      <DataTable<DailyAttendance, unknown>
        title="Pending Attendance Approvals"
        description={`${pendingApprovals?.length ?? 0} pending`}
        isLoading={approvalsLoading}
        columns={columns}
        data={paginatedData}
        enableRowSelection
        bulkActions={[
          {
            label: "Approve Selected",
            icon: CheckCircle,
            variant: "outline",
            onClick: handleBulkApprove,
          },
          {
            label: "Reject Selected",
            icon: XCircle,
            variant: "destructive",
            onClick: handleBulkReject,
          },
        ]}
        withoutDateRangeFilter
        emptyIcon={Clock}
        emptyTitle="No pending attendance records"
        emptyDescription="No pending attendance records to review."
      />

      {/* Expanded Uniform Penalty rows rendered below the table */}
      {pendingApprovals?.map(
        (attendance) =>
          expandedRows.has(attendance.id) && (
            <Fragment key={`uniform-${attendance.id}`}>
              <div className="border rounded-md p-4 -mt-2 mb-2 bg-muted/20">
                <p className="text-sm font-medium mb-2">
                  Uniform Penalties — {attendance.employee_name}
                </p>
                <UniformPenaltyCheckboxes attendance={attendance} />
              </div>
            </Fragment>
          ),
      )}
    </>
  )
}
