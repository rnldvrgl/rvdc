"use client"

import { getAttendanceColumns } from "@/app/(routes)/attendance/records/columns"
import { MarkAbsentDialog } from "@/components/custom/attendance/MarkAbsentDialog"
import { ConfirmDialog } from "@/components/custom/shared/ConfirmDialog"
import EntitySheet from "@/components/custom/shared/EntitySheet"
import PageHeader from "@/components/custom/shared/PageHeader"
import { Wrapper } from "@/components/custom/shared/Wrapper"
import DashboardCalendar from "@/components/custom/shared/calendar/DashboardCalendar"
import { DataTable } from "@/components/custom/table/DataTable"
import AttendanceForm from "@/components/forms/AttendanceForm"
import { Button } from "@/components/ui/button"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"
import { Skeleton } from "@/components/ui/skeleton"
import type { DailyAttendance } from "@/lib/constants/types"
import { useAttendanceStats } from "@/lib/hooks/useAttendanceStats"
import { useCurrentUser } from "@/lib/hooks/useCurrentUser"
import { useEntitySheet } from "@/lib/hooks/useEntitySheet"
import { useNavigation } from "@/lib/hooks/useNavigation"
import useSearchParameters from "@/lib/hooks/useSearchParameters"
import { useAttendanceMutations } from "@/lib/mutations/useAttendanceMutations"
import { useDailyAttendances } from "@/lib/queries/useAttendance"
import { useEmployeeChoices } from "@/lib/queries/useChoices"
import { convertAttendanceForCalendar } from "@/lib/utils/attendance"
import { formatDateToYMD } from "@/lib/utils/helpers"
import {
    CalendarDays,
    CheckCircle2,
    ChevronDown,
    ChevronUp,
    ClipboardList,
    Filter,
    Plus,
    Users,
    X,
} from "lucide-react"
import { useMemo, useState } from "react"
import { toast } from "sonner"

type AttendanceDraftSeed = {
  date?: Date
  employeeId?: number
}

export default function AttendanceRecordsPage() {
  const { isAdmin } = useCurrentUser()
  const searchParams = useSearchParameters()
  const { page, limit, search, ordering, filter } = searchParams
  const { push } = useNavigation()

  // Calendar toggle
  const [showCalendar, setShowCalendar] = useState(false)

  // CRUD state
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [attendanceToDelete, setAttendanceToDelete] = useState<number | null>(
    null,
  )
  const [draftSeed, setDraftSeed] = useState<AttendanceDraftSeed>({})
  const [addOpen, setAddOpen] = useState(false)

  // Employee choices for table filters
  const { data: employeeChoicesData } = useEmployeeChoices({
    includeInPayroll: true,
  })
  const employeeChoices = useMemo(
    () => employeeChoicesData ?? [],
    [employeeChoicesData],
  )

  // Main table data
  const { data, isLoading, refetch } = useDailyAttendances({
    page,
    limit,
    search,
    ordering,
    filter,
  })

  // Monthly stats
  const now = new Date()
  const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
  const lastDayOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0)

  const { data: monthlyData, isLoading: isLoadingMonthly } =
    useDailyAttendances({
      filter: {
        ...filter,
        date_from: formatDateToYMD(firstDayOfMonth),
        date_to: formatDateToYMD(lastDayOfMonth),
      },
      limit: 1000,
    })

  // Calendar data
  const { data: calendarData } = useDailyAttendances({
    limit: 1000,
    ordering: "-date",
    filter: {
      employee_id: filter?.employee_id,
      status: filter?.status,
      attendance_type: filter?.attendance_type,
    },
  })

  const { approveAttendance, rejectAttendance, deleteAttendance } =
    useAttendanceMutations()

  const {
    entityState: { open: editOpen, entity },
    openEntity: openEdit,
    closeEntity: closeEdit,
  } = useEntitySheet<DailyAttendance>()

  // Stats
  const monthlyRecords = monthlyData?.results || []
  const calendarEvents = convertAttendanceForCalendar(monthlyRecords)
  const stats = useAttendanceStats(monthlyRecords, calendarEvents)

  // Calendar events
  const calendarAttendances = useMemo(
    () => convertAttendanceForCalendar(calendarData?.results || []),
    [calendarData?.results],
  )

  // Table filters
  const employeeOptions = useMemo(
    () =>
      employeeChoices.map((emp) => ({
        label: `${emp.first_name} ${emp.last_name}`,
        value: String(emp.id),
      })),
    [employeeChoices],
  )

  const filters = useMemo(
    () => [
      { key: "employee_id", label: "Employee", options: employeeOptions },
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

  // Handlers
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

  const updateFilter = (key: string, value?: string) => {
    const nextFilter = { ...filter }
    if (!value || value === "all") {
      delete nextFilter[key]
    } else {
      nextFilter[key] = value
    }
    push({ page: 1, limit, search, ordering, filter: nextFilter })
  }

  const selectedDate = filter?.date

  const handleDateClick = (date: Date) => {
    const nextDate = formatDateToYMD(date)
    push({
      page: 1,
      limit,
      search,
      ordering,
      filter: { ...filter, date: nextDate },
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
    push({ page: 1, limit, search, ordering, filter: nextFilter })
  }

  const columns = getAttendanceColumns({
    onEdit: openEdit,
    onDelete: handleDelete,
    onApprove: (a) =>
      approveAttendance.mutate({ attendance_ids: [a.id] }),
    onReject: (a) =>
      rejectAttendance.mutate({ attendance_ids: [a.id] }),
  })

  const handleBulkApprove = async (rows: DailyAttendance[]) => {
    if (rows.length === 0) return
    await approveAttendance.mutateAsync({
      attendance_ids: rows.map((r) => r.id),
    })
  }

  const handleBulkReject = async (rows: DailyAttendance[]) => {
    if (rows.length === 0) return
    await rejectAttendance.mutateAsync({
      attendance_ids: rows.map((r) => r.id),
    })
  }

  const handleBulkArchive = async (rows: DailyAttendance[]) => {
    if (rows.length === 0) return
    await Promise.all(rows.map((r) => deleteAttendance.mutateAsync(r.id)))
    toast.success(`${rows.length} record(s) archived.`)
  }

  const monthName = new Date().toLocaleDateString("en-US", { month: "long" })

  return (
    <Wrapper>
      <div className="space-y-3">
        {/* ── Header ── */}
        <PageHeader
          icon={Users}
          title="Attendance"
          description="View, filter, and manage attendance records."
          breadcrumbs={["Attendance"]}
          onRefresh={refetch}
          actionButton={
            isAdmin ? (
              <div className="flex items-center gap-2">
                <MarkAbsentDialog />
                <Button onClick={() => openCreateSheet()}>
                  <Plus className="mr-2 size-4" />
                  Add
                </Button>
              </div>
            ) : undefined
          }
          variant="compact"
        />

        {/* ── Compact Metrics Strip ── */}
        <CompactMetrics
          stats={stats}
          isLoading={isLoadingMonthly}
          monthName={monthName}
        />

        {/* ── Calendar Toggle + Date Chip ── */}
        <div className="rounded-lg border bg-muted/20 px-3 py-2.5 space-y-2.5">
          <div className="flex flex-wrap items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowCalendar((v) => !v)}
              className="gap-2 text-xs"
            >
              <CalendarDays className="h-3.5 w-3.5" />
              Calendar
              {showCalendar ? (
                <ChevronUp className="h-3 w-3" />
              ) : (
                <ChevronDown className="h-3 w-3" />
              )}
            </Button>

            {selectedDate && (
              <Button
                variant="secondary"
                size="sm"
                onClick={clearSelectedDate}
                className="gap-1.5 text-xs h-7"
              >
                {String(selectedDate)}
                <X className="h-3 w-3" />
              </Button>
            )}

            <Button
              variant="ghost"
              size="sm"
              onClick={() =>
                push({ page: 1, limit, search, ordering, filter: {} })
              }
              className="gap-1.5 text-xs"
            >
              <Filter className="h-3.5 w-3.5" />
              Reset filters
            </Button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-2">
            <Select
              value={String(filter?.employee_id || "all")}
              onValueChange={(value) => updateFilter("employee_id", value)}
            >
              <SelectTrigger className="h-8 text-xs bg-background">
                <SelectValue placeholder="All employees" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All employees</SelectItem>
                {employeeOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select
              value={String(filter?.status || "all")}
              onValueChange={(value) => updateFilter("status", value)}
            >
              <SelectTrigger className="h-8 text-xs bg-background">
                <SelectValue placeholder="All statuses" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All statuses</SelectItem>
                <SelectItem value="PENDING">Pending</SelectItem>
                <SelectItem value="APPROVED">Approved</SelectItem>
                <SelectItem value="REJECTED">Rejected</SelectItem>
              </SelectContent>
            </Select>

            <Select
              value={String(filter?.attendance_type || "all")}
              onValueChange={(value) => updateFilter("attendance_type", value)}
            >
              <SelectTrigger className="h-8 text-xs bg-background">
                <SelectValue placeholder="All types" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All types</SelectItem>
                <SelectItem value="FULL_DAY">Full Day</SelectItem>
                <SelectItem value="HALF_DAY">Half Day</SelectItem>
                <SelectItem value="PARTIAL">Partial</SelectItem>
                <SelectItem value="ABSENT">Absent</SelectItem>
                <SelectItem value="LEAVE">Leave</SelectItem>
                <SelectItem value="SHOP_CLOSED">Shop Closed</SelectItem>
                <SelectItem value="INVALID">Invalid</SelectItem>
              </SelectContent>
            </Select>

            <Button
              variant="outline"
              size="sm"
              className="h-8 text-xs"
              onClick={() => setShowCalendar(true)}
            >
              Pick date from calendar
            </Button>
          </div>
        </div>

        {/* ── Collapsible Calendar ── */}
        {showCalendar && (
          <div className="rounded-lg border overflow-hidden">
            <DashboardCalendar
              mode="attendance"
              useCustomData
              attendanceData={calendarAttendances}
              onDateClick={handleDateClick}
              title=""
              description=""
              eventTypes={["attendance"]}
            />
          </div>
        )}

        {/* ── Main Table ── */}
        <DataTable
          enableVirtualization
          enableRowSelection
          title="Attendance Records"
          description="Manage records with inline approval actions and bulk operations."
          columns={columns}
          data={
            data || { count: 0, next: null, previous: null, results: [] }
          }
          isLoading={isLoading}
          filters={filters}
          orderingOptions={orderingOptions}
          onRefresh={refetch}
          bulkActions={[
            {
              label: "Approve",
              icon: CheckCircle2,
              variant: "outline",
              onClick: handleBulkApprove,
            },
            {
              label: "Reject",
              icon: X,
              variant: "destructive",
              onClick: handleBulkReject,
            },
            {
              label: "Archive",
              icon: ClipboardList,
              variant: "destructive",
              onClick: handleBulkArchive,
            },
          ]}
          emptyTitle="No records found"
          emptyDescription="Adjust filters or use the calendar to add a record."
        />
      </div>

      {/* ── Sheets & Dialogs ── */}
      <EntitySheet<DailyAttendance>
        open={editOpen}
        onClose={closeEdit}
        entity={entity}
        title="Edit Attendance"
        description="Update clock times, type, or status."
        withCloseConfirmation
        renderForm={({ forceClose, entity: att }) => (
          <AttendanceForm
            attendance={att}
            onClose={closeEdit}
            forceClose={forceClose}
          />
        )}
        className="sm:min-w-5xl sm:max-w-[1200px]"
      />

      <EntitySheet<AttendanceDraftSeed>
        open={addOpen}
        onClose={() => setAddOpen(false)}
        entity={draftSeed}
        title="Add Attendance"
        description="Create a manual attendance record."
        withCloseConfirmation
        renderForm={({ forceClose, entity: seed }) => (
          <AttendanceForm
            initialDate={seed?.date}
            initialEmployeeId={seed?.employeeId}
            onClose={() => setAddOpen(false)}
            forceClose={forceClose}
          />
        )}
        className="sm:min-w-5xl sm:max-w-[1200px]"
      />

      <ConfirmDialog
        open={deleteDialogOpen}
        onCancel={() => setDeleteDialogOpen(false)}
        onConfirm={confirmDelete}
        title="Archive attendance"
        description="This removes the record from the active list."
        confirmText="Archive"
        variant="warning"
      />
    </Wrapper>
  )
}

/* ─────────────────────────────────────────────────────────
 * Compact inline metrics — replaces 7 stat cards with one row
 * ───────────────────────────────────────────────────────── */
function CompactMetrics({
  stats,
  isLoading,
  monthName,
}: {
  stats: {
    totalCount: number
    approvedCount: number
    pendingCount: number
    rejectedCount: number
    presentCount: number
    absentCount: number
    lateCount: number
  }
  isLoading: boolean
  monthName: string
}) {
  if (isLoading) {
    return (
      <div className="flex items-center gap-3 px-1">
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} className="h-4 w-16" />
        ))}
      </div>
    )
  }

  return (
    <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5 text-xs text-muted-foreground px-1">
      <span className="font-semibold uppercase tracking-wider text-[10px]">
        {monthName}
      </span>
      <Separator orientation="vertical" className="h-3.5" />
      <span>
        <strong className="text-foreground tabular-nums">
          {stats.totalCount}
        </strong>{" "}
        records
      </span>
      <span className="text-emerald-600 dark:text-emerald-400">
        <strong className="tabular-nums">{stats.approvedCount}</strong> approved
      </span>
      {stats.pendingCount > 0 && (
        <span className="text-amber-600 dark:text-amber-400 font-medium">
          <strong className="tabular-nums">{stats.pendingCount}</strong> pending
        </span>
      )}
      {stats.rejectedCount > 0 && (
        <span className="text-red-600 dark:text-red-400">
          <strong className="tabular-nums">{stats.rejectedCount}</strong>{" "}
          rejected
        </span>
      )}
      <Separator orientation="vertical" className="h-3.5" />
      <span className="text-emerald-600 dark:text-emerald-400">
        {stats.presentCount} present
      </span>
      <span className="text-rose-600 dark:text-rose-400">
        {stats.absentCount} absent
      </span>
      {stats.lateCount > 0 && (
        <span className="text-amber-600 dark:text-amber-400">
          {stats.lateCount} late
        </span>
      )}
    </div>
  )
}
