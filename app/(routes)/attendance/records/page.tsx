"use client"

import { getAttendanceColumns } from "@/app/(routes)/attendance/records/columns"
import { ConfirmDialog } from "@/components/custom/shared/ConfirmDialog"
import EntitySheet from "@/components/custom/shared/EntitySheet"
import PageHeader from "@/components/custom/shared/PageHeader"
import { Wrapper } from "@/components/custom/shared/Wrapper"
import DashboardCalendar from "@/components/custom/shared/calendar/DashboardCalendar"
import { DataTable } from "@/components/custom/table/DataTable"
import AttendanceForm from "@/components/forms/AttendanceForm"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import type { DailyAttendance } from "@/lib/constants/types"
import { useEntitySheet } from "@/lib/hooks/useEntitySheet"
import { useNavigation } from "@/lib/hooks/useNavigation"
import useSearchParameters from "@/lib/hooks/useSearchParameters"
import { useAttendanceMutations } from "@/lib/mutations/useAttendanceMutations"
import { useDailyAttendances } from "@/lib/queries/useAttendance"
import { useEmployeeChoices } from "@/lib/queries/useChoices"
import { convertAttendanceForCalendar } from "@/lib/utils/attendance"
import { formatDateToYMD } from "@/lib/utils/helpers"
import {
  CheckCircle2,
  ClipboardList,
  Plus,
  TimerReset,
  TriangleAlert,
  X,
} from "lucide-react"
import { useMemo, useState } from "react"
import { toast } from "sonner"

type AttendanceDraftSeed = {
  date?: Date
  employeeId?: number
}

export default function AttendanceRecordsPage() {
  const searchParams = useSearchParameters()
  const { page, limit, search, ordering, filter } = searchParams
  const { push } = useNavigation()
  const { data: employees = [] } = useEmployeeChoices({
    includeInPayroll: true,
  })
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [attendanceToDelete, setAttendanceToDelete] = useState<number | null>(
    null,
  )
  const [draftSeed, setDraftSeed] = useState<AttendanceDraftSeed>({})
  const [addOpen, setAddOpen] = useState(false)

  const { data, isLoading, refetch } = useDailyAttendances({
    page,
    limit,
    search,
    ordering,
    filter,
  })

  const { data: calendarData } = useDailyAttendances({
    limit: 1000,
    ordering: "-date",
    filter: {
      employee_id: filter?.employee_id,
      status: filter?.status,
    },
  })

  const { approveAttendance, rejectAttendance, deleteAttendance } =
    useAttendanceMutations()

  const {
    entityState: { open: editOpen, entity },
    openEntity: openEdit,
    closeEntity: closeEdit,
  } = useEntitySheet<DailyAttendance>()

  const employeeOptions = useMemo(
    () =>
      employees.map((employee) => ({
        label: employee.full_name,
        value: String(employee.id),
      })),
    [employees],
  )

  const filters = useMemo(
    () => [
      {
        key: "employee_id",
        label: "Employee",
        options: employeeOptions,
      },
      {
        key: "status",
        label: "Status",
        options: [
          { label: "Pending", value: "PENDING" },
          { label: "Approved", value: "APPROVED" },
          { label: "Rejected", value: "REJECTED" },
        ],
      },
      {
        key: "attendance_type",
        label: "Type",
        options: [
          { label: "Full Day", value: "FULL_DAY" },
          { label: "Half Day", value: "HALF_DAY" },
          { label: "Partial", value: "PARTIAL" },
          { label: "Absent", value: "ABSENT" },
          { label: "Leave", value: "LEAVE" },
          { label: "Shop Closed", value: "SHOP_CLOSED" },
          { label: "Invalid", value: "INVALID" },
        ],
      },
    ],
    [employeeOptions],
  )

  const orderingOptions = [
    { label: "Date (Newest)", value: "-date" },
    { label: "Date (Oldest)", value: "date" },
    { label: "Employee (A-Z)", value: "employee__first_name" },
    { label: "Employee (Z-A)", value: "-employee__first_name" },
    { label: "Status", value: "status" },
  ]

  const calendarAttendances = useMemo(
    () => convertAttendanceForCalendar(calendarData?.results || []),
    [calendarData?.results],
  )

  const stats = useMemo(() => {
    const records = data?.results || []
    return {
      total: records.length,
      pending: records.filter((record) => record.status === "PENDING").length,
      approved: records.filter((record) => record.status === "APPROVED").length,
      late: records.filter((record) => record.is_late).length,
    }
  }, [data?.results])

  const handleDelete = (id: number) => {
    setAttendanceToDelete(id)
    setDeleteDialogOpen(true)
  }

  const confirmDelete = async () => {
    if (!attendanceToDelete) return

    await deleteAttendance.mutateAsync(attendanceToDelete)
    setDeleteDialogOpen(false)
    setAttendanceToDelete(null)
  }

  const openCreateSheet = (seed?: AttendanceDraftSeed) => {
    setDraftSeed(seed || {})
    setAddOpen(true)
  }

  const selectedDate = filter?.date

  const handleDateClick = (date: Date) => {
    const nextDate = formatDateToYMD(date)

    push({
      page: 1,
      limit,
      search,
      ordering,
      filter: {
        ...filter,
        date: nextDate,
      },
    })

    const hasRecordOnDate = (calendarData?.results || []).some(
      (record) => record.date === nextDate,
    )

    if (!hasRecordOnDate) {
      openCreateSheet({
        date,
        employeeId: filter?.employee_id
          ? Number.parseInt(String(filter.employee_id), 10)
          : undefined,
      })
    }
  }

  const clearSelectedDate = () => {
    const nextFilter = { ...filter }
    delete nextFilter.date

    push({
      page: 1,
      limit,
      search,
      ordering,
      filter: nextFilter,
    })
  }

  const columns = getAttendanceColumns({
    onEdit: openEdit,
    onDelete: handleDelete,
    onApprove: (attendance) =>
      approveAttendance.mutate({ attendance_ids: [attendance.id] }),
    onReject: (attendance) =>
      rejectAttendance.mutate({ attendance_ids: [attendance.id] }),
  })

  const handleBulkApprove = async (rows: DailyAttendance[]) => {
    if (rows.length === 0) return
    await approveAttendance.mutateAsync({
      attendance_ids: rows.map((row) => row.id),
    })
  }

  const handleBulkReject = async (rows: DailyAttendance[]) => {
    if (rows.length === 0) return
    await rejectAttendance.mutateAsync({
      attendance_ids: rows.map((row) => row.id),
    })
  }

  const handleBulkArchive = async (rows: DailyAttendance[]) => {
    if (rows.length === 0) return

    await Promise.all(rows.map((row) => deleteAttendance.mutateAsync(row.id)))
    toast.success(`${rows.length} attendance record(s) archived.`)
  }

  return (
    <Wrapper>
      <div className="space-y-4 md:space-y-6">
        <PageHeader
          title="Attendance Records"
          description="Admin workspace for manual daily attendance adjustments, approvals, and cleanup."
          icon={ClipboardList}
          onRefresh={refetch}
          isAdminOnly
          actionButton={
            <Button
              onClick={() =>
                openCreateSheet({
                  date: selectedDate
                    ? new Date(String(selectedDate))
                    : undefined,
                  employeeId: filter?.employee_id
                    ? Number.parseInt(String(filter.employee_id), 10)
                    : undefined,
                })
              }
            >
              <Plus className="mr-2 size-4" />
              Add Attendance
            </Button>
          }
        />

        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Visible Records
              </CardTitle>
            </CardHeader>
            <CardContent className="text-3xl font-semibold">
              {stats.total}
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Pending Review
              </CardTitle>
            </CardHeader>
            <CardContent className="flex items-center justify-between">
              <span className="text-3xl font-semibold">{stats.pending}</span>
              <TimerReset className="h-5 w-5 text-amber-500" />
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Approved
              </CardTitle>
            </CardHeader>
            <CardContent className="flex items-center justify-between">
              <span className="text-3xl font-semibold">{stats.approved}</span>
              <CheckCircle2 className="h-5 w-5 text-emerald-500" />
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Late Records
              </CardTitle>
            </CardHeader>
            <CardContent className="flex items-center justify-between">
              <span className="text-3xl font-semibold">{stats.late}</span>
              <TriangleAlert className="h-5 w-5 text-rose-500" />
            </CardContent>
          </Card>
        </div>

        <Card className="overflow-hidden border-border/60">
          <CardHeader className="flex flex-row items-center justify-between gap-3 border-b border-border/60">
            <div>
              <CardTitle className="text-lg">Calendar</CardTitle>
              <p className="text-sm text-muted-foreground">
                Click a day to focus the table. Empty dates open the
                add-attendance sheet immediately.
              </p>
            </div>

            {selectedDate && (
              <Button
                variant="outline"
                size="sm"
                onClick={clearSelectedDate}
              >
                <X className="mr-2 h-4 w-4" />
                Clear {selectedDate}
              </Button>
            )}
          </CardHeader>
          <CardContent className="p-0">
            <DashboardCalendar
              mode="attendance"
              useCustomData
              attendanceData={calendarAttendances}
              onDateClick={handleDateClick}
              title="Attendance Calendar"
              description=""
              eventTypes={["attendance"]}
            />
          </CardContent>
        </Card>

        <DataTable
          enableVirtualization
          enableRowSelection
          title="Daily Attendance Records"
          description="Full manual CRUD for attendance records with approval actions built in."
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
              icon: X,
              variant: "destructive",
              onClick: handleBulkReject,
            },
            {
              label: "Archive Selected",
              icon: ClipboardList,
              variant: "destructive",
              onClick: handleBulkArchive,
            },
          ]}
          emptyTitle="No attendance records found"
          emptyDescription="Adjust filters or click a date on the calendar to add the first record for that day."
        />
      </div>

      <EntitySheet<DailyAttendance>
        open={editOpen}
        onClose={closeEdit}
        entity={entity}
        title="Edit Attendance"
        description="Adjust the record, then let the backend recompute any metrics tied to clock times."
        withCloseConfirmation
        renderForm={({ forceClose, entity: activeAttendance }) => (
          <AttendanceForm
            attendance={activeAttendance}
            onClose={closeEdit}
            forceClose={forceClose}
          />
        )}
        className="min-w-xl"
      />

      <EntitySheet<AttendanceDraftSeed>
        open={addOpen}
        onClose={() => setAddOpen(false)}
        entity={draftSeed}
        title="Add Attendance"
        description="Create a manual attendance record for a specific employee and day."
        withCloseConfirmation
        renderForm={({ forceClose, entity: seed }) => (
          <AttendanceForm
            initialDate={seed?.date}
            initialEmployeeId={seed?.employeeId}
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
        title="Archive attendance"
        description="This removes the record from the active list without using Django admin."
        confirmText="Archive"
      />
    </Wrapper>
  )
}
