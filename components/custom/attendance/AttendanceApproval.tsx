"use client"

import {
  AttendanceTypeBadge,
  AwolBadge,
} from "@/components/custom/attendance/AttendanceBadges"
import { UniformPenaltyCheckboxes } from "@/components/custom/attendance/UniformPenaltyCheckboxes"
import { DataTable } from "@/components/custom/table/DataTable"
import { Button } from "@/components/ui/button"
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
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
  Clock,
  Loader2,
  ShirtIcon,
  XCircle,
} from "lucide-react"
import { useMemo, useState } from "react"

export function AttendanceApproval() {
  const { role } = useCurrentUser()
  const { page, limit, filter, search } = useSearchParameters()
  const [selectedAttendanceId, setSelectedAttendanceId] = useState<
    number | null
  >(null)
  const [drawerAttendance, setDrawerAttendance] =
    useState<DailyAttendance | null>(null)

  // Check if user can approve
  const hasApprovalRights = canApprove(role || "")

  // Fetch pending approvals
  const { data: pendingApprovals, isLoading: approvalsLoading } =
    usePendingAttendanceApprovals({ filter, search: search || undefined })

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

  const columns: ColumnDef<DailyAttendance>[] = useMemo(
    () => [
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
        header: "",
        cell: ({ row }) => {
          const attendance = row.original
          const isBusy = isLoading || selectedAttendanceId === attendance.id
          return (
            <TooltipProvider delayDuration={0}>
              <div className="flex justify-end gap-1">
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-8 w-8"
                      onClick={() => setDrawerAttendance(attendance)}
                    >
                      <ShirtIcon className="h-4 w-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Uniform Penalties</TooltipContent>
                </Tooltip>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-8 w-8 text-green-600 hover:text-green-700 hover:bg-green-100"
                      disabled={isBusy}
                      onClick={() => handleApprove(attendance.id)}
                    >
                      {selectedAttendanceId === attendance.id &&
                      approveAttendance.isPending ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <CheckCircle className="h-4 w-4" />
                      )}
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Approve</TooltipContent>
                </Tooltip>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-8 w-8 text-red-600 hover:text-red-700 hover:bg-red-100"
                      disabled={isBusy}
                      onClick={() => handleReject(attendance.id)}
                    >
                      {selectedAttendanceId === attendance.id &&
                      rejectAttendance.isPending ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <XCircle className="h-4 w-4" />
                      )}
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Reject</TooltipContent>
                </Tooltip>
              </div>
            </TooltipProvider>
          )
        },
      },
    ],
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [isLoading, selectedAttendanceId],
  )

  // Slice array data for the current page (DataTable uses manualPagination)
  const paginatedData = useMemo(() => {
    const all = pendingApprovals ?? []
    const start = (page - 1) * limit
    const sliced = all.slice(start, start + limit)
    return {
      count: all.length,
      next: start + limit < all.length ? "next" : null,
      previous: page > 1 ? "prev" : null,
      results: sliced,
    }
  }, [pendingApprovals, page, limit])

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

      {/* Uniform Penalty Drawer */}
      <Drawer
        direction="right"
        open={!!drawerAttendance}
        onOpenChange={(open) => {
          if (!open) setDrawerAttendance(null)
        }}
      >
        <DrawerContent>
          <DrawerHeader>
            <DrawerTitle>Uniform Penalties</DrawerTitle>
            <DrawerDescription>
              {drawerAttendance?.employee_name} —{" "}
              {drawerAttendance && formatDate(drawerAttendance.date)}
            </DrawerDescription>
          </DrawerHeader>
          <div className="p-4">
            {drawerAttendance && (
              <UniformPenaltyCheckboxes attendance={drawerAttendance} />
            )}
          </div>
          <DrawerFooter>
            <DrawerClose asChild>
              <Button variant="outline">Close</Button>
            </DrawerClose>
          </DrawerFooter>
        </DrawerContent>
      </Drawer>
    </>
  )
}
